"""Conservative fraud / scam red-flag detection (rule-based).

Looks for *demand-style* phrasings — asking for money or credentials up front,
unrealistic returns, remote-control / app-install lures, gift-card payment,
urgency pressure, suspicious links — rather than mere keyword mentions, so it
does not false-positive on ordinary contract/terms wording.

Returns matched signals (each with the source sentence) and an overall
``suspected`` flag. Labels deliberately avoid definitive words (보장/무조건/확정)
so summaries built from them stay within the project's safety guidelines.
"""

from __future__ import annotations

from backend.extractor import split_sentences

_FRAUD_RULES = [
    {
        "phrases": [
            "원금 보장", "원금보장", "원금을 보장", "확정 수익", "확정수익",
            "수익 보장", "고수익 보장", "무조건 수익", "수익률 보장",
        ],
        "label": "비현실적 수익 약속",
        "reason": "원금·고수익을 약속하는 표현은 대표적인 투자사기 신호예요.",
        "weight": 3,
    },
    {
        "phrases": [
            "선입금", "먼저 입금", "먼저 송금", "수수료를 먼저", "세금을 먼저",
            "보증금을 먼저 입금", "예치금을 먼저", "입금해야 처리",
        ],
        "label": "선입금 요구",
        "reason": "돈을 먼저 보내라는 요구는 사기 위험이 큽니다.",
        "weight": 3,
    },
    {
        "phrases": [
            "비밀번호를 알려", "비밀번호를 입력", "otp를 알려", "otp 전송", "otp를 입력",
            "인증번호를 알려", "인증번호를 입력", "계좌번호를 알려", "카드번호를 입력",
            "보안카드 번호", "cvc",
        ],
        "label": "개인정보·금융정보 요구",
        "reason": "비밀번호·인증번호·계좌 정보를 요구하는 건 금융사기 신호예요.",
        "weight": 3,
    },
    {
        "phrases": [
            "원격제어", "원격 제어", "팀뷰어", "애니데스크", "anydesk", "teamviewer",
            "apk 설치", "apk를 설치", "앱을 설치하면", "앱 설치 후",
        ],
        "label": "원격제어·앱 설치 유도",
        "reason": "원격제어나 출처불명 앱 설치 유도는 사기 위험이 큽니다.",
        "weight": 3,
    },
    {
        "phrases": [
            "상품권으로 결제", "문화상품권으로", "기프트카드로", "구글 기프트", "상품권 번호",
        ],
        "label": "상품권 요구",
        "reason": "상품권·기프트카드로 결제를 요구하는 건 전형적인 사기 수법이에요.",
        "weight": 3,
    },
    {
        "phrases": [
            "오늘 안에 입금", "지금 바로 입금", "마감 임박", "지금 신청하지 않으면", "곧 마감되니",
        ],
        "label": "긴급 결제 압박",
        "reason": "급하게 결정·입금하도록 압박하는 건 사기의 흔한 수법이에요.",
        "weight": 1,
    },
    {
        "phrases": [
            "아래 링크를 클릭", "링크를 클릭하세요", "단축url", "bit.ly", "링크로 접속",
        ],
        "label": "출처불명 링크",
        "reason": "출처가 불분명한 링크는 피싱 위험이 있어요.",
        "weight": 2,
    },
]

_SUSPECT_THRESHOLD = 3


def detect_fraud(text: str) -> dict:
    """Return {"suspected": bool, "score": int, "signals": [...]} for the text."""
    cleaned = (text or "").strip()
    if not cleaned:
        return {"suspected": False, "score": 0, "signals": []}

    sentences = split_sentences(cleaned)
    signals: list[dict] = []
    seen: set[str] = set()
    score = 0

    for sentence in sentences:
        low = sentence.lower()
        for rule in _FRAUD_RULES:
            if rule["label"] in seen:
                continue
            if any(phrase.lower() in low for phrase in rule["phrases"]):
                seen.add(rule["label"])
                signals.append(
                    {
                        "label": rule["label"],
                        "reason": rule["reason"],
                        "source_text": sentence,
                        "weight": rule["weight"],
                    }
                )
                score += rule["weight"]

    return {"suspected": score >= _SUSPECT_THRESHOLD, "score": score, "signals": signals}
