# TRD v1: 5초 문서체크

## 1. 문서 목적

이 문서는 5초 문서체크 MVP의 기술 요구사항을 정의한다.

5초 문서체크는 긴 생활 문서를 NLP로 분석해 문서 유형을 분류하고, 사용자가 놓치기 쉬운 핵심 정보와 주의 문장을 카드 및 체크리스트 형태로 제공하는 서비스이다.

이번 TRD v1에서는 완성된 웹앱 구현이 아니라, CLI 기반 최소 기능을 먼저 구현해 기술적 실현 가능성을 검증하는 것을 목표로 한다.

## 2. 기술 목표

## 2.1 1차 목표

사용자가 문서 텍스트를 입력하면 CLI에서 다음 결과를 출력한다.

- 문서 유형
- 핵심 항목
- 주의 문장
- 쉬운 설명
- 체크리스트

## 2.2 최종 목표

CLI에서 검증한 분석 로직을 이후 FastAPI 백엔드에 연결하고, React 또는 Next.js 프론트엔드에서 카드형 UI로 보여준다.

## 3. MVP 기술 범위

## 3.1 이번 단계에서 구현하는 것

- CLI 기반 문서 입력
- 문서 유형 분류
- 핵심 키워드 탐지
- 문장 단위 분석
- 문서 유형별 결과 출력
- 체크리스트 생성
- 수동 테스트

## 3.2 이번 단계에서 구현하지 않는 것

- 완성된 프론트엔드
- FastAPI 서버 완성
- React 또는 Next.js 화면 완성
- PDF 업로드
- 이미지 OCR
- 로그인
- 데이터베이스 저장
- 실제 배포 자동화
- 법률 판단 또는 전문 판단

## 4. 지원 문서 유형

## 4.1 약관 / 동의서

탐지 대상:

- 자동결제
- 환불 제한
- 개인정보 제공
- 해지 조건
- 책임 제한

예상 출력:

- 문서 유형: 약관 / 동의서
- 자동결제 관련 문장 발견
- 환불 제한 관련 문장 발견
- 개인정보 제공 관련 문장 발견
- 동의 전 확인 체크리스트 출력

## 4.2 공지문 / 안내문

탐지 대상:

- 날짜
- 장소
- 준비물
- 제출 기한
- 신청 방법
- 해야 할 일

예상 출력:

- 문서 유형: 공지문 / 안내문
- 제출 기한 발견
- 준비물 발견
- 장소 정보 발견
- 해야 할 일 체크리스트 출력

## 4.3 논문 / 보고서

탐지 대상:

- 연구 목적
- 연구 방법
- 핵심 결과
- 한계점
- 활용 가능성

예상 출력:

- 문서 유형: 논문 / 보고서
- 연구 목적 요약
- 연구 방법 정리
- 핵심 결과 정리
- 한계점 정리

## 5. 시스템 구조 v1

```text
사용자 입력
   ↓
CLI 실행
   ↓
문장 분리
   ↓
문서 유형 분류
   ↓
핵심 문장 탐지
   ↓
쉬운 설명 생성
   ↓
체크리스트 생성
   ↓
터미널 결과 출력
```

---

## 6. 중간 데모 이후 확장 기술 요구사항

> 본 절은 DAY 11 중간 데모 및 내부 점검 결과([feedback.md](./feedback.md))를 바탕으로, CLI에서 검증한 분석 로직을 FastAPI 백엔드로 확장하면서 추가된 기술 요구사항을 정의한다. 외부 사용자 정량 평가는 수행하지 않았으며, 내부 점검 기준으로 정리한 내용이다. 현재 MVP는 규칙 기반 분석 + 경량 RAG-like + 정규식 기반 MVP Guardrail로 구성된다.

### 6.1 Guardrail 계층 구조 (Pre / Post)

Guardrail은 `/analyze`의 핵심 분석 로직을 앞뒤로 감싸는 형태로 적용한다.

```text
입력
  ↓
Pre-Guardrail        (guardrails.py)
  - PII 마스킹        (pii_masker.py)
  - Prompt Injection 탐지 (prompt_injection.py)
  - blocked 판정
  ↓  (blocked=false 인 경우에만 진행)
핵심 분석 로직        (문서 유형 분류 → 핵심 항목/주의 문장 탐지 → 쉬운 설명 → 체크리스트)
  ↓
Post-Guardrail       (guardrails.py)
  - 결과 내 PII 재마스킹
  - 법적 표현 완화 (예: "위법" → "확인 필요")
  ↓
응답(JSON)
```

기술 규칙:
- Pre-Guardrail에서 `blocked=true`로 판정되면 핵심 분석 함수를 호출하지 않는다.
- 도구 호출이 포함되는 경우 `tool_guardrail.py`로 도구 호출의 안전성을 검증한다.
- Post-Guardrail은 분석 결과(summary/cards)에 대해 PII 재마스킹과 표현 완화를 수행한다.

### 6.2 RAG-like Retriever 구조

벡터DB 없이 카테고리 기반 매칭으로 도메인 지식을 보강하는 경량 구조이다.

```text
domain_knowledge.json (문서 유형 → 카테고리별 가이드)
        ↓
rag_retriever.retrieve_domain_guide(document_type, category)
        ↓
enrich_result_with_domain_knowledge(result)
        ↓
결과 카드에 domain_guide / domain_caution 부가
```

매칭 방식:
- 정규화(normalize) → 완전 일치 → 부분 일치 순서로 카테고리를 매칭한다.
- 매칭된 항목에서 `guide`(설명)와 `caution`(주의/법규) 값을 가져와 결과에 부가한다.
- 의미 기반(임베딩) 검색은 본 MVP 범위가 아니며 Phase 2에서 검토한다.

### 6.3 model_router.py 라우팅 기준

분석 규칙 버전(rule_v1 / rule_v2)을 입력 특성에 따라 선택한다.

```python
if any(term in text for term in SAFETY_KEYWORDS):
    return "rule_v2"
if len(text.split()) < 8:
    return "rule_v2"
return "rule_v1"
```

규칙:
- `SAFETY_KEYWORDS`는 법적 표현, 책임 관련 표현, 투자 관련 표현 등을 포함한다.
- 짧은 텍스트(8단어 미만)는 edge case 가능성이 높아 더 보수적인 `rule_v2`를 선택한다.
- 선택 사유는 `routing_reason` 필드로 결과에 포함해 추적 가능성을 확보한다.
- rule_v1/v2는 정량 지표(Pass Rate, Judge Score) 동일 시 안전 표현 우선 원칙으로 rule_v2를 기본 선호한다.

### 6.4 domain_knowledge.json 구조

문서 유형 → 카테고리 → `guide`/`caution`의 2단계 중첩 구조를 따른다.

```json
{
  "terms": {
    "categories": {
      "개인정보 보호": {
        "guide": "개인정보를 수집하는 조항입니다...",
        "caution": "POPIA, GDPR 등 관련 법규를 확인하세요."
      }
    }
  }
}
```

- 최상위 키: 문서 유형(terms / notice / paper 등).
- `categories` 하위에 카테고리명을 키로 두고, 각 카테고리는 `guide`와 `caution`을 가진다.
- 현재 가이드는 문서 유형별 5~6개 카테고리 기준의 기본 데이터이며, 법인/전문가 검수는 Phase 2 과제이다.

### 6.5 blocked 응답 구조

Pre-Guardrail에서 차단된 경우의 응답 형태를 정의한다.

```json
{
  "blocked": true,
  "blocked_reason": "prompt_injection_detected",
  "guardrail_applied": true,
  "summary": null,
  "cards": [],
  "checklist": []
}
```

규칙:
- `blocked=true`인 경우 summary/cards/checklist 등 분석 결과는 제공하지 않거나 최소화한다.
- `blocked_reason`은 내부 식별자이며, 사용자 노출용 메시지는 별도 매핑으로 변환한다(PRD 15.4 참조).
  - 예: `prompt_injection_detected` → "시스템 지시를 포함하는 입력은 분석할 수 없습니다."
  - 예: `input_too_long` → "입력 길이가 너무 깁니다. 길이를 줄여 다시 입력해주세요."
  - 예: `empty_input` → "입력 문서가 비어 있습니다."

### 6.6 추가 응답 필드

기존 분석 응답에 다음 필드를 추가한다.

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `domain_guide` | string | RAG-like로 부가된 카테고리별 도메인 가이드 설명(카드 단위) |
| `domain_caution` | string | RAG-like로 부가된 주의사항/관련 법규(카드 단위) |
| `guardrail_applied` | bool | Guardrail(PII 마스킹/표현 완화 등) 적용 여부 |
| `blocked` | bool | 입력 차단 여부(true이면 분석 결과 미제공/최소화) |

규칙:
- `domain_guide`, `domain_caution`은 매칭되는 도메인 지식이 없으면 빈 문자열(`""`)을 기본값으로 한다.
- `guardrail_applied=true`인 경우, PII 마스킹 등 적용 사실을 경고/안내 신호로 함께 전달한다(PRD 15.3 참조).

### 6.7 평가 기준 (guardrail_eval.py / domain_eval.py)

#### guardrail_eval.py — 안전 계층 평가

- 평가 대상: PII 마스킹 정확도, Prompt Injection 탐지율, 차단 동작의 정확성.
- 내부 점검 기준 결과: PII 마스킹 정확도 100%, Prompt Injection 탐지율 100%(MVP 테스트 케이스 기준).
- 한계: 정규식 기반이므로 정교한 우회 공격에 취약하며 거짓 양성 가능성이 있다. ML 기반 탐지는 Phase 2 과제.

#### domain_eval.py — 도메인 보강 효과 평가

- 평가 대상: 문서 유형별 도메인 가이드 커버리지(카테고리 매칭률), 가이드/주의사항 부가 여부.
- 내부 점검 기준 결과: 약관/공지/논문 도메인 가이드 커버리지 100%(현재 정의된 카테고리 기준).
- 한계: 카테고리 기반 매칭이므로 미정의 카테고리는 보강되지 않으며, 가이드 내용의 전문 검수는 Phase 2 과제.

> 위 평가 수치는 모두 내부 테스트 케이스 및 중간 데모 기준이며, 외부 사용자 대상 정량 평가 결과가 아니다.