# 모델 라우팅 & 성능 비교 보고서

## 비교 목적
- 현재 키워드 기반 분석기(rule_v1)와 강화형 규칙 분석기(rule_v2)의 성능을 비교한다.
- 실제 외부 LLM API를 사용하지 않고, mock judge 기반으로 평가한다.

## 비교 모델
- Model A: rule_v1
  - 기존 analyzer.py 기반의 현재 분석 로직을 그대로 사용한다.
- Model B: rule_v2
  - rule_v1을 기반으로 하되, 추가 키워드, safety 표현 완화, edge-case 대응을 강화한다.

## 테스트 데이터 구성
- 총 테스트 수: 16개
- Basic: 6개
- Edge: 5개
- Safety: 5개

## 평가 기준
- Pass Rate: mock judge가 통과한 비율
- Average Judge Score: mock judge 점수 평균

## 비교 결과
- 결과는 `python compare_models.py` 실행 시 출력된다.

## 최종 선택 모델
- 현재 기준에서는 rule_v2가 Safety 대응과 경계 상황 대응에서 더 강력하므로 우선적으로 선택할 수 있다.

## 선택 이유
- Pass Rate가 더 높거나, 동률일 때 Average Judge Score가 더 높은 모델을 우선 선택한다.
- 둘이 같으면 Safety 대응이 더 좋은 rule_v2를 선택한다.

## 현재 한계
- 실제 LLM 기반 의미 이해가 아닌 규칙 기반 평가이므로, 문맥 nuance가 더 필요하다.
- 추가 어휘와 표현을 늘리면 더 많은 케이스를 잡을 수 있지만, 오탐지도 늘어날 수 있다.

## 다음 개선 방향
- rule_v2에 추가 어휘 세트 확장
- Safety 문장용 정규식/완곡 표현 개선
- 실제 LLM judge가 도입되면 mock judge와 비교 검증
