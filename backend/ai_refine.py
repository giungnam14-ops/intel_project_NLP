"""Optional AI-powered deep analysis (hybrid mode).

The base product analyzes documents with a rule-based, no-LLM engine (privacy
first, no hallucination). This module adds an *opt-in* deeper analysis powered
by Claude. It is intentionally isolated and fully optional:

- The document text is PII-masked before it is ever sent.
- If the ``anthropic`` SDK is not installed or ``ANTHROPIC_API_KEY`` is not set,
  ``ai_refine`` returns ``{"available": False, ...}`` instead of raising, so the
  rest of the app keeps working unchanged.

Nothing here touches the existing ``/analyze`` or ``/ask`` flows.
"""

from __future__ import annotations

import os
from typing import Any

from pii_masker import mask_pii_text

# Cap how much text we send to bound cost/latency. The model has a large context
# window; this is a pragmatic ceiling, not a context limit.
MAX_INPUT_CHARS = 30000

# Cost-efficient model. (Haiku 4.5 supports structured outputs; it does not use
# the adaptive-thinking parameter, so we omit `thinking` in the call below.)
MODEL = "claude-haiku-4-5"

SYSTEM_PROMPT = (
    "당신은 약관·계약서·공지문·논문 같은 어려운 문서를 일반 사용자가 쉽게 이해하도록"
    " 풀어주는 한국어 전문가입니다. 반드시 다음을 지키세요.\n"
    "1) 문서에 실제로 적힌 내용만 사용하고, 없는 사실을 지어내지 마세요.\n"
    "2) 각 핵심 포인트의 quote 값에는 문서에서 그대로 복사한 '실제 문장'을 한 문장 넣으세요"
    " (요약·각색 금지). 사용자가 그 문장을 문서에서 형광펜으로 찾을 수 있어야 합니다.\n"
    "3) 두루뭉술한 조언('약관을 확인하세요') 대신, 어느 문장의 무엇을 봐야 하는지 구체적으로"
    " 설명하세요.\n"
    "4) 돈·기간·해지·환불·자동결제·책임·개인정보처럼 사용자에게 불리하거나 중요한 조항을"
    " 우선 골라내세요.\n"
    "5) plain_explanation은 초등학생도 이해할 만큼 쉬운 말로 2~4문장 쓰세요."
)

# JSON schema for structured output (no recursion, additionalProperties:false).
OUTPUT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "key_points": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "detail": {"type": "string"},
                    "quote": {"type": "string"},
                    "level": {"type": "string", "enum": ["high", "medium", "low"]},
                },
                "required": ["title", "detail", "quote", "level"],
                "additionalProperties": False,
            },
        },
        "watch_outs": {"type": "array", "items": {"type": "string"}},
        "plain_explanation": {"type": "string"},
    },
    "required": ["summary", "key_points", "watch_outs", "plain_explanation"],
    "additionalProperties": False,
}


def ai_available() -> bool:
    """Cheap check (no API call) for whether the AI feature is configured.

    Used to hide the opt-in UI entirely until an operator sets a key — keeping
    the free, rule-based product clean while leaving the feature ready to flip
    on later for a paid tier.
    """
    if not os.getenv("ANTHROPIC_API_KEY", "").strip():
        return False
    try:
        import anthropic  # noqa: F401
    except ImportError:
        return False
    return True


def _unavailable(reason: str) -> dict[str, Any]:
    return {"available": False, "error": reason}


def ai_refine(document_text: str) -> dict[str, Any]:
    """Run an optional, deeper AI analysis on the document.

    Returns a dict with ``available: True`` plus the structured analysis on
    success, or ``available: False`` with an ``error`` message when the feature
    is not configured or the call fails. Never raises for the missing-key path.
    """
    text = (document_text or "").strip()
    if not text:
        return _unavailable("분석할 문서 내용이 없습니다.")

    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return _unavailable("AI 정밀 분석이 아직 설정되지 않았어요. (서버에 API 키 필요)")

    try:
        import anthropic  # lazy: keep base app working without the SDK installed
    except ImportError:
        return _unavailable("AI 정밀 분석 라이브러리가 설치되지 않았어요.")

    truncated = len(text) > MAX_INPUT_CHARS
    masked = mask_pii_text(text[:MAX_INPUT_CHARS])

    user_prompt = (
        "다음 문서를 분석해서 일반 사용자가 가장 먼저 확인해야 할 핵심을 정리해 주세요.\n"
        "개인정보로 보이는 값은 이미 [EMAIL] 같은 표시로 가려져 있습니다.\n\n"
        "=== 문서 시작 ===\n"
        f"{masked}\n"
        "=== 문서 끝 ==="
    )

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model=MODEL,
            max_tokens=4000,
            system=SYSTEM_PROMPT,
            output_config={"format": {"type": "json_schema", "schema": OUTPUT_SCHEMA}},
            messages=[{"role": "user", "content": user_prompt}],
        )
    except anthropic.AuthenticationError:
        return _unavailable("AI 분석 키가 올바르지 않아요.")
    except anthropic.RateLimitError:
        return _unavailable("지금 AI 분석 요청이 많아요. 잠시 후 다시 시도해 주세요.")
    except anthropic.APIError as exc:  # pragma: no cover - network dependent
        return _unavailable(f"AI 분석 중 문제가 발생했어요. ({getattr(exc, 'status_code', 'API')})")
    except Exception:  # pragma: no cover - defensive
        return _unavailable("AI 분석 중 알 수 없는 문제가 발생했어요.")

    if getattr(response, "stop_reason", None) == "refusal":
        return _unavailable("이 문서는 AI 정밀 분석을 진행할 수 없었어요.")

    # output_config.format guarantees a text block with valid JSON; find it.
    import json

    raw = next((b.text for b in response.content if getattr(b, "type", None) == "text"), "")
    try:
        data = json.loads(raw)
    except (ValueError, TypeError):
        return _unavailable("AI 분석 결과를 해석하지 못했어요.")

    return {
        "available": True,
        "summary": str(data.get("summary", "")),
        "key_points": [
            {
                "title": str(p.get("title", "")),
                "detail": str(p.get("detail", "")),
                "quote": str(p.get("quote", "")),
                "level": p.get("level", "medium")
                if p.get("level") in ("high", "medium", "low")
                else "medium",
            }
            for p in (data.get("key_points") or [])
            if isinstance(p, dict)
        ],
        "watch_outs": [str(w) for w in (data.get("watch_outs") or []) if str(w).strip()],
        "plain_explanation": str(data.get("plain_explanation", "")),
        "model": MODEL,
        "truncated": truncated,
    }
