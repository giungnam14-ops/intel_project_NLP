"""Rule-based key-fact and source-highlight extraction.

This module is additive: it scans a document sentence by sentence and pulls out
the things a user most needs to confirm (money, dates, required actions and
warnings), plus a small set of "source highlight" sentences with a severity and
a short reason. It never raises on bad input — empty/odd text yields empty
structures so the API response stays backward compatible.
"""

from __future__ import annotations

import re

from backend.extractor import split_sentences


_MAX_PER_CATEGORY = 5
_MAX_HIGHLIGHTS = 5

# --- Money ------------------------------------------------------------------
_AMOUNT_RES = [
    re.compile(r"[0-9][0-9,]*\s*(?:억|만|천)?\s*원"),
    re.compile(r"[0-9]+(?:\.[0-9]+)?\s*%"),
]
# Fee-style keywords that count as money even without a concrete number.
_MONEY_KEYWORDS = ["위약금", "수수료"]

# --- Dates / deadlines ------------------------------------------------------
_DATE_RES = [
    re.compile(r"[0-9]+\s*(?:일|주|주일|개월|달|년)\s*이내"),
    re.compile(r"[0-9]{4}\s*년\s*[0-9]{1,2}\s*월\s*[0-9]{1,2}\s*일"),
    re.compile(r"[0-9]{1,2}\s*월\s*[0-9]{1,2}\s*일(?:\s*까지)?"),
    re.compile(r"[0-9]+\s*(?:일|주|개월|달|년)\s*까지"),
]

# --- Actions / obligations --------------------------------------------------
# Ordered so the more specific "...해야" forms win over the bare verb.
_ACTION_RULES = [
    (["제출해야"], "제출 필요"),
    (["신청해야"], "신청 필요"),
    (["동의해야"], "동의 필요"),
    (["해지해야"], "해지 필요"),
    (["확인해야"], "확인 필요"),
    (["취소해야"], "직접 취소 필요"),
    (["변경해야"], "변경 필요"),
    (["서명"], "서명 필요"),
    (["취소"], "직접 취소 필요"),
    (["해지"], "해지 필요"),
    (["제출"], "제출 필요"),
    (["신청"], "신청 필요"),
    (["변경"], "변경 필요"),
]

# --- Warnings / risky conditions (also drive highlights) --------------------
_WARNING_RULES = [
    {"triggers": ["자동결제", "자동 결제"], "display": "자동결제", "severity": "high",
     "reason": "해지하지 않으면 비용이 계속 발생할 수 있습니다."},
    {"triggers": ["환불 불가", "환불되지", "환불이 제한", "환불 제한"], "display": "환불 제한", "severity": "high",
     "reason": "환불 조건이 제한되어 있어 미리 확인이 필요합니다."},
    {"triggers": ["책임지지 않", "책임을 지지 않", "면책", "책임이 제한"], "display": "책임 제한", "severity": "high",
     "reason": "사업자의 책임이 제한될 수 있습니다."},
    {"triggers": ["제3자", "제 3자"], "display": "제3자 제공", "severity": "high",
     "reason": "개인정보가 제3자에게 제공될 수 있습니다."},
    {"triggers": ["위약금"], "display": "위약금", "severity": "high",
     "reason": "중도 해지 시 위약금이 발생할 수 있습니다."},
    {"triggers": ["별도 고지 없이", "사전 고지 없이", "사전 안내 없이", "고지 없이"], "display": "사전 고지 없음", "severity": "medium",
     "reason": "사전 안내 없이 조건이 적용될 수 있습니다."},
    {"triggers": ["수수료"], "display": "수수료", "severity": "medium",
     "reason": "별도의 수수료가 부과될 수 있습니다."},
    {"triggers": ["제한"], "display": "이용 제한", "severity": "medium",
     "reason": "특정 조건에서 이용이 제한될 수 있습니다."},
]

_SEVERITY_RANK = {"high": 3, "medium": 2, "low": 1}


def empty_facts() -> dict:
    """Return an empty key_facts structure (all categories present, empty)."""
    return {"money": [], "dates": [], "actions": [], "warnings": []}


def extract_deadline(sentence: str) -> str:
    """Return the first date/deadline-looking substring in a sentence, or ''."""
    for pattern in _DATE_RES:
        match = pattern.search(sentence)
        if match:
            return re.sub(r"\s+", " ", match.group()).strip()
    return ""


def _money_label(sentence: str) -> str:
    if "위약금" in sentence:
        return "위약금"
    if "수수료" in sentence:
        return "수수료"
    if "자동" in sentence and ("매월" in sentence or "월" in sentence):
        return "월 자동결제 금액"
    if "환불" in sentence:
        return "환불 관련 금액"
    if "결제" in sentence:
        return "결제 금액"
    return "금액"


def _date_label(sentence: str) -> str:
    if "환불" in sentence:
        return "환불 가능 기간"
    if "제출" in sentence:
        return "제출 기한"
    if "신청" in sentence or "등록" in sentence:
        return "신청/등록 기한"
    if "마감" in sentence:
        return "마감 기한"
    return "날짜/기한"


def _collect_money(sentence: str) -> list[dict]:
    values: list[str] = []
    for pattern in _AMOUNT_RES:
        for match in pattern.findall(sentence):
            value = re.sub(r"\s+", "", match)
            if value and value not in values:
                values.append(value)

    if not values:
        for keyword in _MONEY_KEYWORDS:
            if keyword in sentence:
                values.append(keyword)
                break

    label = _money_label(sentence)
    return [{"value": value, "source_text": sentence, "label": label} for value in values]


def _collect_dates(sentence: str) -> list[dict]:
    values: list[str] = []
    for pattern in _DATE_RES:
        for match in pattern.findall(sentence):
            value = re.sub(r"\s+", " ", match).strip()
            if value and value not in values:
                values.append(value)

    label = _date_label(sentence)
    return [{"value": value, "source_text": sentence, "label": label} for value in values]


def _collect_action(sentence: str) -> list[dict]:
    for triggers, display in _ACTION_RULES:
        if any(trigger in sentence for trigger in triggers):
            return [{"value": display, "source_text": sentence, "label": "사용자 조치"}]
    return []


def _matched_warnings(sentence: str) -> list[dict]:
    matched = []
    for rule in _WARNING_RULES:
        if any(trigger in sentence for trigger in rule["triggers"]):
            matched.append(rule)
    return matched


def _dedupe_cap(items: list[dict], limit: int) -> list[dict]:
    seen = set()
    result = []
    for item in items:
        key = (item.get("label"), item.get("value"))
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
        if len(result) >= limit:
            break
    return result


def build_insights(text: str) -> dict:
    """Return {"highlights": [...], "key_facts": {...}} for the given text."""
    cleaned = (text or "").strip()
    if not cleaned:
        return {"highlights": [], "key_facts": empty_facts()}

    sentences = split_sentences(cleaned)

    money: list[dict] = []
    dates: list[dict] = []
    actions: list[dict] = []
    warnings: list[dict] = []
    highlights: list[dict] = []
    highlight_seen: set = set()

    for sentence in sentences:
        money.extend(_collect_money(sentence))
        dates.extend(_collect_dates(sentence))
        actions.extend(_collect_action(sentence))

        matched = _matched_warnings(sentence)
        for rule in matched:
            warnings.append({"value": rule["display"], "source_text": sentence, "label": "주의 조건"})

        if matched:
            # One highlight per sentence, using its highest-severity match.
            top = max(matched, key=lambda rule: _SEVERITY_RANK.get(rule["severity"], 0))
            key = (top["display"], sentence)
            if key not in highlight_seen:
                highlight_seen.add(key)
                highlights.append(
                    {
                        "id": f"highlight-{len(highlights) + 1}",
                        "label": top["display"],
                        "severity": top["severity"],
                        "source_text": sentence,
                        "reason": top["reason"],
                    }
                )

    return {
        "highlights": highlights[:_MAX_HIGHLIGHTS],
        "key_facts": {
            "money": _dedupe_cap(money, _MAX_PER_CATEGORY),
            "dates": _dedupe_cap(dates, _MAX_PER_CATEGORY),
            "actions": _dedupe_cap(actions, _MAX_PER_CATEGORY),
            "warnings": _dedupe_cap(warnings, _MAX_PER_CATEGORY),
        },
    }
