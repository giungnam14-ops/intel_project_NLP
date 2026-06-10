# ADR: RAG-like 도메인 지식 보강 선택

## Status
Accepted

## Context
- 이 서비스는 약관, 공지문, 논문/보고서에서 핵심 정보와 주의 문장을 탐지하는 MVP다.
- 문서 유형별로 확인해야 할 항목이 다르므로, 도메인별 안내와 체크리스트가 필요하다.
- 현재 MVP는 rule_v2 기반으로 동작하며, 16일 내 빠르게 검증할 구조가 필요하다.
- Fine-tuning을 적용하려면 학습 데이터와 평가 시간이 충분해야 하지만, 현재 프로젝트는 데이터와 시간 여유가 제한적이다.

## Decision
- Fine-tuning은 이번 MVP 범위에서 제외한다.
- Lightweight RAG-like 구조를 적용한다.
- 벡터DB 대신 domain_knowledge.json과 keyword-based retriever를 사용한다.
- rule_v2 결과에 도메인 가이드와 주의 문구를 보강한다.

## Alternatives Considered
1. Fine-tuning
   - 장점: 모델이 도메인 표현을 더 잘 학습할 수 있다.
   - 단점: 데이터 부족, 학습 비용, 시간 부족, 평가 복잡도가 증가한다.

2. Full RAG with Vector DB
   - 장점: 확장성과 검색 품질이 좋다.
   - 단점: 현재 MVP에 비해 구현 부담이 크다.

3. Lightweight RAG-like
   - 장점: 빠르게 구현 가능하고 기존 구조와 잘 맞는다.
   - 단점: 의미 기반 검색이 아니라 키워드/카테고리 기반이라 한계가 있다.

## Consequences
- 구현 속도를 유지하면서 도메인 설명 품질을 높일 수 있다.
- 테스트와 평가가 쉬워진다.
- 향후 실제 RAG, 임베딩, 벡터DB로 확장할 수 있다.
- 단, 현재는 실제 LLM 생성이나 의미 검색을 수행하지 않는다.

## Validation
- domain_eval.py로 rule_v2와 RAG-like 보강 결과를 비교한다.
- Basic / Edge / Safety 테스트에서 기존 성능이 유지되는지 확인한다.
- 도메인 가이드 커버리지와 체크리스트 보강 수치를 확인한다.
