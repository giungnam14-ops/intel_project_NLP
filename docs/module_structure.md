# 모듈 구조 설명

## 1. 모듈 분리 목적

이번 MVP는 프론트엔드 구현이 아니라, 문서 분석 로직을 모듈 단위로 분리해 CLI와 평가 Harness에서 검증하기 위한 구조를 만든다.

- 문서 유형 분류: 키워드 기반 규칙으로 분류
- 핵심 문장 추출: 문장 단위로 문서 유형별 항목을 탐지
- 쉬운 설명 생성: 템플릿 기반 설명을 제공
- 체크리스트 생성: 탐지된 항목을 요약해 확인 리스트로 출력
- 평가 체계: test_cases.json + harness.py로 자동 검증 가능

## 2. 폴더 구조

```text
backend/
  analyzer.py
  classifier.py
  extractor.py
  explainer.py
  checklist.py
  schemas.py
  cli.py
  evaluation/
    harness.py
    test_cases.json

data/
  sample_documents.json
```

## 3. 각 파일 역할

- backend/classifier.py: 문서 유형을 terms / notice / paper / other로 분류
- backend/extractor.py: 문장 분리와 문서 유형별 카테고리 탐지
- backend/explainer.py: 쉬운 설명 템플릿을 제공
- backend/checklist.py: 문서 유형별 체크리스트 생성
- backend/analyzer.py: 위 모듈을 조합해 최종 결과를 반환
- backend/schemas.py: FastAPI 연결을 대비한 Pydantic 모델
- backend/cli.py: 터미널에서 문서 분석을 직접 실행하는 진입점
- backend/evaluation/harness.py: 자동 평가 실행기
- backend/evaluation/test_cases.json: 테스트 케이스 데이터
- data/sample_documents.json: 예시 문서 샘플

## 4. 분석 흐름

1. 사용자가 텍스트를 입력한다.
2. classifier.py가 문서 유형을 판별한다.
3. extractor.py가 문장 단위로 핵심 항목을 찾는다.
4. explainer.py가 쉬운 설명을 생성한다.
5. checklist.py가 체크리스트를 만들어낸다.
6. analyzer.py가 최종 JSON 형태로 결과를 반환한다.

## 5. Harness 평가 방식

- evaluation/test_cases.json에 약관, 공지문, 논문 예시를 저장한다.
- harness.py가 각 문서를 analyze_document()로 실행한다.
- document_type과 expected_categories가 일치하는지 확인하고 결과를 터미널에 출력한다.

## 6. FastAPI 확장 계획

다음 단계에서는 backend/analyzer.py와 backend/schemas.py를 그대로 재사용해 /analyze API를 만들 수 있다.

- POST /analyze
- 입력: { "text": "...", "document_type": "auto" }
- 출력: document_type, risk_level, summary, cards, checklist
- 이후 React 또는 Next.js 화면과 연결할 수 있도록 JSON 구조를 맞춘다.
