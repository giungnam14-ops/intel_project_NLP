const SEVERITY_LABELS = {
  high: '주의 높음',
  medium: '주의',
  low: '참고'
};

function severityClass(severity) {
  const normalized = String(severity || '').toLowerCase();
  if (normalized === 'high') return 'high';
  if (normalized === 'medium') return 'medium';
  return 'low';
}

function SourceHighlights({ highlights }) {
  if (!Array.isArray(highlights) || highlights.length === 0) return null;

  return (
    <section className="result-section">
      <div className="section-title-row">
        <h3>주의 문장 하이라이트</h3>
        <span className="count-chip">{highlights.length}</span>
      </div>

      <div className="highlight-list">
        {highlights.map((highlight, index) => {
          const severity = severityClass(highlight?.severity);
          return (
            <article
              className={`highlight-card sev-${severity}`}
              key={highlight?.id || `highlight-${index}`}
            >
              <div className="highlight-top">
                <span className="highlight-label">{highlight?.label}</span>
                <span className={`sev-chip sev-${severity}`}>{SEVERITY_LABELS[severity]}</span>
              </div>
              {highlight?.source_text && (
                <p className="highlight-source">“{highlight.source_text}”</p>
              )}
              {highlight?.reason && <p className="highlight-reason">{highlight.reason}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default SourceHighlights;
