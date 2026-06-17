const RISK_TEXT = {
  high: '돈, 해지, 개인정보, 책임 제한처럼 직접 확인해야 할 조건이 여러 개 있어요.',
  medium: '확인할 조건이 일부 있어요. 핵심 항목을 보고 넘어가세요.',
  low: '큰 위험 신호는 적지만, 원문 확인은 필요해요.'
};

import { computeRisk } from '../utils/riskScore';

const LEVEL_LABEL = { high: '높음', medium: '중간', low: '낮음' };
const LEVEL_STATUS = { high: '꼭 확인 필요', medium: '확인 권장', low: '가볍게 확인' };

// Map backend risk_level + signal volume into a 3-level display bucket.
function riskLevel(result, signalCount) {
  if (String(result?.risk_level || '').includes('높')) return 'high';
  return signalCount >= 2 ? 'medium' : 'low';
}

// Pick up to 3 short, distinct reason labels behind the importance judgement.
function riskReasons(result) {
  const kf = result?.key_facts || {};
  const labels = [];
  (Array.isArray(result?.highlights) ? result.highlights : []).forEach((h) => h?.label && labels.push(h.label));
  (Array.isArray(kf.warnings) ? kf.warnings : []).forEach((w) => w?.value && labels.push(w.value));
  (Array.isArray(result?.cards) ? result.cards : []).forEach((c) => c?.category && labels.push(c.category));

  const seen = new Set();
  const unique = [];
  for (const label of labels) {
    if (!seen.has(label)) {
      seen.add(label);
      unique.push(label);
    }
    if (unique.length >= 3) break;
  }
  return unique;
}

function ResultSummary({ result, noisy = false }) {
  if (!result) return null;

  const kf = result.key_facts || {};
  const signalCount =
    (Array.isArray(result.highlights) ? result.highlights.length : 0) +
    (Array.isArray(kf.warnings) ? kf.warnings.length : 0) +
    (Array.isArray(kf.money) ? kf.money.length : 0) +
    (Array.isArray(kf.dates) ? kf.dates.length : 0) +
    (Array.isArray(kf.actions) ? kf.actions.length : 0);

  const level = riskLevel(result, signalCount);
  const reasons = riskReasons(result);
  const risk = computeRisk(result);

  return (
    <section className={`summary-card summary-level-${level}`}>
      <div className="summary-pills">
        <span className="summary-pill">{result.document_type_label || result.document_type}</span>
        <span className={`summary-status summary-status-${level}`}>
          중요도 {LEVEL_LABEL[level]} · {LEVEL_STATUS[level]}
        </span>
      </div>

      <p className="risk-explain">{RISK_TEXT[level]}</p>

      {reasons.length > 0 && (
        <div className="risk-reasons">
          <span className="risk-reasons-label">판단 근거</span>
          <span className="risk-reason-chips">
            {reasons.map((reason, index) => (
              <span className="risk-reason-chip" key={`${reason}-${index}`}>{reason}</span>
            ))}
          </span>
        </div>
      )}

      {risk.clauses.length > 0 && (
        <p className="risk-flag">독소조항 {risk.clauses.length}개 발견 · 위험 점수 {risk.score}점 (근거 탭에서 확인)</p>
      )}

      {noisy && (
        <p className="risk-quality">분석 정확도가 낮을 수 있어요. 원본과 함께 확인하세요.</p>
      )}

      <span className="summary-label">한 줄 요약</span>
      <p className="summary-text">{result.summary}</p>
    </section>
  );
}

export default ResultSummary;
