"""Rule-based / retrieval-style document Q&A for the 문요 MVP.

No external LLM is used. The document is split into sentences; the question's
intent is classified by keywords; sentences are scored against intent keywords
and question tokens, and the best-matching sentences become the evidence behind
a short, template-based answer. Nothing outside the document is invented — if no
sentence matches, the answer says so with low confidence.
"""

from __future__ import annotations

import re

from backend.extractor import split_sentences
from pii_masker import mask_pii_text
from prompt_injection import detect_prompt_injection


_MAX_EVIDENCE = 3

# Question-intent keywords (matched against the QUESTION text). Order matters:
# earlier intents win ties.
_QUESTION_INTENTS = [
    ("money", ["돈", "비용", "결제", "위약금", "수수료", "환불", "금액", "요금", "가격", "얼마"]),
    ("privacy", ["개인정보", "제3자", "제 3자", "제공", "동의", "정보"]),
    ("date", ["날짜", "기한", "마감", "언제", "기간", "며칠", "이내"]),
    ("action", ["해야", "제출", "신청", "해지", "취소", "서명", "변경", "확인", "조치"]),
    ("risk", ["불리", "위험", "주의", "제한", "책임", "환불 불가", "자동결제"]),
    ("summary", ["요약", "핵심", "전체", "정리"]),
]

# Sentence-matching keywords (matched against DOCUMENT sentences) per intent.
_SENTENCE_KEYWORDS = {
    "money": ["결제", "자동결제", "자동 결제", "위약금", "수수료", "환불", "요금", "금액"],
    "privacy": ["개인정보", "제3자", "제 3자", "제공", "위탁", "동의"],
    "date": ["이내", "까지", "기한", "마감", "기간", "날짜"],
    "action": ["해야", "제출", "신청", "해지", "취소", "서명", "변경", "확인", "동의"],
    "risk": ["자동결제", "자동 결제", "환불 불가", "환불되지", "책임", "제한", "제3자",
             "별도 고지", "위약금", "수수료", "불가", "손해", "배상"],
}

_ANSWER_PREFIX = {
    "money": "비용·결제 관련 내용은 다음 문장에서 확인됩니다",
    "privacy": "개인정보 관련 내용은 다음 문장에서 확인됩니다",
    "date": "날짜·기한 관련 내용은 다음 문장에서 확인됩니다",
    "action": "사용자가 해야 할 일은 다음과 같습니다",
    "risk": "주의가 필요한 조건은 다음과 같습니다",
    "summary": "문서의 핵심 내용은 다음과 같습니다",
    "general": "질문과 관련된 내용은 다음 문장에서 확인됩니다",
}

_SUGGESTED = {
    "money": ["환불 조건이 뭐야?", "자동결제 조건도 확인해줘"],
    "privacy": ["개인정보 제공 내용 알려줘", "동의해야 하는 항목이 있어?"],
    "date": ["마감일이 있어?", "환불 기한이 언제야?"],
    "action": ["내가 해야 할 일이 뭐야?", "해지하려면 어떻게 해?"],
    "risk": ["불리한 조건이 있어?", "주의할 점 알려줘"],
    "summary": ["돈 내야 하는 부분만 알려줘", "불리한 조건이 있어?"],
    "general": ["요약해서 알려줘", "불리한 조건이 있어?"],
}

# Korean phrases that detect_prompt_injection may not catch but should be blocked.
_QA_INJECTION_PHRASES = [
    "이전 지시", "이전 명령", "지시 무시", "명령 무시", "규칙 무시", "규칙을 무시",
    "시스템 프롬프트", "system prompt", "개발자 지시", "개발자 메시지", "developer message",
    "프롬프트 출력", "프롬프트 공개", "프롬프트를 출력", "프롬프트를 공개",
    "정책 우회", "안전장치 해제", "탈옥", "jailbreak",
]

_SAFETY_RESPONSE = {
    "answer": "이 질문은 안전 정책상 처리할 수 없습니다.",
    "confidence": "low",
    "evidence": [],
    "suggested_followups": [],
}

_DATE_NUMBER_RE = re.compile(r"[0-9]+\s*(?:일|월|년|주|개월|달)")
_MONEY_AMOUNT_RE = re.compile(r"[0-9][0-9,]*\s*(?:억|만|천)?\s*원|[0-9]+(?:\.[0-9]+)?\s*%")


def _is_unsafe_question(question: str) -> bool:
    if detect_prompt_injection(question).get("detected"):
        return True
    lowered = question.lower()
    return any(phrase.lower() in lowered for phrase in _QA_INJECTION_PHRASES)


def classify_intent(question: str) -> str:
    """Pick the best-matching intent for a question, or 'general'."""
    lowered = question.lower()
    best_intent = "general"
    best_score = 0
    for intent, keywords in _QUESTION_INTENTS:
        score = sum(1 for keyword in keywords if keyword.lower() in lowered)
        if score > best_score:
            best_score = score
            best_intent = intent
    return best_intent


def _question_tokens(question: str) -> list[str]:
    tokens = re.findall(r"[가-힣A-Za-z0-9]+", question)
    return [token for token in tokens if len(token) >= 2]


def _label_for_sentence(sentence: str) -> str:
    if "환불" in sentence:
        return "환불 조건"
    if "자동결제" in sentence or "자동 결제" in sentence:
        return "자동결제 조건"
    if "위약금" in sentence:
        return "위약금"
    if "수수료" in sentence:
        return "수수료"
    if "제3자" in sentence or "개인정보" in sentence:
        return "개인정보 제공"
    if "해지" in sentence or "취소" in sentence:
        return "해지/취소"
    if "제출" in sentence:
        return "제출"
    if "신청" in sentence or "등록" in sentence:
        return "신청/등록"
    if "이내" in sentence or "기한" in sentence or "마감" in sentence:
        return "기한"
    if "책임" in sentence:
        return "책임 제한"
    if "원" in sentence or "결제" in sentence or "금액" in sentence:
        return "비용/결제"
    return "근거 문장"


def _score_sentence(sentence: str, intent: str, q_tokens: list[str]) -> int:
    lowered = sentence.lower()
    score = 0
    for keyword in _SENTENCE_KEYWORDS.get(intent, []):
        if keyword.lower() in lowered:
            score += 2
    if intent == "date" and _DATE_NUMBER_RE.search(sentence):
        score += 2
    if intent == "money" and _MONEY_AMOUNT_RE.search(sentence):
        score += 2
    # Weight question-word overlap highly so the specifically-asked sentence
    # outranks generically-relevant ones.
    for token in q_tokens:
        if token in sentence:
            score += 3
    return score


def _salience(sentence: str) -> int:
    score = 0
    for keywords in _SENTENCE_KEYWORDS.values():
        if any(keyword.lower() in sentence.lower() for keyword in keywords):
            score += 1
    return score


def _followups(intent: str) -> list[str]:
    return list(_SUGGESTED.get(intent, _SUGGESTED["general"]))


def answer_question(text: str, question: str) -> dict:
    """Answer a question using only the document's own sentences."""
    document = (text or "").strip()
    query = (question or "").strip()

    if not query:
        return {
            "answer": "궁금한 내용을 입력해 주세요.",
            "confidence": "low",
            "evidence": [],
            "suggested_followups": [],
        }

    if _is_unsafe_question(query):
        return dict(_SAFETY_RESPONSE)

    if not document:
        return {
            "answer": "문서에서 해당 내용을 명확히 찾지 못했습니다.",
            "confidence": "low",
            "evidence": [],
            "suggested_followups": _followups("general"),
        }

    intent = classify_intent(query)
    sentences = split_sentences(document)
    q_tokens = _question_tokens(query)

    if intent == "summary":
        ranked = sorted(sentences, key=_salience, reverse=True)
        chosen = [s for s in ranked if _salience(s) > 0][:_MAX_EVIDENCE]
        if not chosen:
            chosen = sentences[:_MAX_EVIDENCE]
        best_score = 2  # treat summary as evidence-backed but broad
    else:
        scored = [(s, _score_sentence(s, intent, q_tokens)) for s in sentences]
        scored = [pair for pair in scored if pair[1] > 0]
        scored.sort(key=lambda pair: pair[1], reverse=True)
        chosen = [s for s, _ in scored[:_MAX_EVIDENCE]]
        best_score = scored[0][1] if scored else 0

    if not chosen:
        return {
            "answer": "문서에서 해당 내용을 명확히 찾지 못했습니다.",
            "confidence": "low",
            "evidence": [],
            "suggested_followups": _followups(intent),
        }

    evidence = [
        {"source_text": mask_pii_text(sentence), "label": _label_for_sentence(sentence)}
        for sentence in chosen
    ]

    prefix = _ANSWER_PREFIX.get(intent, _ANSWER_PREFIX["general"])
    answer = f"{prefix}: {evidence[0]['source_text']}"
    if len(evidence) > 1:
        answer += " 외 추가 근거가 있습니다."

    if intent in ("summary", "general"):
        confidence = "medium"
    elif best_score >= 2:
        confidence = "high"
    else:
        confidence = "medium"

    return {
        "answer": answer,
        "confidence": confidence,
        "evidence": evidence,
        "suggested_followups": _followups(intent),
    }
