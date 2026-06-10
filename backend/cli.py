"""CLI entrypoint for the 5초 문서체크 analysis flow."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.analyzer import analyze_document


def read_document_text() -> str:
    """Read multi-line text input from the terminal."""
    print("5초 문서체크 CLI")
    print("문서를 붙여넣으세요. 빈 줄을 두 번 입력하면 분석을 시작합니다.")

    lines = []
    blank_lines = 0

    while True:
        try:
            line = input()
        except EOFError:
            break

        if not line.strip():
            blank_lines += 1
            if blank_lines >= 2:
                break
            continue

        blank_lines = 0
        lines.append(line)

    return "\n".join(lines).strip()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="5초 문서체크 분석 CLI")
    parser.add_argument(
        "--text",
        help="문서 텍스트를 직접 전달합니다. 없으면 대화형 입력 모드로 동작합니다.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    text = args.text if args.text else read_document_text()

    if not text:
        print("입력된 문서가 없습니다. 다시 실행해 주세요.")
        return

    result = analyze_document(text)

    print("\n=== 분석 결과 ===")
    print(f"문서 유형: {result['document_type_label']} ({result['document_type']})")
    print(f"위험도/중요도: {result['risk_level']}")
    print(f"요약: {result['summary']}")

    print("\n핵심 카드 목록")
    if result["cards"]:
        for index, card in enumerate(result["cards"], start=1):
            print(f"  {index}. [{card['category']}] {card['title']} ({card['level']})")
            print(f"     원문: {card['original_sentence']}")
            print(f"     설명: {card['message']}")
    else:
        print("  탐지된 핵심 문장이 없습니다.")

    print("\n체크리스트")
    for item in result["checklist"]:
        print(f"  - {item}")


if __name__ == "__main__":
    main()
