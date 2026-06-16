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
# Distinctive contract / agreement vocabulary. Bare "갑"/"을"/"원" are excluded
# on purpose (too common as substrings) to avoid false positives.
CONTRACT_KEYWORDS = [
    "계약서", "계약", "약정", "임대인", "임차인", "매도인", "매수인", "계약금",
    "중도금", "잔금", "보증금", "월세", "임대차", "임대차계약", "목적물", "특약",
    "계약기간", "계약 기간", "해제", "위약금", "손해배상", "날인", "갑과 을"
]
# Filename hints that strongly imply a contract was uploaded.
_CONTRACT_FILENAME_HINTS = ["계약서", "약정서", "임대차", "약정", "계약"]


def classify_document(text: str, filename: str = "") -> str:
    """Return the most likely document type based on keyword frequency.

    ``filename`` is optional; when it looks like a contract it strongly boosts
    the contract score. Backward compatible: callers may omit it.
    """
    lowered = text.lower()

    scores = {
        "terms": 0,
        "notice": 0,
        "paper": 0,
        "contract": 0,
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
    for keyword in CONTRACT_KEYWORDS:
        if keyword.lower() in lowered:
            scores["contract"] += 1

    # A contract-looking filename is a strong signal the user uploaded a contract.
    fname = (filename or "")
    if any(hint in fname for hint in _CONTRACT_FILENAME_HINTS):
        scores["contract"] += 5

    best_type = max(scores, key=scores.get)
    if scores[best_type] == 0:
        return "other"

    return best_type
