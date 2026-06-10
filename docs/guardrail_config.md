# Guardrail Configuration Guide

## Guardrail 목적
- 입력과 출력의 안전성을 미리 검증해 개인정보, 프롬프트 인젝션, 도구 오남용을 막는다.
- 기존 분석 엔진과 FastAPI, React/Vite 흐름을 유지하면서 얇은 방어 계층을 추가한다.

## Pre-LLM Guardrail
- 입력이 비어 있지 않은지 확인한다.
- 너무 긴 입력을 차단한다.
- PII(이메일, 전화번호, 주민등록번호, 카드/계좌 형태)를 마스킹한다.
- Prompt Injection 의심 표현이 있으면 차단한다.

## Post-LLM Guardrail
- 분석 결과의 요약, 메시지, 원문 문장에 PII가 남아 있지 않은지 다시 점검한다.
- 법률/의료/금융 판단처럼 단정적 표현을 완화한다.
- guardrail_applied=True를 추가해 안전성 적용 여부를 표시한다.

## Tool Guardrail
- 허용된 도구만 실행 가능하게 제한한다.
- 파일 삭제, 쉘 실행, 네트워크 스캔, 외부 결제 등 위험한 도구는 차단한다.

## PII 마스킹 대상
- 이메일 주소
- 전화번호
- 주민등록번호 형태
- 카드번호/계좌번호처럼 보이는 긴 숫자

## Prompt Injection 탐지 기준
- 이전 지시 무시, 시스템 프롬프트 공개, jailbreak, guardrail bypass, 관리자 권한 요구, 정책 우회 표현

## 차단 정책
- Prompt Injection high 위험은 차단한다.
- 너무 긴 입력도 차단한다.
- 정상 입력은 기존 분석 흐름을 그대로 유지한다.

## 기존 서비스 흐름과 연결 방식
- FastAPI /analyze 경로에서 apply_guardrails(text, analyze_document)로 연결한다.
- React/Vite는 기존 cards/checklist/summary 구조를 그대로 사용한다.

## 한계와 개선 방향
- 현재는 정규식 기반의 경량 검사에 가깝다.
- 향후 실제 LLM, 벡터 검색, WAF 정책과 결합해 더 정교한 방어를 추가할 수 있다.
