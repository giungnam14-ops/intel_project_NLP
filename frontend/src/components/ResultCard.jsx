function getLevelClass(level) {
  const normalized = String(level || '').toLowerCase();

  if (normalized.includes('높')) return 'danger';
  if (normalized.includes('중')) return 'warning';
  return 'info';
}

function ResultCard({ card }) {
  return (
    <article className="result-card">
      <div className="card-topline">
        <span className="card-category">{card.category}</span>
        <span className={`level-chip level-${getLevelClass(card.level)}`}>{card.level}</span>
      </div>
      <h4>{card.title}</h4>
      <p className="card-message">{card.message}</p>
      <div className="card-source-box">
        <strong>원문</strong>
        <p>{card.original_sentence}</p>
      </div>
    </article>
  );
}

export default ResultCard;
