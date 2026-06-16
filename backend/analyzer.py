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
    "contract": "계약서/약정서",
    "other": "기타",
}

_CONTRACT_FILENAME_HINTS = ["계약서", "약정서", "임대차", "약정", "계약"]


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
    categories = ", ".join(sorted({item["category"] for item in cards})) if cards else "핵심 정보"

    if document_type == "contract":
        summary = "계약서로 보여요. 금액, 기간, 해지 조건, 특약을 먼저 확인해 보세요."
    elif document_type == "terms":
        summary = f"약관/동의서 문서로 보이며, {categories} 항목을 확인해야 합니다."
    elif document_type == "notice":
        summary = f"공지문/안내문으로 보이며, {categories} 항목을 빠르게 점검할 필요가 있습니다."
    elif document_type == "paper":
        summary = f"논문/보고서로 보이며, {categories} 항목을 중심으로 읽으면 이해가 쉬워집니다."
    elif filename_is_contract:
        # Type was unclear but the filename looks like a contract — stay reassuring.
        summary = "계약서로 보이는 문서예요. 금액과 조건을 먼저 확인해 보세요."
    else:
        summary = "문서 유형은 확실하지 않지만, 꼭 확인할 조건을 먼저 정리했어요."

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
