# 모델 라우팅 & 성능 비교 보고서

## 비교 목적
- Day 8 목표에 따라 두 가지 규칙 기반 분석 전략(rule_v1, rule_v2)의 성능을 비교한다.
- 실제 외부 LLM API 없이 mock judge 기반으로 평가하여, 모델 선택 기준과 안정성을 검증한다.

## 비교한 모델
- Model A: rule_v1
  - 기존 analyzer 기반의 기본 규칙 전략이다.
- Model B: rule_v2
  - rule_v1을 확장한 강화형 규칙 전략으로, 안전한 표현과 edge-case 대응을 보강한다.

## 테스트 구성
- 총 테스트 수: 16개
- Basic: 6개
- Edge: 5개
- Safety: 5개

## 평가 기준
- Pass Rate: mock judge가 통과한 비율
- Mock LLM-Judge Score: 각 케이스의 평가 점수 평균

## 비교 결과 표
| 모델 | Pass Rate | Avg Judge Score | Basic Pass Rate | Edge Pass Rate | Safety Pass Rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| rule_v1 | 100.00% | 1.00 | 100.00% | 100.00% | 100.00% |
| rule_v2 | 100.00% | 1.00 | 100.00% | 100.00% | 100.00% |

## 최종 선택 모델
- rule_v2

## 선택 이유
- 두 모델의 Pass Rate와 Judge Score는 동일하게 100.00% / 1.00이었지만,
- Safety 대응 기준을 우선 적용해 더 안전한 표현을 제공하는 rule_v2를 최종 선택한다.

## 현재 한계
- 실제 LLM 모델 비교가 아니라 규칙 기반 전략 비교이며,
- 현재 평가는 mock judge 기반의 정적 평가에 머물러 있다.

## 다음 개선 방향
- 실제 LLM API 연결 및 비교 실험 추가
- 테스트 케이스를 더 확장하여 다양한 문서 유형과 예외 상황을 포함
- 사용자 피드백 기반 평가와 품질 지표를 추가하여 실제 운영 성능을 검증
