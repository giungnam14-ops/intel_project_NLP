"""Extract "things the user must do" (이행 의무) from a document.

Goes beyond summarizing: scans for obligation phrasing (제출/신청/해지/서명/납부…),
turns each into a clear to-do, and attaches a deadline when the same sentence
has one. Output is JSON-friendly and never raises on odd input.
"""

from __future__ import annotations

from backend.extractor import split_sentences
from backend.key_facts import extract_deadline

# Ordered specific → general; first match per sentence wins.
# (triggers, task text, is_high_priority)
_ACTION_RULES = [
    (["해지해야", "해지 신청", "해지하려면", "해지"], "해지 신청하기", True),
    (["취소해야", "청약철회", "철회", "취소"], "취소/철회 처리하기", True),
    (["납부", "입금해야", "결제해야", "수납"], "납부·결제 처리하기", True),
    (["제출해야", "제출"], "서류 제출하기", False),
    (["신청해야", "접수", "신청"], "신청하기", False),
    (["등록해야", "등록"], "등록하기", False),
    (["서명", "날인", "기명"], "서명 전 내용 확인하기", False),
    (["동의해야", "동의"], "동의 여부 결정하기", False),
    (["변경해야", "갱신", "변경"], "변경·갱신 확인하기", False),
    (["지참", "준비물"], "준비물 챙기기", False),
    (["확인해야", "확인 후", "확인이 필요"], "내용 확인하기", False),
]

_MAX_ITEMS = 6


def extract_action_items(text: str) -> list[dict]:
    """Return a list of {task, deadline, source_text, level} to-do items."""
    cleaned = (text or "").strip()
    if not cleaned:
        return []

    items: list[dict] = []
    seen_tasks: set[str] = set()

    for sentence in split_sentences(cleaned):
        for triggers, task, high in _ACTION_RULES:
            if any(trigger in sentence for trigger in triggers):
                if task in seen_tasks:
                    break
                deadline = extract_deadline(sentence)
                seen_tasks.add(task)
                items.append(
                    {
                        "task": task,
                        "deadline": deadline,
                        "source_text": sentence,
                        # A deadline makes any obligation time-critical.
                        "level": "high" if (high or deadline) else "normal",
                    }
                )
                break  # one task per sentence

    # High-priority / deadline items first, preserve discovery order otherwise.
    items.sort(key=lambda item: 0 if item["level"] == "high" else 1)
    return items[:_MAX_ITEMS]
