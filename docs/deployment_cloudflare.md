# Cloudflare 커스텀 도메인 + HTTPS 배포 가이드 (배포 준비)

## 1. 문서 목적

본 문서는 **문요(5초 문서체크)** 를 커스텀 도메인과 HTTPS로 공개 배포하기 위한 **배포 준비 가이드**이다.
Cloudflare를 통해 DNS / HTTPS / WAF를 적용하고, 프론트엔드(React+Vite)와 백엔드(FastAPI)를 연결하는 절차를 정리한다.

> **현재 상태**: 현재 저장소 기준으로 실제 Cloudflare 도메인 연결 여부는 확인되지 않았으며, 본 문서는 **배포 준비 가이드**입니다. 실제 도메인·계정·토큰은 포함되어 있지 않으며, 어떤 비밀값(secret)도 저장소에 하드코딩하지 않는다.

---

## 2. 전제 조건 (Assumptions)

- 사용자가 **커스텀 도메인**을 보유하고 있다.
- 프로젝트에 **프론트엔드 / 백엔드 배포 대상**이 각각 존재한다(예: 정적 호스팅 + FastAPI 서버/터널).
- **Cloudflare 계정**을 사용할 수 있다.
- 비밀값(API 토큰, 계정 키 등)은 환경 변수 / 시크릿 매니저로만 관리하며, 문서·코드·저장소에 노출하지 않는다.

---

## 3. 권장 배포 아키텍처

```text
사용자(User)
   │  https://example.com
   ▼
Cloudflare (DNS · HTTPS/TLS · WAF · Rate Limit)
   │
   ├──────────────► Frontend Hosting (정적 빌드: vite build 결과물)
   │                     │  API 호출 (VITE_API_BASE_URL)
   │                     ▼
   └──────────────► FastAPI Backend (예: api.example.com 또는 Cloudflare Tunnel)
                          - GET /health
                          - POST /analyze  ← Guardrail(Pre/Post) 적용
```

- 프론트엔드는 `npm run build` 결과(정적 파일)를 호스팅한다.
- 백엔드는 별도 서버 또는 **Cloudflare Tunnel**을 통해 노출하고, 서브도메인(예: `api.example.com`)으로 연결하는 것을 권장한다.

---

## 4. 커스텀 도메인 설정 체크리스트

- [ ] Cloudflare에 도메인을 추가(Add a Site)한다.
- [ ] 도메인 등록업체에서 **네임서버(nameserver)** 를 Cloudflare가 안내한 값으로 변경한다.
- [ ] 프론트엔드용 **DNS 레코드**를 생성한다(예: `@` 또는 `www` → 프론트 호스팅).
- [ ] 백엔드 API용 **DNS 레코드/서브도메인**을 생성한다(예: `api` → FastAPI 서버 또는 Tunnel).
- [ ] **HTTPS를 활성화**한다(Always Use HTTPS, Automatic HTTPS Rewrites).
- [ ] **SSL/TLS 모드**를 확인한다(권장: **Full** 또는 **Full (strict)**; 오리진 인증서 구성 시 strict).

---

## 5. HTTPS 체크리스트

- [ ] 프론트엔드가 **https URL**로 서비스된다.
- [ ] 백엔드 **CORS**가 프로덕션 프론트엔드 origin을 허용한다(와일드카드 `*` 대신 명시적 origin 권장).
- [ ] 프론트엔드 **환경 변수의 API URL**(`VITE_API_BASE_URL`)이 https로 설정되어 있다.
- [ ] **mixed-content** 문제가 없다(https 페이지에서 http API를 호출하지 않는다).

> 참고: 현재 코드의 `main.py`는 개발 편의를 위해 CORS `allow_origins=["*"]`로 설정되어 있다.
> 프로덕션에서는 이를 프론트엔드 origin으로 제한하는 것을 권장한다. **본 가이드는 문서이며, 코드는 변경하지 않았다.**
> 적용이 필요하면 별도 작업으로 진행한다(아래 [9. 코드 측 권장 변경](#9-코드-측-권장-변경문서화만) 참조).

---

## 6. WAF 체크리스트

(상세 규칙은 [waf_setup_guide.md](./waf_setup_guide.md) 참조)

- [ ] `/analyze`에 **Rate Limit**(분당 요청 수 제한)을 적용한다.
- [ ] **의심스러운 봇/스캐너 트래픽**을 차단한다(Bot Fight Mode 등).
- [ ] **대용량 payload**(요청 body 크기)를 제한한다.
- [ ] 짧은 시간 내 반복되는 **과도한 POST 요청**을 차단한다.

---

## 7. 환경 변수 (Environment Variables)

> 아래는 **예시값**이며, 실제 도메인/토큰이 아니다. 비밀값은 저장소에 커밋하지 않는다.

### 프론트엔드 (.env — 예시)
```bash
# 프론트엔드가 호출할 백엔드 API 베이스 URL (https)
VITE_API_BASE_URL=https://api.example.com
```

### 백엔드 (예시)
```bash
# CORS 허용 origin (프로덕션 프론트엔드 주소)
BACKEND_ALLOWED_ORIGINS=https://example.com
```

> `BACKEND_ALLOWED_ORIGINS`는 권장 설계상의 환경 변수 예시이다. 현재 코드는 이를 읽지 않으므로, 실제 적용 시 코드 반영이 필요하다(문서화만, 코드 미변경).

---

## 8. 배포 검증 체크리스트 (Verification)

- [ ] 홈페이지가 **HTTPS로 정상 오픈**된다.
- [ ] `GET /health`가 `{"status":"ok"}`를 반환한다.
- [ ] `POST /analyze`가 정상 분석 결과를 반환한다.
- [ ] **Prompt Injection 입력이 차단**된다(`blocked=true`).
- [ ] **PII 마스킹**이 동작한다(주민번호/이메일/전화번호 등).

---

## 9. 코드 측 권장 변경(문서화만)

배포 시 다음 변경이 필요할 수 있으나, **본 작업에서는 코드를 변경하지 않았다.** 필요 시 별도 작업으로 진행한다.

- `main.py`의 CORS `allow_origins=["*"]` → 프로덕션 프론트엔드 origin으로 제한
- 프론트엔드 API 호출 주소를 하드코딩 대신 `VITE_API_BASE_URL` 사용으로 분리
- `/analyze` 입력 길이/payload 상한 점검(서버 측 1차 방어 + WAF 2차 방어)

---

## 10. 롤백 계획 (Rollback)

- **DNS 롤백**: 문제가 발생하면 Cloudflare에서 변경한 DNS 레코드를 이전 값으로 되돌리거나 프록시(주황 구름)를 일시 비활성화한다.
- **프론트엔드 롤백**: 직전 빌드 산출물로 재배포한다(호스팅의 이전 배포 버전 복원).
- **백엔드 롤백**: 직전 정상 버전으로 재배포하거나 Tunnel/서버를 이전 상태로 복구한다.
- **WAF 롤백**: 새로 추가한 규칙이 정상 트래픽을 막으면 해당 규칙을 비활성화/완화한다.
- **HTTPS 롤백**: SSL 모드 변경으로 오류 발생 시 직전 모드로 되돌린다.

---

## 11. 현재 상태 (Status)

> 현재 저장소 기준으로 실제 Cloudflare 도메인 연결 여부는 확인되지 않았으며, 본 문서는 **배포 준비 가이드**입니다.

- 실제 도메인 연결 / HTTPS / WAF 구성은 **수행되지 않았다**(문서·준비 단계).
- 실제 외부 LLM API·fine-tuning·벡터DB는 사용하지 않는다(MVP 범위).
- 비밀값(Cloudflare 토큰 등)은 저장소에 포함하지 않으며, 배포 시 환경 변수/시크릿으로만 관리한다.
