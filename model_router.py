"""Simple router for selecting analysis models."""

from models.rule_v1 import analyze_with_rule_v1
from models.rule_v2 import analyze_with_rule_v2


SAFETY_KEYWORDS = (
    "위법", "법적", "진단", "처방", "투자", "환불 가능해?", "보장", "무조건",
)


def select_model(text: str, strategy: str = "auto") -> str:
    """Select the analysis model based on the requested strategy."""
    lowered = (text or "").lower()

    if strategy == "rule_v1":
        return "rule_v1"
    if strategy == "rule_v2":
        return "rule_v2"

    if any(term.lower() in lowered for term in SAFETY_KEYWORDS):
        return "rule_v2"

    if len((text or "").split()) < 8:
        return "rule_v2"

    return "rule_v1"


def route_analyze(text: str, strategy: str = "auto") -> dict:
    """Route analysis to the selected model and attach routing metadata."""
    model_name = select_model(text, strategy)
    if model_name == "rule_v2":
        result = analyze_with_rule_v2(text)
    else:
        result = analyze_with_rule_v1(text)

    result["selected_model"] = model_name
    result["routing_reason"] = (
        "Safety 표현이 감지되어 rule_v2로 선택했습니다."
        if model_name == "rule_v2" and any(term.lower() in (text or "").lower() for term in SAFETY_KEYWORDS)
        else "짧거나 애매한 문장이라 rule_v2를 우선 적용했습니다."
        if len((text or "").split()) < 8
        else "일반 문서이므로 rule_v1을 기본으로 선택했습니다."
    )
    return result
