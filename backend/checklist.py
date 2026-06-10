"""Checklist generation from detected analysis items."""

from __future__ import annotations


CHECKLIST_TEMPLATES = {
    "terms": {
        "자동결제": "자동결제 시작일 확인",
        "환불 제한": "환불 가능 여부 확인",
        "개인정보 제공": "개인정보 제공 범위 확인",
        "해지 조건": "해지 마감일 확인",
        "책임 제한": "책임 범위 확인",
        "마케팅 수신 동의": "마케팅 수신 동의 여부 확인",
    },
    "notice": {
        "날짜": "일시 확인",
        "장소": "장소 확인",
        "준비물": "준비물 확인",
        "제출 기한": "제출 기한 확인",
        "신청 방법": "신청 방법 확인",
        "대상 조건": "대상 조건 확인",
        "해야 할 일": "해야 할 일 확인",
    },
    "paper": {
        "연구 목적": "연구 목적 확인",
        "연구 방법": "연구 방법 확인",
        "핵심 결과": "핵심 결과 확인",
        "한계점": "한계점 확인",
        "활용 가능성": "활용 가능성 확인",
    },
}


def generate_checklist(items: list[dict], document_type: str) -> list[str]:
    """Build a deduplicated checklist from categories detected in the items."""
    categories = {item.get("category") for item in items}
    templates = CHECKLIST_TEMPLATES.get(document_type, {})

    checklist = []
    for category in categories:
        label = templates.get(category)
        if label and label not in checklist:
            checklist.append(label)

    if not checklist:
        checklist.append("문서의 핵심 항목을 다시 확인해 보세요.")

    return checklist
