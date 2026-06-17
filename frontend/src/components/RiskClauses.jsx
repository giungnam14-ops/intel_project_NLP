import { buildEvidence } from '../utils/evidence';
import { computeRisk, RISK_LEVEL_TEXT } from '../utils/riskScore';

function RiskClauses({ result, onShowInDocument }) {
  const { score, level, clauses } = computeRisk(result);

  return (
    <section className="result-section risk-section">
      <div className="section-title-row">
        <h3>독소조항 위험 점수</h3>
        <span className={`count-chip risk-chip-${level}`}>{score}점</span>
      </div>

      <div className="risk-gauge" role="img" aria-label={`위험 점수 ${score}점`}>
        <span className={`risk-gauge-fill risk-gauge-${level}`} style={{ width: `${score}%` }} />
      </div>
      <p className="risk-level-text">{RISK_LEVEL_TEXT[level]}</p>

      {clauses.length > 0 && (
        <div className="risk-clause-list">
          {clauses.map((clause) => {
            const evidence = buildEvidence(clause.evidence);
            const isGood = evidence.quality === 'good' && Boolean(evidence.cleaned);
            return (
              <article className="risk-clause" key={clause.key}>
                <div className="risk-clause-head">
                  <span className="risk-clause-icon" aria-hidden="true">⚠️</span>
                  <span className="risk-clause-label">{clause.label}</span>
                </div>
                <p className="risk-clause-why">{clause.why}</p>
                {clause.evidence && onShowInDocument && (
                  <button
                    type="button"
                    className={`evidence-link${isGood ? '' : ' is-muted'}`}
                    onClick={() => onShowInDocument({
                      title: clause.label,
                      text: isGood ? evidence.cleaned : '',
                      rawTextForMatch: evidence.raw,
                      source: isGood ? evidence.cleaned : evidence.raw,
                      quality: isGood ? 'good' : 'low'
                    })}
                  >
                    {isGood ? '문서에서 보기' : '원본 확인 필요'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RiskClauses;
