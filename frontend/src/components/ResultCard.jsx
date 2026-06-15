import { useState } from 'react';

const MAX_EXCERPT_LENGTH = 220;
const SHORT_EXCERPT_LENGTH = 110;

function getLevelClass(level) {
  const normalized = String(level || '').toLowerCase();

  if (normalized.includes('높')) return 'danger';
  if (normalized.includes('중')) return 'warning';
  return 'info';
}

function ResultCard({ card, shortSource = false }) {
  const [expanded, setExpanded] = useState(false);

  const excerptLength = shortSource ? SHORT_EXCERPT_LENGTH : MAX_EXCERPT_LENGTH;
  const source = card.original_sentence || '';
  const isLong = source.length > excerptLength;
  const visibleSource = isLong && !expanded
    ? `${source.slice(0, excerptLength)}…`
    : source;

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
        <p>{visibleSource}</p>
        {isLong && (
          <button
            type="button"
            className="source-toggle"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? '접기' : '더 보기'}
          </button>
        )}
      </div>
    </article>
  );
}

export default ResultCard;
