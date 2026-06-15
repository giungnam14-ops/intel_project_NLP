"""High-level document analysis orchestration for the 5초 문서체크 MVP."""

from __future__ import annotations

from backend.classifier import classify_document
from backend.checklist import generate_checklist
from backend.explainer import explain_item
from backend.extractor import extract_items
from backend.key_facts import build_insights, empty_facts


_DOCUMENT_TYPE_LABELS = {
    "terms": "약관/동의서",
    "notice": "공지문/안내문",
    "paper": "논문/보고서",
    "other": "기타",
}


def analyze_document(text: str) -> dict:
    """Analyze a document and return a JSON-friendly result dictionary."""
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

    document_type = classify_document(cleaned)
    document_type_label = _DOCUMENT_TYPE_LABELS.get(document_type, "기타")
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
    categories = ", ".join(sorted({item["category"] for item in cards})) if cards else "핵심 정보"

    if document_type == "terms":
        summary = f"약관/동의서 문서로 보이며, {categories} 항목을 확인해야 합니다."
    elif document_type == "notice":
        summary = f"공지문/안내문으로 보이며, {categories} 항목을 빠르게 점검할 필요가 있습니다."
    elif document_type == "paper":
        summary = f"논문/보고서로 보이며, {categories} 항목을 중심으로 읽으면 이해가 쉬워집니다."
    else:
        summary = "문서 유형을 특정하기 어려우므로 핵심 문장과 체크리스트를 먼저 확인해 보세요."

    risk_level = "높음" if any(card["level"] == "높음" for card in cards) else "보통"

    insights = build_insights(cleaned)

    return {
        "document_type": document_type,
        "document_type_label": document_type_label,
        "risk_level": risk_level,
        "summary": summary,
        "cards": cards,
        "checklist": checklist,
        "highlights": insights["highlights"],
        "key_facts": insights["key_facts"],
    }
