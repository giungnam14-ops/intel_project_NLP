"""Long-document handling for the 문요 analyzer.

문요 is a "long document gist checker", so a long document must never be
hard-blocked. Instead we flag it as a long document and, when it is very large,
condense it down to its most important sentences (plus a few head/middle/tail
sentences for overall context) before running the analyzer. key_facts and
highlights are still computed from the full text by the caller.
"""

from __future__ import annotations

from backend.extractor import split_sentences


# Thresholds (characters). Managed here as constants.
LONG_DOCUMENT_THRESHOLD = 12_000   # >= this → long_document = true
COMPRESS_THRESHOLD = 50_000        # >= this → condense before analysis
CONDENSE_TARGET_CHARS = 12_000     # budget for the condensed text

# Sentences containing these patterns are prioritized when condensing.
IMPORTANT_KEYWORDS = [
    "자동결제", "자동 결제", "환불", "개인정보", "제3자", "제 3자", "책임", "제한",
    "위약금", "수수료", "기한", "제출", "신청", "해지", "동의", "비용", "금액",
    "날짜", "마감", "결제", "%",
]


def condense_document(text: str, target_chars: int = CONDENSE_TARGET_CHARS) -> str:
    """Pick important sentences (+ head/middle/tail) preserving order.

    Returns a shorter text that keeps the document's overall feel while staying
    within ``target_chars``. Never raises: falls back to a simple prefix.
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return ""

    sentences = split_sentences(cleaned)
    if not sentences:
        return cleaned[:target_chars]

    total = len(sentences)
    selected: set[int] = set()

    # Always keep a few head / middle / tail sentences for context.
    for index in (0, 1, total // 2, total - 2, total - 1):
        if 0 <= index < total:
            selected.add(index)

    # Add every sentence carrying an important pattern.
    for index, sentence in enumerate(sentences):
        if any(keyword in sentence for keyword in IMPORTANT_KEYWORDS):
            selected.add(index)

    # Emit in original order, respecting the character budget.
    chosen: list[str] = []
    used = 0
    for index in sorted(selected):
        sentence = sentences[index]
        if used + len(sentence) + 1 > target_chars and chosen:
            break
        chosen.append(sentence)
        used += len(sentence) + 1

    if not chosen:
        return cleaned[:target_chars]

    return " ".join(chosen)
