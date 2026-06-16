import { useState } from 'react';
import { buildEvidence } from '../utils/evidence';

function getLevelClass(level) {
  const normalized = String(level || '').toLowerCase();

  if (normalized.includes('높')) return 'danger';
  if (normalized.includes('중')) return 'warning';
  return 'info';
}

function ResultCard({ card, shortSource = false, onShowInDocument }) {
  const [showRaw, setShowRaw] = useState(false);

  const source = card.original_sentence || '';
  const evidence = buildEvidence(source);
  const isGood = evidence.quality === 'good' && Boolean(evidence.cleaned);
  const hasMoreRaw = evidence.raw.length > evidence.cleaned.length;

  const levelClass = getLevelClass(card.level);

  return (
    <article className={`result-card level-${levelClass}`}>
      <div className="card-topline">
        <span className="card-category">{card.category}</span>
        <span className={`level-chip level-${levelClass}`}>{card.level}</span>
      </div>
      <h4>{card.title}</h4>
      <p className="card-message">{card.message}</p>
      <div className="card-source-box">
        <span className="card-source-label" aria-hidden="true">📌 원문</span>
        {isGood ? (
          <>
            <p>{evidence.cleaned}</p>
            {hasMoreRaw && (
              <button
                type="button"
                className="source-toggle"
                onClick={() => setShowRaw((prev) => !prev)}
              >
                {showRaw ? '접기' : '원문 일부 보기'}
              </button>
            )}
            {showRaw && <p className="card-rawtext">{evidence.raw}</p>}
          </>
        ) : (
          <div className="evidence-lowq">
            <p className="evidence-lowq-title">근거 문장을 정확히 찾기 어려워요</p>
            <p className="evidence-lowq-desc">
              PDF에서 추출된 텍스트가 일부 깨져 있어요. 원본 문서나 추출 텍스트를 확인해 주세요.
            </p>
          </div>
        )}
        {onShowInDocument && source && (
          <button
            type="button"
            className="evidence-link"
            onClick={() => onShowInDocument({
              title: card.title || card.category,
              text: isGood ? evidence.cleaned : '',
              rawTextForMatch: evidence.raw,
              source: isGood ? evidence.cleaned : evidence.raw,
              quality: isGood ? 'good' : 'low'
            })}
          >
            문서에서 보기
          </button>
        )}
      </div>
    </article>
  );
}

export default ResultCard;
