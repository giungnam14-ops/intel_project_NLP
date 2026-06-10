"""Simple PII masking helpers for input and output text."""

from __future__ import annotations

import re
from typing import Any


EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"(?:010|011|016|017|018|019)[- ]?\d{3,4}[- ]?\d{4}")
RRN_RE = re.compile(r"\d{6}[- ]?\d{7}")
CARD_RE = re.compile(r"(?:\d[ -]?){15,19}")
ACCOUNT_RE = re.compile(r"\d{3,4}[- ]?\d{2,4}[- ]?\d{3,4}[- ]?\d{3,4}")


def _mask_email(match: re.Match[str]) -> str:
    return "[EMAIL]"


def _mask_phone(match: re.Match[str]) -> str:
    return "[PHONE]"


def _mask_rrn(match: re.Match[str]) -> str:
    return "[RRN]"


def _mask_card(match: re.Match[str]) -> str:
    return "[CARD_OR_ACCOUNT]"


def mask_pii_text(text: str) -> str:
    """Mask obvious PII-like values in a string."""
    value = text or ""
    value = EMAIL_RE.sub(_mask_email, value)
    value = PHONE_RE.sub(_mask_phone, value)
    value = RRN_RE.sub(_mask_rrn, value)
    value = CARD_RE.sub(_mask_card, value)
    value = ACCOUNT_RE.sub(_mask_card, value)
    return value


def _mask_value(value: Any) -> Any:
    if isinstance(value, str):
        return mask_pii_text(value)
    if isinstance(value, list):
        return [_mask_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _mask_value(val) for key, val in value.items()}
    return value


def mask_pii_in_result(result: dict) -> dict:
    """Recursively mask PII-like text inside analysis results."""
    return _mask_value(result)
