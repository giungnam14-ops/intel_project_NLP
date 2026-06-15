import { useState } from 'react';

const GROUPS = [
  { key: 'money', icon: '💰', title: '비용' },
  { key: 'dates', icon: '📅', title: '날짜/기한' },
  { key: 'actions', icon: '✅', title: '해야 할 일' },
  { key: 'warnings', icon: '⚠️', title: '주의사항' }
];

// Default items shown per category before "전체 보기" (actions get 2, rest 1).
const DEFAULT_PREVIEW = { money: 1, dates: 1, actions: 2, warnings: 1 };

function dedupeByValue(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const value = item?.value;
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(item);
  }
  return out;
}

function KeyFacts({ keyFacts, previewCounts = DEFAULT_PREVIEW, showCount = true }) {
  const [expanded, setExpanded] = useState(false);

  if (!keyFacts || typeof keyFacts !== 'object') return null;

  const groups = GROUPS
    .map((group) => ({
      ...group,
      items: dedupeByValue(Array.isArray(keyFacts[group.key]) ? keyFacts[group.key] : [])
    }))
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  const previewFor = (key) => previewCounts[key] ?? 1;
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const hasMore = groups.some((group) => group.items.length > previewFor(group.key));

  return (
    <section className="result-section">
      <div className="section-title-row">
        <h3>꼭 확인할 정보</h3>
        {showCount && <span className="count-chip">{total}</span>}
      </div>

      <div className="keyfacts">
        {groups.map((group) => {
          const items = expanded ? group.items : group.items.slice(0, previewFor(group.key));
          return (
            <div className={`keyfact-group keyfact-${group.key}`} key={group.key}>
              <div className="keyfact-group-head">
                <span className="keyfact-emoji" aria-hidden="true">{group.icon}</span>
                <span className="keyfact-group-title">{group.title}</span>
                <span className="keyfact-group-count">{group.items.length}</span>
              </div>

              <div className="keyfact-list">
                {items.map((item, index) => (
                  <article className="keyfact-card" key={`${group.key}-${index}`}>
                    {item?.label && <p className="keyfact-label">{item.label}</p>}
                    <p className="keyfact-value">{item?.value}</p>
                    {item?.source_text && (
                      <p className="keyfact-source">
                        <span className="keyfact-source-tag">근거</span>
                        {item.source_text}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button type="button" className="more-button" onClick={() => setExpanded((prev) => !prev)}>
          {expanded ? '접기' : '전체 보기'}
        </button>
      )}
    </section>
  );
}

export default KeyFacts;
