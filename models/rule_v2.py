"""Model B: enhanced rule-based analysis with safer phrasing."""

from backend.analyzer import analyze_document
from rag_retriever import enrich_result_with_domain_knowledge


SAFETY_PHRASES = {
    "확인 필요": "확인 필요",
    "주의": "주의",
    "전문가에게 문의": "전문가에게 문의",
}

TERMS_EXTRA_KEYWORDS = [
    "무료 이용 기간", "별도 고지 없이", "매월 청구", "결제 취소",
    "이용 중지", "수집 및 이용", "외부 업체 제공",
]

NOTICE_EXTRA_KEYWORDS = [
    "마감일", "접수 기간", "행사 장소", "지참 서류", "사전 신청", "참여 대상",
]

PAPER_EXTRA_KEYWORDS = [
    "본 연구는", "제안 방법", "실험 결과", "성능 비교", "향후 연구", "제한 사항",
]


def _enhance_summary(result: dict, text: str) -> str:
    summary = str(result.get("summary", ""))
    lowered = text.lower()

    if any(term in lowered for term in ("위법", "법적", "진단", "처방", "투자", "보장", "무조건")):
        summary = "이 문서는 법률·의료·금융 판단처럼 단정하지 않고, 확인 필요와 전문가 문의를 권장합니다."
        if "확인 필요" not in summary:
            summary += " 확인 필요합니다."
    else:
        if result.get("document_type") == "terms":
            summary = summary + " 추가로 무료 이용 기간, 결제 취소, 수집 및 이용 항목도 함께 확인하세요."
        elif result.get("document_type") == "notice":
            summary = summary + " 공지의 마감일, 접수 기간, 참여 대상도 함께 확인하세요."
        elif result.get("document_type") == "paper":
            summary = summary + " 본 연구의 제안 방법과 제한 사항을 함께 점검하세요."

    return summary


def _enhance_cards(result: dict, text: str) -> list:
    cards = list(result.get("cards", []))
    lowered = text.lower()

    if "무료 이용 기간" in lowered or "무료 체험" in lowered:
        cards.append({
            "category": "무료 이용 기간",
            "title": "무료 이용 기간 확인",
            "original_sentence": "무료 이용 기간 또는 무료체험 기간을 확인해야 합니다.",
            "level": "보통",
            "message": "무료 이용 기간이 끝난 뒤 요금이나 이용 조건이 달라질 수 있으니 주의가 필요합니다.",
        })

    if "결제 취소" in lowered or "환불" in lowered:
        cards.append({
            "category": "결제 취소",
            "title": "결제 취소 관련 확인",
            "original_sentence": "결제 취소 또는 환불 가능 여부를 다시 확인하세요.",
            "level": "높음",
            "message": "환불과 결제 취소 조건은 확인 필요가 높은 항목입니다.",
        })

    if any(term in lowered for term in ("위법", "법적", "진단", "처방", "투자", "보장", "무조건")):
        for card in cards:
            card["message"] = card.get("message", "").replace("확정", "확인 필요")
            if "무조건" in card.get("message", ""):
                card["message"] = card["message"].replace("무조건", "주의")

    return cards


def analyze_with_rule_v2(text: str, use_rag: bool = True) -> dict:
    """Create a safer, enhanced variant of the current analyzer output."""
    result = analyze_document(text)
    result["model"] = "rule_v2"
    result["summary"] = _enhance_summary(result, text)
    result["cards"] = _enhance_cards(result, text)

    checklist = list(result.get("checklist", []))
    if any(term in text.lower() for term in ("위법", "진단", "보장", "무조건")):
        checklist.insert(0, "민감한 문서는 전문가에게 문의해 확인하세요.")

    result["checklist"] = checklist

    if use_rag:
        result = enrich_result_with_domain_knowledge(result)

    return result
