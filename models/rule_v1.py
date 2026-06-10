"""Model A: current keyword/template-based analysis path."""

from backend.analyzer import analyze_document


def analyze_with_rule_v1(text: str) -> dict:
    """Wrap the existing analyzer and keep the same response shape."""
    result = analyze_document(text)
    result["model"] = "rule_v1"
    return result
