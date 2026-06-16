import { useState } from 'react';
import { buildEvidence } from '../utils/evidence';

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
  const [rawOpen, setRawOpen] = useState({});

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
          const evidence = buildEvidence(highlight?.source_text);
          const isGood = evidence.quality === 'good' && Boolean(evidence.cleaned);
          const showRaw = rawOpen[index];
          return (
            <article
              className={`highlight-card sev-${severity}`}
              key={highlight?.id || `highlight-${index}`}
            >
              <div className="highlight-top">
                <span className="highlight-label">{highlight?.label}</span>
                <span className={`sev-chip sev-${severity}`}>{SEVERITY_LABELS[severity]}</span>
              </div>

              {isGood ? (
                <>
                  <p className="highlight-source">“{evidence.cleaned}”</p>
                  {highlight?.reason && <p className="highlight-reason">{highlight.reason}</p>}
                  {evidence.raw.length > evidence.cleaned.length && (
                    <button
                      type="button"
                      className="evidence-rawtoggle"
                      onClick={() => setRawOpen((prev) => ({ ...prev, [index]: !prev[index] }))}
                    >
                      {showRaw ? '원문 접기' : '원문 일부 보기'}
                    </button>
                  )}
                  {showRaw && <p className="highlight-rawtext">{evidence.raw}</p>}
                </>
              ) : (
                <div className="evidence-lowq">
                  <p className="evidence-lowq-title">근거 문장을 정확히 찾기 어려워요</p>
                  <p className="evidence-lowq-desc">
                    PDF에서 추출된 텍스트가 일부 깨져 있어요. 원본 문서나 추출 텍스트를 확인해 주세요.
                  </p>
                </div>
              )}

              {onShowInDocument && highlight?.source_text && (
                <button
                  type="button"
                  className="evidence-link"
                  onClick={() => onShowInDocument({
                    title: highlight.label,
                    text: isGood ? evidence.cleaned : '',
                    rawTextForMatch: evidence.raw,
                    source: isGood ? evidence.cleaned : evidence.raw,
                    quality: isGood ? 'good' : 'low'
                  })}
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
