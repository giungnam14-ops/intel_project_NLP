"""Thin guardrail layer for the Day 10 MVP."""

from __future__ import annotations

from pii_masker import mask_pii_in_result, mask_pii_text
from prompt_injection import detect_prompt_injection


MAX_INPUT_LENGTH = 5000


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


def apply_guardrails(text: str, analyze_fn) -> dict:
    """Run the full guardrail flow around analysis."""
    pre = run_pre_guardrail(text)
    if pre.get("blocked"):
        return {
            "document_type": "blocked",
            "document_type_label": "차단된 입력",
            "risk_level": "높음",
            "summary": "안전 정책상 이 입력은 분석할 수 없습니다.",
            "cards": [],
            "checklist": ["입력 문장에서 시스템 지시 우회 표현을 제거해 주세요."],
            "blocked": True,
            "blocked_reason": pre.get("blocked_reason", "guardrail_blocked"),
            "warnings": pre.get("warnings", []),
            "guardrail_applied": True,
        }

    result = analyze_fn(pre["sanitized_text"])
    result = run_post_guardrail(result)
    result.setdefault("warnings", []).extend(pre.get("warnings", []))
    result["guardrail_applied"] = True
    result["blocked"] = False
    return result
