"""High-level document analysis orchestration for the 5초 문서체크 MVP."""

from __future__ import annotations

from backend.action_items import extract_action_items
from backend.classifier import classify_document
from backend.checklist import generate_checklist
from backend.explainer import explain_item
from backend.extractor import extract_items
from backend.fraud_signals import detect_fraud
from backend.key_facts import build_insights, empty_facts


_DOCUMENT_TYPE_LABELS = {
    "terms": "약관/동의서",
    "notice": "공지문/안내문",
    "paper": "논문/보고서",
    "contract": "계약서/약정서",
    "other": "기타",
}

# Short, friendly word per type for the content-aware summary.
_TYPE_WORD = {
    "terms": "약관/동의서",
    "notice": "공지문",
    "paper": "논문/보고서",
    "contract": "계약서",
}

_CONTRACT_FILENAME_HINTS = ["계약서", "약정서", "임대차", "약정", "계약"]


def _top_labels(items: list[dict], limit: int = 3) -> list[str]:
    """Unique label list (order-preserving) for a content-aware summary."""
    labels: list[str] = []
    for item in items:
        label = item.get("label")
        if label and label not in labels:
            labels.append(label)
        if len(labels) >= limit:
            break
    return labels


def _build_summary(document_type, filename_is_contract, highlights, key_facts, fraud) -> str:
    """Build a content-aware summary from what was actually found.

    Names the concrete findings (warning labels, key money/dates) instead of a
    generic per-type sentence. Avoids quoting raw document text and definitive
    words (보장/무조건/확정) so it stays within the safety guidelines — concrete
    sentences are shown separately in the '가장 먼저 볼 것' section.
    """
    if fraud.get("suspected"):
        labels = _top_labels(fraud.get("signals", []))
        return (
            "⚠️ 사기 의심 신호가 보여요: "
            + ", ".join(labels)
            + ". 송금이나 개인정보 요구에는 응하지 말고, 공식 경로로 다시 확인하세요."
        )

    type_word = _TYPE_WORD.get(document_type) or ("계약서" if filename_is_contract else "문서")
    money = key_facts.get("money") or []
    dates = key_facts.get("dates") or []
    actions = key_facts.get("actions") or []

    if highlights:
        labels = _top_labels(highlights)
        lead = f"{type_word}예요. 주의해서 볼 조항 {len(highlights)}가지를 찾았어요: {', '.join(labels)}."
        facts = []
        if money:
            facts.append(money[0]["value"])
        if dates:
            facts.append(dates[0]["value"])
        if facts:
            lead += f" (예: {', '.join(facts[:2])})"
        return lead + " 동의·서명 전에 꼭 확인하세요."

    # No warning clauses — still try to be concrete with extracted facts.
    facts = []
    if money:
        facts.append(f"금액 {money[0]['value']}")
    if dates:
        facts.append(f"기한 {dates[0]['value']}")
    if actions:
        facts.append(actions[0]["value"])
    if facts:
        return f"{type_word}예요. 확인할 핵심: {', '.join(facts[:3])}."

    return f"{type_word}로 보여요. 눈에 띄는 위험 조항은 없지만, 금액·기한·조건은 한 번 더 확인하세요."


def analyze_document(text: str, filename: str = "") -> dict:
    """Analyze a document and return a JSON-friendly result dictionary.

    ``filename`` is optional and only used as a classification hint (e.g. an
    uploaded "전체계약서.pdf"). Backward compatible: callers may omit it.
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return {
            "document_type": "other",
            "document_type_label": "기타",
            "risk_level": "보통",
            "summary": "문서가 비어 있어 분석할 내용이 없습니다.",
            "cards": [],
            "checklist": ["문서를 붙여넣어 분석을 시작하세요."],
            "highlights": [],
            "key_facts": empty_facts(),
        }

    document_type = classify_document(cleaned, filename)
    document_type_label = _DOCUMENT_TYPE_LABELS.get(document_type, "기타")
    filename_is_contract = any(hint in (filename or "") for hint in _CONTRACT_FILENAME_HINTS)
    items = extract_items(cleaned, document_type)

    cards = []
    for item in items:
        cards.append({
            "category": item["category"],
            "title": item["title"],
            "original_sentence": item["original_sentence"],
            "level": item["level"],
            "message": explain_item(item, document_type),
        })

    checklist = generate_checklist(items, document_type)

    insights = build_insights(cleaned)
    fraud = detect_fraud(cleaned)
    action_items = extract_action_items(cleaned)

    summary = _build_summary(
        document_type, filename_is_contract, insights["highlights"], insights["key_facts"], fraud
    )

    # Surface fraud signals as high-severity highlights, shown before the rest.
    fraud_highlights = [
        {
            "id": f"fraud-{index + 1}",
            "label": signal["label"],
            "severity": "high",
            "source_text": signal["source_text"],
            "reason": signal["reason"],
        }
        for index, signal in enumerate(fraud["signals"])
    ]
    highlights = (fraud_highlights + insights["highlights"])[:8]

    high_signal = (
        fraud["suspected"]
        or any(card["level"] == "높음" for card in cards)
        or any(item["severity"] == "high" for item in insights["highlights"])
    )
    risk_level = "높음" if high_signal else "보통"

    return {
        "document_type": document_type,
        "document_type_label": document_type_label,
        "risk_level": risk_level,
        "summary": summary,
        "cards": cards,
        "checklist": checklist,
        "highlights": highlights,
        "key_facts": insights["key_facts"],
        "fraud_suspected": fraud["suspected"],
        "action_items": action_items,
    }
