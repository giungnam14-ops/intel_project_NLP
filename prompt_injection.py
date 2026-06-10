"""Simple prompt-injection detection for the Day 10 guardrail layer."""

from __future__ import annotations

import re
from typing import Any


INJECTION_PATTERNS = [
    ("high", r"ignore previous instruction|ignore all previous|system prompt|developer message|jailbreak|guardrail bypass|정책 우회|안전장치 해제|이전 지시.*무시|이전 명령.*무시"),
    ("medium", r"관리자 권한|역할 변경|너는 이제부터|모든 규칙을 무시|ignore previous|ignore all"),
]


def detect_prompt_injection(text: str) -> dict[str, Any]:
    """Detect likely prompt-injection or instruction override attempts."""
    lowered = (text or "").lower()
    reasons = []
    detected_risk = "none"

    for risk_level, pattern in INJECTION_PATTERNS:
        matched = re.search(pattern, lowered, re.IGNORECASE)
        if matched:
            reasons.append(matched.group(0))
            if risk_level == "high":
                detected_risk = "high"
            elif detected_risk != "high" and risk_level == "medium":
                detected_risk = "medium"
            elif detected_risk == "none":
                detected_risk = "low"

    detected = bool(reasons)
    return {
        "detected": detected,
        "risk_level": detected_risk if detected else "none",
        "reasons": reasons,
    }
