import { useState } from 'react';

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

function SourceHighlights({
  highlights,
  initialCount,
  title = '주의 문장 하이라이트',
  showCount = true,
  expandable = true,
  onShowInDocument
}) {
  const [expanded, setExpanded] = useState(false);

  if (!Array.isArray(highlights) || highlights.length === 0) return null;

  const limit = typeof initialCount === 'number' ? initialCount : highlights.length;
  const visible = expanded ? highlights : highlights.slice(0, limit);
  const hasMore = expandable && highlights.length > limit;

  return (
    <section className="result-section">
      <div className="section-title-row">
        <h3>{title}</h3>
        {showCount && <span className="count-chip">{highlights.length}</span>}
      </div>

      <div className="highlight-list">
        {visible.map((highlight, index) => {
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
              {onShowInDocument && highlight?.source_text && (
                <button
                  type="button"
                  className="evidence-link"
                  onClick={() => onShowInDocument({ title: highlight.label, text: highlight.source_text, source: highlight.source_text })}
                >
                  문서에서 보기
                </button>
              )}
            </article>
          );
        })}
      </div>

      {hasMore && (
        <button type="button" className="more-button" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? '접기' : `주의 문장 ${highlights.length - limit}개 더 보기`}
        </button>
      )}
    </section>
  );
}

export default SourceHighlights;
