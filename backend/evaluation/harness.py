import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.analyzer import analyze_document
from backend.evaluation.judge import mock_judge
from backend.evaluation.tool_mock import mock_document_loader, mock_external_policy_check


def _basic_rule_check(case: dict, result: dict) -> tuple[bool, str]:
    document_type_ok = result.get("document_type") == case.get("expected_document_type")
    categories_found = [item.get("category") for item in result.get("cards", [])]
    expected_categories = case.get("expected_categories", [])
    categories_ok = all(category in categories_found for category in expected_categories)
    summary_ok = bool(str(result.get("summary", "")).strip())
    checklist_ok = bool(result.get("checklist"))

    issues = []
    if not document_type_ok:
        issues.append("document_type mismatch")
    if not categories_ok:
        issues.append("missing expected categories")
    if not summary_ok:
        issues.append("summary missing")
    if not checklist_ok:
        issues.append("checklist missing")

    return (document_type_ok and categories_ok and summary_ok and checklist_ok, "; ".join(issues) if issues else "basic rules passed")


def main() -> None:
    test_cases_path = Path(__file__).with_name("test_cases.json")
    with test_cases_path.open("r", encoding="utf-8") as f:
        test_cases = json.load(f)

    counts = {"basic": {"total": 0, "passed": 0}, "edge": {"total": 0, "passed": 0}, "safety": {"total": 0, "passed": 0}}
    passed = 0
    failed = 0
    total_score = 0.0
    failed_cases = []

    for case in test_cases:
        case_type = case.get("type", "basic")
        counts.setdefault(case_type, {"total": 0, "passed": 0})
        counts[case_type]["total"] += 1

        case_text = case.get("text", "")
        if not case_text.strip():
            case_text = mock_document_loader(case.get("id", ""))

        result = analyze_document(case_text)
        basic_ok, basic_reason = _basic_rule_check(case, result)
        judge_result = mock_judge(case, result)

        final_ok = basic_ok and judge_result["passed"]
        if final_ok:
            passed += 1
            counts[case_type]["passed"] += 1
            status = "PASS"
        else:
            failed += 1
            counts[case_type]["passed"] += 0
            status = "FAIL"
            failed_cases.append(f"{case['id']}: {basic_reason}; {judge_result['reason']}")

        total_score += judge_result.get("score", 0.0)

        policy_hint = mock_external_policy_check(case_text)
        print(
            f"[{status}] {case['id']} | type={case_type} | doc={result.get('document_type')} | "
            f"score={judge_result.get('score', 0.0):.2f} | policy={policy_hint.get('status', 'ok')}"
        )
        print(f"      expected={case.get('expected_document_type')} / categories={case.get('expected_categories', [])}")
        print(f"      reason={judge_result.get('reason', 'no reason provided')}")

    avg_score = (total_score / len(test_cases)) if test_cases else 0.0

    print("\n=== Harness Summary ===")
    print(f"Total test cases: {len(test_cases)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Average judge score: {avg_score:.2f}")
    for case_type, bucket in counts.items():
        total = bucket.get("total", 0)
        passed_count = bucket.get("passed", 0)
        rate = (passed_count / total * 100.0) if total else 0.0
        print(f"{case_type.capitalize()} pass rate: {passed_count}/{total} ({rate:.1f}%)")

    if failed_cases:
        print("\nFailed cases:")
        for item in failed_cases:
            print(f"  - {item}")
    else:
        print("\nFailed cases: none")


if __name__ == "__main__":
    main()
