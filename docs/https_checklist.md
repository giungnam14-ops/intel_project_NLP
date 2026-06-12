# HTTPS / 배포 점검 체크리스트

> 본 문서는 배포 준비용 점검 체크리스트이다. 실제 도메인/HTTPS/WAF는 구성되어 있지 않으며, 비밀값은 포함하지 않는다.
> 상세 절차는 [deployment_cloudflare.md](./deployment_cloudflare.md) 참조.

## DNS
- [ ] Cloudflare에 도메인 추가 및 네임서버 변경 완료
- [ ] 프론트엔드 DNS 레코드 생성
- [ ] 백엔드 API DNS 레코드/서브도메인(예: `api.`) 생성

## SSL / TLS
- [ ] HTTPS 활성화(Always Use HTTPS)
- [ ] SSL/TLS 모드 확인(Full 또는 Full strict)
- [ ] 인증서 정상 발급 확인

## CORS
- [ ] 백엔드 CORS가 프로덕션 프론트엔드 origin 허용(와일드카드 대신 명시적 origin 권장)

## 환경 변수
- [ ] `VITE_API_BASE_URL`(프론트) = https 백엔드 주소
- [ ] `BACKEND_ALLOWED_ORIGINS`(백엔드) = 프론트엔드 origin
- [ ] 비밀값은 환경 변수/시크릿으로만 관리(저장소 미포함)

## 프론트엔드 API URL
- [ ] API 호출 주소가 https로 설정됨
- [ ] mixed-content(https 페이지의 http 호출) 없음

## 백엔드 헬스 체크
- [ ] `GET /health` → `{"status":"ok"}`
- [ ] `POST /analyze` 정상 응답

## WAF / Rate Limiting
- [ ] `/analyze` Rate Limit 적용
- [ ] 봇/스캐너 차단
- [ ] 대용량 payload 제한
- [ ] 과도한 POST 요청 차단

## 최종 스모크 테스트
- [ ] 홈페이지 HTTPS 정상 오픈
- [ ] `/health` 정상
- [ ] `/analyze` 정상
- [ ] Prompt Injection 입력 차단(`blocked=true`)
- [ ] PII 마스킹 동작
