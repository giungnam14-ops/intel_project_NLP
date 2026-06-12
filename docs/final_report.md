# 문요 최종 평가 보고서

> **실행 환경 주의(정직성 고지)**
> 본 평가는 작성 환경에 **실제 Python 인터프리터가 설치되어 있지 않아**(`python`/`python3`가 Windows Store 스텁만 존재) 이번 세션에서 평가 스크립트를 **직접 재실행하지는 못했다.**
> 따라서 아래 수치는 저장소에 **기록된 평가 결과**([model_compare_report.md](./model_compare_report.md), [domain_eval_report.md](./domain_eval_report.md), [feedback.md](./feedback.md))를 정리한 것이며, "이번 세션에서 새로 측정한 값"이 아니다. 재실행 명령은 §4에 그대로 기재해 두었다.
> 또한 모든 평가는 **내부 테스트 케이스 및 중간 데모 기준**이며, 외부 사용자 정량 테스트 결과가 아니다.

---

## 1. 문서 목적

- 문요(5초 문서체크)의 최종 Eval 결과를 정리한다.
- 초기 테스트/중간 데모 피드백과 최종 결과를 비교한다.
- 전/후 개선 성과를 기록한다.

## 2. 프로젝트 요약

- **서비스명**: 문요 (5초 문서체크)
- **목적**: 긴 문서에서 핵심 정보, 주의 문장, 체크리스트를 제공하는 문서 요점 체크 서비스
- **주요 대상 문서**: 약관/동의서, 공지문/안내문, 논문/보고서
- **구현 방식**: 규칙 기반(rule-based) NLP 파이프라인 + 경량 RAG-like 도메인 지식 + MVP Guardrail (FastAPI 백엔드 / React+Vite 프런트엔드)

## 3. 최종 평가 범위

포함 항목:

- 기본 분석 정확성
- 문서 유형 분류 (약관/공지/논문/기타)
- 핵심 카드 생성
- 체크리스트 생성
- 모델 라우팅 (rule_v1 / rule_v2)
- RAG-like 도메인 지식 보강
- Guardrail (Pre/Post)
- PII 마스킹
- Prompt Injection 차단
- Tool Guardrail

## 4. 실행한 평가 결과

> 아래 "결과"는 저장소에 **기록된 값**을 정리한 것이며, 이번 세션에서 재실행한 값이 아니다(환경에 실제 Python 미설치).
> 재실행하려면 실제 Python 3.10+ 환경에서 프로젝트 **루트**에서 명령을 실행하면 된다.

| 평가 항목 | 실행 명령 | 결과(기록 기준) | 비고 |
| --- | --- | --- | --- |
| 테스트 케이스 자동 평가 | `python -m backend.evaluation.harness` | 16/16 통과, Pass Rate 100% | Basic 6 / Edge 5 / Safety 5 (test_cases.json) |
| 모델 비교 | `python compare_models.py` | rule_v1·rule_v2 모두 Pass 100% / Judge 1.00 → **rule_v2 선택** | 정량 동일, 안전 표현 우선 원칙 |
| 도메인 보강(RAG-like) | `python domain_eval.py` | Pass 100% 유지, 도메인 가이드/주의 커버리지 74.48%, 체크리스트 보강 32건 | 벡터DB 미사용, 카테고리 매칭 |
| 안전 계층(Guardrail) | `python guardrail_eval.py` | Safety 케이스 전수 통과(5/5), PII 마스킹·Prompt Injection 탐지 100%(내부 케이스 기준) | 정규식 기반 MVP 수준 |

> 명령 경로 확인 결과:
> - `harness.py`는 `backend/evaluation/harness.py`에 위치 → `python -m backend.evaluation.harness`로 실행
> - `compare_models.py`, `domain_eval.py`, `guardrail_eval.py`는 **프로젝트 루트**에 위치 → 루트에서 직접 실행
>
> **이번 세션 실패/경고**: 평가 스크립트 자체의 실패/경고는 없음. 단, **세션 실행 환경에 실제 Python 부재**로 라이브 재실행은 수행하지 못함(위 고지 참조).

## 5. DAY 4 테스터 재검증

- **DAY 4 원본 테스터 기록은 현재 저장소에서 확인되지 않음.**
  - `DAY 4`, `tester`, `테스터`, `테스트 사용자`, `초기 테스트` 등으로 전체 검색했으나 해당 원본 자료(테스터 raw data)는 발견되지 않았다.
- 따라서 재검증 기준선(baseline)은 저장소에서 **확인 가능한 자료**로 대체한다:
  - [docs/feedback.md](./feedback.md) — 중간 데모 및 내부 점검 피드백(F-001~F-010)
  - `backend/evaluation/test_cases.json` — 16개 테스트 케이스(Basic/Edge/Safety)
  - [docs/scenario.md](./scenario.md), [docs/success.md](./success.md) — 이상적 사용자 시나리오 및 MVP 성공 기준
- **초기 문제 정의(시나리오/성공 기준) → 현재 MVP 해결 현황**:

| 초기 문제/요구 | 출처 | 현재 MVP 해결 상태 |
| --- | --- | --- |
| 긴 문서를 끝까지 읽기 부담 | scenario/success | ✅ 핵심 카드 + 체크리스트로 요점 제공 |
| 문서 유형마다 봐야 할 항목이 다름 | scenario | ✅ 유형 분류 후 유형별 카테고리 탐지 |
| 중요한 조건/기한을 놓침 | scenario | ✅ level(높음/보통) 강조 + 체크리스트 재확인 |
| 어려운 표현 이해 어려움 | success | ✅ 쉬운 말 설명 + 단정 표현 완화 |
| 개인정보 입력 불안 | feedback(F-004) | ✅ PII 마스킹(안내 문구는 반영 예정) |
| 시연에서 유형별 결과 차이 | success | ✅ 약관/공지/논문 각각 다른 결과 산출 |

> 위 표는 외부 테스터 인터뷰가 아니라, 저장소의 시나리오/성공 기준 문서와 내부 점검 피드백을 기준으로 한 재검증이다.

## 6. 전/후 비교

| 항목 | 초기 상태 | 최종 상태 | 개선 결과 |
| --- | --- | --- | --- |
| 테스트 케이스 수 | 0 (비공식 CLI 확인) | 16개(Basic 6/Edge 5/Safety 5) | 체계화 |
| 자동 평가 체계 | 없음 | harness 기반 자동 평가 | 재현 가능 |
| 모델 선택 기준 | rule_v1 단일 | rule_v1/v2 비교 후 rule_v2 선택 | 안전 표현 우선 |
| 도메인 지식 보강 | 없음 | 경량 RAG-like(domain_knowledge.json) | 가이드/주의 보강 |
| 개인정보 보호 | 없음 | PII 마스킹(입력+출력) | 노출 방지 |
| Prompt Injection 방어 | 없음 | 탐지·차단(Pre-Guardrail) | 안전성 강화 |
| 문서화 수준 | 분산/부족 | PRD v2/TRD v4/DFD/피드백/결정 기록 | 일관 문서화 |
| README/실행 안내 | 없음 | README + Quick Start(5분 실행) | 온보딩 개선 |
| 배포 준비 상태 | 없음 | Cloudflare/HTTPS 배포 준비 가이드 | 준비 단계 문서화 |

## 7. 핵심 성과

- 16개 테스트 케이스 기반 **자동 평가 체계** 구축
- 모델 비교 후 **rule_v2 최종 선택**(정량 동일 시 안전 표현 우선)
- **경량 RAG-like** 도메인 지식 구조 적용(벡터DB 없이 카테고리 매칭)
- **Guardrail 안전 계층**(Pre/Post + Tool) 적용
- **PII 마스킹 및 Prompt Injection 차단** 검증(내부 케이스 기준)
- **README와 배포 문서**(Cloudflare/HTTPS 준비 가이드) 정리
- **PRD(v2)/TRD(v4)/DFD/CHANGELOG** 문서화 완료

## 8. 남은 한계

- **실제 외부 사용자 정량 테스트는 아직 부족함** — 내부 점검 및 중간 데모 기준
- **실제 외부 LLM API는 사용하지 않음** — 규칙 기반 분석
- **Fine-tuning은 적용하지 않음**
- **벡터DB 기반 RAG가 아님** — 키워드/카테고리 기반 경량 RAG-like
- **Cloudflare 실제 도메인/HTTPS 적용은 계정과 도메인이 필요** — 현재는 문서/준비 단계이며 실제 배포되어 있지 않음
- **Guardrail은 정규식/패턴 기반 MVP 수준** — 정교한 우회 공격에 취약 가능
- (이번 세션 한정) 실행 환경에 실제 Python이 없어 평가 스크립트 **라이브 재실행은 미수행**, 기록된 결과로 정리함

## 9. 결론

- 현재 MVP는 초기 문제 정의(긴 문서의 요점·주의·체크리스트 제공, 문서 유형별 차등 분석)와 [success.md](./success.md)의 MVP 성공 기준을 **충족한다.**
  - 문서 입력 → 유형 분류 → 유형별 핵심 정보/주의 문장 탐지 → 카드/체크리스트 출력 → 약관·공지·논문 시연 차별화까지 모두 동작(기록 기준 16/16 통과).
- **발표/제출 가능 상태**: ✅ 가능. 기능 완성도, 자동 평가 체계, 안전 계층, 문서화(PRD/TRD/DFD/README/CHANGELOG/배포 가이드)가 갖춰져 있다.
  - 단, 제출 시 본 보고서 §4·§8의 정직성 고지(라이브 재실행 미수행, 외부 정량 테스트 부재, 실제 LLM/벡터DB/실배포 미적용)를 함께 명시할 것을 권장한다.
- **다음 개선 방향**:
  1. 실제 Python 환경에서 4개 평가 스크립트 라이브 재실행 후 수치 갱신
  2. 중간 데모 피드백 High 항목 반영(카드 중요도 표시, 체크리스트 행동 문장, PII 마스킹 안내, 차단 메시지 UX)
  3. 실제 LLM API + 벡터DB 기반 RAG로 커버리지 확대(Phase 2)
  4. 제한된 외부 베타로 실제 정량 피드백 수집(Phase 2)
  5. Cloudflare 도메인/HTTPS/WAF 실제 구성(Phase 3)

---

## 참고 문서

- [PRD v2](./prd.md) · [TRD v4](./trd.md) · [DFD](./dfd.md)
- [Feedback](./feedback.md) · [Guardrail Config](./guardrail_config.md)
- [Model Compare Report](./model_compare_report.md) · [Domain Eval Report](./domain_eval_report.md)
- [Cloudflare 배포 가이드](./deployment_cloudflare.md) · [HTTPS 체크리스트](./https_checklist.md)
- [README](../README.md) · [CHANGELOG](../CHANGELOG.md)

---

**작성 기준일**: 2026-06-12
**상태**: 최종 평가 정리(기록 기반) 완료 — 실제 Python 환경에서 라이브 재실행 시 수치 갱신 권장
