Create a clean web app prototype for an NLP service called "5초 문서체크".

The service helps users paste long daily documents and quickly understand the key information and caution sentences.

Use a modern React or Next.js style layout.

The app should have the following layout:

1. Header section
- App name: 5초 문서체크
- Subtitle: 긴 문서를 끝까지 읽지 않아도 핵심 정보와 주의 문장을 5초 안에 확인하세요.
- Small description: 약관, 공지문, 논문 등 다양한 생활 문서를 NLP로 분석합니다.

2. Document input section
- Large text area with placeholder:
  "분석할 문서를 붙여넣어 주세요."
- Example document buttons:
  - 약관 예시
  - 공지문 예시
  - 논문 예시
- Primary button:
  "분석하기"

3. Result summary section
- Document type badge
  Example: 문서 유형: 약관 / 동의서
- Overall risk or importance badge
  Example: 위험도 높음
- Short one-line summary:
  "이 문서에는 자동결제, 환불 제한, 개인정보 제공 관련 주의 항목이 포함되어 있습니다."

4. Key result cards
Show cards in a responsive grid.
Each card should include:
- Category icon
- Category title
- Short key message
- Risk or importance level
- Easy explanation
- Original sentence toggle

Example cards:
- 자동결제 있음
- 환불 제한 있음
- 개인정보 제공 있음
- 해지 조건 있음

5. Checklist section
- Title: 확인 체크리스트
- Checkbox items:
  - 자동결제 시작일 확인
  - 환불 가능 여부 확인
  - 개인정보 제공 여부 확인
  - 해지 마감일 확인

6. Supported document types section
Show three cards:
- 약관 / 동의서
- 공지문 / 안내문
- 논문 / 보고서

7. Visual style
- Clean and modern
- Light background
- Card-based layout
- Blue accent color
- Rounded corners
- Easy to scan in 5 seconds
- Korean UI text

Do not build backend logic.
Focus on frontend layout and user experience.
The prototype should clearly show that the service is not a generic summarizer, but a 5-second document checking tool that displays key information as cards and checklists.