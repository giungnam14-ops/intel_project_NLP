"""Sentence extraction and category detection for document analysis."""

from __future__ import annotations

import re


CATEGORY_KEYWORDS = {
    "terms": {
        "자동결제": ["자동결제", "자동 결제", "무료체험", "정기결제", "월 이용료"],
        "환불 제한": ["환불", "환불되지", "환불 불가", "취소"],
        "개인정보 제공": ["개인정보", "제3자", "제공", "위탁"],
        "해지 조건": ["해지", "탈퇴", "종료"],
        "책임 제한": ["책임", "손해", "배상"],
        "마케팅 수신 동의": ["마케팅", "광고성 정보", "수신 동의"],
    },
    "notice": {
        "날짜": ["일시", "날짜", "기간"],
        "장소": ["장소", "위치", "주소"],
        "준비물": ["준비물", "지참", "준비"],
        "제출 기한": ["제출", "기한", "마감"],
        "신청 방법": ["신청", "접수", "등록"],
        "대상 조건": ["대상", "자격", "조건"],
        "해야 할 일": ["참여", "참석", "방문", "제출"],
    },
    "paper": {
        "연구 목적": ["연구 목적", "목적", "문제를 해결"],
        "연구 방법": ["방법", "실험", "모델", "데이터", "분석"],
        "핵심 결과": ["결과", "성능", "향상", "효과"],
        "한계점": ["한계", "제한점", "부족"],
        "활용 가능성": ["활용", "적용", "제안"],
    },
    "contract": {
        "금액 조건": ["계약금", "중도금", "잔금", "보증금", "월세", "대금", "금액", "수수료", "위약금"],
        "계약 기간": ["계약기간", "계약 기간", "임대차", "시작일", "종료일", "갱신", "개시"],
        "해지/위약": ["해지", "해제", "위약금", "손해배상", "중도해지", "중도 해지"],
        "특약 사항": ["특약", "별도 약정", "단서"],
        "서명/날인": ["서명", "날인", "인감", "기명"],
        "개인정보 제공": ["개인정보", "제3자"],
    },
}


def split_sentences(text: str) -> list[str]:
    """Split text into sentence-like units using punctuation boundaries."""
    cleaned = text.replace("\n", " ")
    parts = re.split(r'(?<=[.!?])\s+', cleaned)
    return [part.strip() for part in parts if part.strip()]


def extract_items(text: str, document_type: str) -> list[dict]:
    """Extract candidate items for a given document type."""
    sentences = split_sentences(text)
    config = CATEGORY_KEYWORDS.get(document_type, {})
    items = []

    for sentence in sentences:
        lowered = sentence.lower()
        for category, keywords in config.items():
            if any(keyword.lower() in lowered for keyword in keywords):
                level = "높음" if category in {"자동결제", "환불 제한", "개인정보 제공", "해지 조건", "책임 제한", "금액 조건", "해지/위약"} else "보통"
                items.append(
                    {
                        "category": category,
                        "title": f"{category} 있음",
                        "original_sentence": sentence,
                        "level": level,
                    }
                )

    # Remove duplicates while keeping the original order.
    unique_items = []
    seen = set()
    for item in items:
        key = (item["category"], item["original_sentence"])
        if key not in seen:
            seen.add(key)
            unique_items.append(item)

    return unique_items
