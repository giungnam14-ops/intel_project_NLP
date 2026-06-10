# Cloudflare WAF Setup Guide

## WAF 목적
- 공개 서비스에서 과도한 요청, 봇 트래픽, 프롬프트 인젝션 시도, 대용량 payload를 차단한다.
- 현재는 문서화 중심이며, 실제 Cloudflare 설정은 자동화하지 않는다.

## 보호 대상
- FastAPI /analyze 엔드포인트
- 프런트엔드에서 전송하는 문서 입력 요청

## 추천 규칙
- Rate limiting: /analyze에 분당 요청 수 제한 적용
- Bot traffic 차단: 알려진 봇/스캐너/User-Agent 차단
- 대형 payload 제한: 1회 요청 body 크기 제한
- 과도한 POST 요청 감지: 짧은 시간 내 반복 호출 차단
- 국가/IP 차단은 MVP 단계에서 선택 사항

## 예시 설정 흐름
1. Cloudflare Dashboard에서 WAF 또는 Rules를 연다.
2. /analyze에 대해 Rate Limit 규칙을 추가한다.
3. Bot Fight Mode 또는 Super Bot Fight Mode를 활성화한다.
4. 큰 payload를 막기 위해 Request Size 제한을 확인한다.
5. 로컬 개발 단계에서는 문서 기준으로만 검토한다.

## 배포 시 적용 순서
1. FastAPI 서비스 배포
2. Cloudflare Tunnel 또는 DNS 연결
3. WAF 규칙 적용
4. 로그 기반으로 비정상 요청 패턴 확인

## 현재 단계의 한계
- 실제 환경 설정은 수행하지 않는다.
- 로컬 서비스의 정상 동작과 Guardrail 검증만 우선 확인한다.
