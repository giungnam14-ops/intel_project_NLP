import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.evaluation.judge import mock_judge
from models.rule_v1 import analyze_with_rule_v1
from models.rule_v2 import analyze_with_rule_v2


TEST_CASES_PATH = Path(__file__).with_name("backend") / "evaluation" / "test_cases.json"


def _collect_bucket(records):
    buckets = {"basic": {"count": 0, "passed": 0, "score": 0.0}, "edge": {"count": 0, "passed": 0, "score": 0.0}, "safety": {"count": 0, "passed": 0, "score": 0.0}}

    for item in records:
        buckets[item["type"]]["count"] += 1
        buckets[item["type"]]["passed"] += 1 if item["passed"] else 0
        buckets[item["type"]]["score"] += item["score"]

    for bucket in buckets.values():
        if bucket["count"]:
            bucket["pass_rate"] = bucket["passed"] / bucket["count"]
            bucket["avg_score"] = bucket["score"] / bucket["count"]
        else:
            bucket["pass_rate"] = 0.0
            bucket["avg_score"] = 0.0

    return buckets


def main() -> None:
    with TEST_CASES_PATH.open("r", encoding="utf-8") as handle:
        cases = json.load(handle)

    summary = {
        "rule_v1": {"records": [], "passed": 0, "score_sum": 0.0},
        "rule_v2": {"records": [], "passed": 0, "score_sum": 0.0},
    }

    for case in cases:
        result_v1 = analyze_with_rule_v1(case["text"])
        result_v2 = analyze_with_rule_v2(case["text"])
        judge_v1 = mock_judge(case, result_v1)
        judge_v2 = mock_judge(case, result_v2)

        summary["rule_v1"]["records"].append({**case, **judge_v1, "result": result_v1})
        summary["rule_v2"]["records"].append({**case, **judge_v2, "result": result_v2})

        summary["rule_v1"]["passed"] += 1 if judge_v1["passed"] else 0
        summary["rule_v2"]["passed"] += 1 if judge_v2["passed"] else 0
        summary["rule_v1"]["score_sum"] += judge_v1["score"]
        summary["rule_v2"]["score_sum"] += judge_v2["score"]

    for model_name, model_summary in summary.items():
        total = len(cases)
        pass_rate = model_summary["passed"] / total if total else 0.0
        avg_score = model_summary["score_sum"] / total if total else 0.0
        model_summary["pass_rate"] = pass_rate
        model_summary["avg_score"] = avg_score
        model_summary["buckets"] = _collect_bucket(model_summary["records"])

    v1 = summary["rule_v1"]
    v2 = summary["rule_v2"]

    if v2["pass_rate"] > v1["pass_rate"]:
        better_model = "rule_v2"
        reason_text = "Pass Rate가 더 높아 rule_v2를 선택했습니다."
    elif v1["pass_rate"] > v2["pass_rate"]:
        better_model = "rule_v1"
        reason_text = "Pass Rate가 더 높아 rule_v1를 선택했습니다."
    elif v2["avg_score"] > v1["avg_score"]:
        better_model = "rule_v2"
        reason_text = "Pass Rate가 같아 Average Judge Score가 더 높아 rule_v2를 선택했습니다."
    elif v1["avg_score"] > v2["avg_score"]:
        better_model = "rule_v1"
        reason_text = "Pass Rate가 같아 Average Judge Score가 더 높아 rule_v1를 선택했습니다."
    else:
        better_model = "rule_v2"
        reason_text = "Pass Rate와 Average Judge Score가 같아 Safety 대응 우선 기준으로 rule_v2를 선택했습니다."

    print("=== Model Comparison ===")
    print(f"Total test cases: {len(cases)}")
    print("\nRule V1")
    print(f"  Pass Rate: {summary['rule_v1']['pass_rate']:.2%}")
    print(f"  Average Judge Score: {summary['rule_v1']['avg_score']:.2f}")
    for bucket_name, bucket in summary['rule_v1']['buckets'].items():
        print(f"  {bucket_name.capitalize()} Pass Rate: {bucket['pass_rate']:.2%}")
        print(f"  {bucket_name.capitalize()} Avg Score: {bucket['avg_score']:.2f}")

    print("\nRule V2")
    print(f"  Pass Rate: {summary['rule_v2']['pass_rate']:.2%}")
    print(f"  Average Judge Score: {summary['rule_v2']['avg_score']:.2f}")
    for bucket_name, bucket in summary['rule_v2']['buckets'].items():
        print(f"  {bucket_name.capitalize()} Pass Rate: {bucket['pass_rate']:.2%}")
        print(f"  {bucket_name.capitalize()} Avg Score: {bucket['avg_score']:.2f}")

    print("\nSelected model:", better_model)
    print("Reason:", reason_text)


if __name__ == "__main__":
    main()
