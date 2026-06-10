"""Keyword-based document classifier for the 5초 문서체크 MVP."""

from __future__ import annotations


TERMS_KEYWORDS = [
    "회원", "동의", "개인정보", "환불", "해지", "결제", "자동결제", "자동 결제",
    "책임", "이용약관", "제3자", "무료체험", "정기결제", "월 이용료"
]
NOTICE_KEYWORDS = [
    "일시", "장소", "준비물", "제출", "신청", "대상", "기한", "안내", "참가",
    "접수", "마감", "날짜", "기간", "주소", "지참", "등록"
]
PAPER_KEYWORDS = [
    "연구", "방법", "결과", "실험", "데이터", "분석", "한계", "제안", "논문",
    "보고서", "목적", "성능", "모델", "문제"
]


def classify_document(text: str) -> str:
    """Return the most likely document type based on keyword frequency."""
    lowered = text.lower()

    scores = {
        "terms": 0,
        "notice": 0,
        "paper": 0,
    }

    for keyword in TERMS_KEYWORDS:
        if keyword.lower() in lowered:
            scores["terms"] += 1
    for keyword in NOTICE_KEYWORDS:
        if keyword.lower() in lowered:
            scores["notice"] += 1
    for keyword in PAPER_KEYWORDS:
        if keyword.lower() in lowered:
            scores["paper"] += 1

    best_type = max(scores, key=scores.get)
    if scores[best_type] == 0:
        return "other"

    return best_type
