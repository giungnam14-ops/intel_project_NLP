"""Thin guardrail layer for the Day 10 MVP."""

from __future__ import annotations

from pii_masker import mask_pii_in_result, mask_pii_text
from prompt_injection import detect_prompt_injection


MAX_INPUT_LENGTH = 5000

_MAX_SECURITY_HIGHLIGHTS = 5


def build_security_highlights(text: str, low_quality: bool = False) -> list[dict]:
    """Turn prompt-injection-looking sentences into '보안 주의' highlights.

    Used by /analyze so a document is still analyzed instead of hard-blocked.
    The text passed in should already be PII-sanitized.
    """
    # Imported lazily to avoid any import-order surprises at module load.
    from backend.extractor import split_sentences

    base_reason = "문서 안에 AI 지시를 조작하려는 문구가 포함되어 있습니다."
    ocr_caveat = " OCR 인식 오류 가능성이 있어 보안 주의 문구가 잘못 감지되었을 수 있습니다."
    reason = base_reason + (ocr_caveat if low_quality else "")
    severity = "medium" if low_quality else "high"

    highlights: list[dict] = []
    for sentence in split_sentences(text):
        if detect_prompt_injection(sentence).get("detected"):
            highlights.append(
                {
                    "id": f"security-{len(highlights) + 1}",
                    "label": "보안 주의",
                    "severity": severity,
                    "source_text": sentence,
                    "reason": reason,
                }
            )
        if len(highlights) >= _MAX_SECURITY_HIGHLIGHTS:
            break

    # Detection may fire on the whole text but not on any single sentence.
    if not highlights:
        snippet = text.strip().replace("\n", " ")
        if len(snippet) > 160:
            snippet = snippet[:160] + "…"
        highlights.append(
            {
                "id": "security-1",
                "label": "보안 주의",
                "severity": severity,
                "source_text": snippet,
                "reason": reason,
            }
        )

    return highlights


def run_pre_guardrail(text: str) -> dict:
    """Validate and sanitize user input before analysis."""
    cleaned = (text or "").strip()
    warnings = []

    if not cleaned:
        return {
            "blocked": True,
            "blocked_reason": "empty_input",
            "sanitized_text": "",
            "warnings": ["입력 문서가 비어 있습니다."],
            "prompt_injection": {"detected": False, "risk_level": "none", "reasons": []},
        }

    sanitized_text = mask_pii_text(cleaned)
    injection = detect_prompt_injection(sanitized_text)

    if len(sanitized_text) > MAX_INPUT_LENGTH:
        return {
            "blocked": True,
            "blocked_reason": "input_too_long",
            "sanitized_text": sanitized_text[:MAX_INPUT_LENGTH],
            "warnings": ["입력 길이가 제한을 초과했습니다."],
            "prompt_injection": injection,
        }

    if injection.get("detected") and injection.get("risk_level") == "high":
        return {
            "blocked": True,
            "blocked_reason": "prompt_injection_detected",
            "sanitized_text": sanitized_text,
            "warnings": ["시스템 지시 우회 표현이 감지되었습니다."],
            "prompt_injection": injection,
        }

    if injection.get("detected"):
        warnings.append("의심스러운 명령 조작 표현이 감지되었습니다.")

    if sanitized_text != cleaned:
        warnings.append("PII가 마스킹되었습니다.")

    return {
        "blocked": False,
        "sanitized_text": sanitized_text,
        "warnings": warnings,
        "prompt_injection": injection,
    }


def run_post_guardrail(result: dict) -> dict:
    """Apply post-output guardrails to analysis results."""
    masked_result = mask_pii_in_result(result)

    softening_map = {
        "위법 확정": "위법 여부를 확인 필요로 검토해야 합니다.",
        "반드시 가능": "가능 여부를 확인 필요로 검토해야 합니다.",
        "보장": "확인 필요",
        "무조건": "주의",
        "확정": "확인 필요",
    }

    def soften_text(value: str) -> str:
        text = value
        for old, new in softening_map.items():
            text = text.replace(old, new)
        return text

    if isinstance(masked_result, dict):
        for key in ("summary", "message", "original_sentence"):
            if key in masked_result and isinstance(masked_result[key], str):
                masked_result[key] = soften_text(masked_result[key])

        if isinstance(masked_result.get("cards"), list):
            for card in masked_result["cards"]:
                if isinstance(card, dict):
                    for key in ("message", "title", "original_sentence"):
                        if isinstance(card.get(key), str):
                            card[key] = soften_text(card[key])

        if isinstance(masked_result.get("checklist"), list):
            masked_result["checklist"] = [soften_text(item) if isinstance(item, str) else item for item in masked_result["checklist"]]

    masked_result["guardrail_applied"] = True
    return masked_result


def run_tool_guardrail(tool_name: str, payload: dict) -> dict:
    """Validate external-style tool usage through the lightweight guardrail."""
    from tool_guardrail import validate_tool_call, safe_mock_tool_call

    validation = validate_tool_call(tool_name, payload)
    if not validation["allowed"]:
        return {"allowed": False, "reason": validation["reason"]}

    return safe_mock_tool_call(tool_name, payload)


def apply_guardrails(text: str, analyze_fn, ocr_low_quality: bool = False) -> dict:
    """Run the full guardrail flow around analysis.

    Document-level prompt injection is NO LONGER a hard block: 문요 is a document
    analyzer, so the document is still analyzed and the suspicious sentences are
    surfaced as '보안 주의' highlights. Only genuinely unprocessable input
    (empty / too long) is hard-blocked. User questions are still blocked in
    /ask via document_qa, and tool calls via tool_guardrail.
    """
    pre = run_pre_guardrail(text)
    injection = pre.get("prompt_injection", {}) or {}
    blocked_reason = pre.get("blocked_reason")

    # Hard-block only for input we truly cannot analyze.
    if pre.get("blocked") and blocked_reason in ("empty_input", "input_too_long"):
        reason_text = (
            "입력이 비어 있어 분석할 수 없습니다."
            if blocked_reason == "empty_input"
            else "입력 길이가 제한을 초과하여 분석할 수 없습니다. 문서를 나눠서 분석해 주세요."
        )
        return {
            "document_type": "blocked",
            "document_type_label": "분석 불가",
            "risk_level": "보통",
            "summary": reason_text,
            "cards": [],
            "checklist": ["입력 길이를 줄이거나 문서를 나눠서 다시 시도해 주세요."],
            "blocked": True,
            "blocked_reason": blocked_reason,
            "warnings": pre.get("warnings", []),
            "guardrail_applied": True,
        }

    result = analyze_fn(pre["sanitized_text"])
    result = run_post_guardrail(result)

    warnings = list(pre.get("warnings", []))

    # Prompt injection inside the document → annotate, don't block.
    if injection.get("detected"):
        security = build_security_highlights(pre["sanitized_text"], ocr_low_quality)
        result["highlights"] = security + list(result.get("highlights") or [])
        result["security_notice"] = True
        warnings.append("문서 안에 AI 지시를 조작하려는 표현이 있어 보안 주의 문장으로 표시했습니다.")
    else:
        result.setdefault("security_notice", False)

    result["warnings"] = list(result.get("warnings", [])) + warnings
    result["guardrail_applied"] = True
    result["blocked"] = False
    result.setdefault("blocked_reason", None)
    return result
