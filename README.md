# 문요 (5초 문서체크)

> 긴 문서 속 꼭 확인해야 할 요점을 AI가 콕 집어주는 문서 요점 체크 서비스

긴 약관·공지문·논문 같은 문서를 붙여넣으면, 문서 유형을 분류하고 사용자가 놓치기 쉬운 핵심 정보와 주의 문장을 **카드 + 체크리스트** 형태로 5초 안에 확인할 수 있게 해 준다.

> **MVP 정직성 안내**: 본 프로젝트는 규칙 기반 NLP 파이프라인으로 동작한다. 실제 외부 LLM API, fine-tuning, 벡터DB는 사용하지 않으며(아래 [MVP 한계](#mvp-한계) 참조), Cloudflare 도메인/HTTPS/WAF는 **문서화·준비 단계**이고 실제 배포는 되어 있지 않다.

---

## 주요 기능

- **문서 유형 분류** — 약관/공지/논문/기타 자동 분류
- **핵심 카드 추출** — 유형별로 확인해야 할 항목을 카드로 제공
- **체크리스트 생성** — 다음 행동을 유도하는 확인 목록 생성
- **rule_v2 모델 라우팅** — 입력 특성에 따라 rule_v1 / rule_v2 선택(안전 표현 우선)
- **경량 RAG-like 도메인 지식** — `domain_knowledge.json` 기반 카테고리 매칭(벡터DB 미사용)
- **개인정보(PII) 마스킹** — 주민번호·이메일·전화번호 등 자동 마스킹
- **Prompt Injection 차단** — 시스템 지시 우회 시도 탐지·차단
- **Tool Guardrail** — 도구 호출 안전성 검증
- **평가 스크립트** — 테스트/모델 비교/도메인/안전 계층 자동 평가

## 기술 스택

- **Backend**: FastAPI (+ uvicorn, pydantic)
- **Frontend**: React + Vite
- **분석 엔진**: 규칙 기반(rule-based) NLP 파이프라인 (Python)
- **문서**: Markdown 문서 + Mermaid 다이어그램

---

## 프로젝트 구조

```text
project_3/
├── main.py                  # FastAPI 앱 진입점 (GET /health, POST /analyze)
├── guardrails.py            # Pre/Post Guardrail 적용
├── pii_masker.py            # PII 탐지·마스킹
├── prompt_injection.py      # Prompt Injection 탐지
├── tool_guardrail.py        # 도구 호출 검증
├── model_router.py          # rule_v1 / rule_v2 라우팅
├── rag_retriever.py         # 경량 RAG-like 도메인 지식 검색
├── domain_knowledge.json    # 문서 유형별 카테고리 가이드/주의사항
├── compare_models.py        # 모델 비교 평가
├── domain_eval.py           # 도메인 보강 효과 평가
├── guardrail_eval.py        # 안전 계층 평가
├── requirements.txt
├── backend/
│   ├── analyzer.py          # 분석 오케스트레이션
│   ├── classifier.py        # 문서 유형 분류
│   ├── extractor.py         # 핵심 항목 추출
│   ├── explainer.py         # 쉬운 말 설명
│   ├── checklist.py         # 체크리스트 생성
│   ├── schemas.py           # Pydantic 모델
│   ├── cli.py               # CLI 진입점
│   └── evaluation/
│       └── harness.py       # 테스트 케이스 자동 평가
├── frontend/                # React + Vite 프론트엔드
│   ├── package.json
│   └── vite.config.mjs      # dev 서버 127.0.0.1:5173
├── data/
│   └── sample_documents.json
├── docs/                    # PRD, TRD, DFD, 피드백, Guardrail/WAF 문서 등
└── CHANGELOG.md
```

---

## Quick Start (5분 안에 실행)

### 0. 사전 준비
- Python 3.10+ (pydantic v2의 `str | None` 사용)
- Node.js 18+ (Vite 5)

### 1. 백엔드 실행 (FastAPI)

프로젝트 **루트**에서 실행한다(`main.py`가 루트에 있고 `backend` 패키지를 import 한다).

```powershell
# 루트 디렉터리에서
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- 헬스 체크: http://127.0.0.1:8000/health
- API 문서(Swagger): http://127.0.0.1:8000/docs

### 2. 프론트엔드 실행 (React + Vite)

```powershell
cd frontend
npm install
npm run dev
```

- 개발 서버: http://127.0.0.1:5173

> 프론트엔드가 백엔드를 호출하는 API 주소는 환경 변수로 분리하는 것을 권장한다(배포 시 `VITE_API_BASE_URL`, [docs/deployment_cloudflare.md](docs/deployment_cloudflare.md) 참조).

### 3. CLI로 빠르게 분석해 보기

```powershell
# 루트 디렉터리에서
python -m backend.cli
```

### 4. 테스트 / 평가 실행

```powershell
# 루트 디렉터리에서
python -m backend.evaluation.harness   # 테스트 케이스 자동 평가 (16개)
python compare_models.py               # rule_v1 vs rule_v2 비교
python domain_eval.py                  # RAG-like 도메인 보강 효과 평가
python guardrail_eval.py               # 안전 계층(PII/Injection) 평가
```

---

## API 요약

### GET /health
서버 상태 확인용.

```json
{ "status": "ok" }
```

### POST /analyze
문서를 분석해 유형 분류·핵심 카드·체크리스트를 반환한다.

**Request**
```json
{
  "text": "분석할 문서 내용",
  "document_type": "auto"
}
```

**Response (요약)**
```json
{
  "document_type": "terms",
  "document_type_label": "약관 / 동의서",
  "risk_level": "높음",
  "summary": "...",
  "cards": [
    { "category": "...", "title": "...", "original_sentence": "...", "level": "높음", "message": "..." }
  ],
  "checklist": ["..."],
  "warnings": ["..."],
  "guardrail_applied": true,
  "blocked": false,
  "blocked_reason": null
}
```

- 빈 입력은 `400`을 반환한다.
- 차단된 입력은 `blocked=true` + `blocked_reason`으로 응답하며 분석 결과는 최소화된다.
- 응답에는 RAG-like 부가 필드(`domain_guide`, `domain_caution`)가 카드 단위로 포함될 수 있다(스키마는 `extra="allow"`).

---

## 평가 요약

> 아래 수치는 모두 **내부 테스트 케이스 및 중간 데모 기준**이며, 외부 사용자 정량 평가 결과가 아니다.

| 항목 | 스크립트 | 결과(내부 기준) |
| --- | --- | --- |
| 테스트 케이스 자동 평가 | `backend/evaluation/harness.py` | 16/16 통과 |
| 모델 비교 | `compare_models.py` | 정량 동일 → 안전 표현 우선으로 **rule_v2 선택** |
| 도메인 보강 효과 | `domain_eval.py` | RAG-like 도메인 가이드 커버리지 검증(약관/공지/논문) |
| 안전 계층 | `guardrail_eval.py` | 10/10 (PII 마스킹·Prompt Injection 탐지) |

---

## 문서 링크

- [PRD (v2)](docs/prd.md) — 제품 요구사항(중간 데모 피드백 반영)
- [TRD (v4)](docs/trd.md) — 기술 요구사항(Guardrail/RAG-like/모델 라우팅)
- [DFD](docs/dfd.md) — 데이터 흐름도 및 시퀀스 다이어그램
- [Feedback](docs/feedback.md) — 중간 데모 및 내부 점검 피드백
- [Guardrail Config](docs/guardrail_config.md) — 안전 계층 설정
- [WAF Setup Guide](docs/waf_setup_guide.md) — Cloudflare WAF 가이드
- [Cloudflare Deployment Guide](docs/deployment_cloudflare.md) — 커스텀 도메인 + HTTPS 배포 준비 가이드
- [HTTPS Checklist](docs/https_checklist.md) — HTTPS/배포 점검 체크리스트
- [CHANGELOG](CHANGELOG.md) — 변경 이력

---

## MVP 한계

- **실제 외부 LLM API 미사용** — 규칙 기반(rule_v1 / rule_v2) 분석
- **실제 fine-tuning 미수행**
- **실제 벡터DB 미사용** — 카테고리 기반 경량 RAG-like
- **Guardrail은 정규식 기반 MVP 수준** — 정교한 우회 공격에 취약 가능
- **Cloudflare 배포는 실제 도메인/계정 설정이 필요** — 현재 저장소에는 도메인 연결·HTTPS·WAF가 실제로 구성되어 있지 않으며, 관련 문서는 **배포 준비 가이드**이다([docs/deployment_cloudflare.md](docs/deployment_cloudflare.md)).
- **외부 사용자 정량 인터뷰/A-B 테스트 미수행** — 내부 점검 및 중간 데모 기준
