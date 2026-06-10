"""Compare rule_v2 with and without lightweight RAG-like domain knowledge."""

from __future__ import annotations

import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.evaluation.judge import mock_judge
from backend.evaluation.tool_mock import mock_document_loader
from models.rule_v2 import analyze_with_rule_v2


def _evaluate_case(case: dict, use_rag: bool) -> dict:
    case_text = case.get("text", "")
    if not case_text.strip():
        case_text = mock_document_loader(case.get("id", ""))

    result = analyze_with_rule_v2(case_text, use_rag=use_rag)
    judge = mock_judge(case, result)

    total_cards = len(result.get("cards", []))
    guide_cards = sum(1 for card in result.get("cards", []) if card.get("domain_guide"))
    caution_cards = sum(1 for card in result.get("cards", []) if card.get("domain_caution"))
    guide_coverage = (guide_cards / total_cards) if total_cards else 0.0
    caution_coverage = (caution_cards / total_cards) if total_cards else 0.0

    return {
        "result": result,
        "judge": judge,
        "guide_coverage": guide_coverage,
        "caution_coverage": caution_coverage,
        "checklist_added": result.get("_rag_metadata", {}).get("checklist_added", 0),
        "passed": judge.get("passed", False),
        "score": judge.get("score", 0.0),
    }


def main() -> None:
    test_cases_path = Path(__file__).with_name("backend") / "evaluation" / "test_cases.json"
    with test_cases_path.open("r", encoding="utf-8") as handle:
        test_cases = json.load(handle)

    without_rag = [_evaluate_case(case, use_rag=False) for case in test_cases]
    with_rag = [_evaluate_case(case, use_rag=True) for case in test_cases]

    without_pass_rate = (sum(1 for item in without_rag if item["passed"]) / len(without_rag)) if test_cases else 0.0
    with_pass_rate = (sum(1 for item in with_rag if item["passed"]) / len(with_rag)) if test_cases else 0.0
    without_avg = (sum(item["score"] for item in without_rag) / len(without_rag)) if test_cases else 0.0
    with_avg = (sum(item["score"] for item in with_rag) / len(with_rag)) if test_cases else 0.0

    guide_coverage = (sum(item["guide_coverage"] for item in with_rag) / len(with_rag)) if test_cases else 0.0
    caution_coverage = (sum(item["caution_coverage"] for item in with_rag) / len(with_rag)) if test_cases else 0.0
    checklist_added = sum(item["checklist_added"] for item in with_rag)

    print("=== Domain Evaluation ===")
    print(f"Total test cases: {len(test_cases)}")
    print(f"without RAG Pass Rate: {without_pass_rate:.2%}")
    print(f"with RAG Pass Rate: {with_pass_rate:.2%}")
    print(f"without RAG Average Score: {without_avg:.2f}")
    print(f"with RAG Average Score: {with_avg:.2f}")
    print(f"Domain guide coverage: {guide_coverage:.2%}")
    print(f"Domain caution coverage: {caution_coverage:.2%}")
    print(f"Checklist enrichment count: {checklist_added}")

    if with_pass_rate >= without_pass_rate and with_avg >= without_avg:
        conclusion = "RAG-like 구조를 적용해도 기존 성능을 유지하며 도메인 가이드를 보강할 수 있습니다."
    else:
        conclusion = "RAG-like 구조 적용으로 성능이 다소 변동될 수 있으므로 추가 검증이 필요합니다."
    print(f"Conclusion: {conclusion}")


if __name__ == "__main__":
    main()
