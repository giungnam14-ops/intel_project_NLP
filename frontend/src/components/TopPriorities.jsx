import { useState } from 'react';

const TYPE_HINTS = {
  terms: '결제·환불·개인정보·해지 조건을 먼저 확인해 보세요.',
  notice: '신청 방법·제출 기한·대상 조건을 먼저 확인해 보세요.',
  paper: '연구 목적·방법·결과·한계를 중심으로 확인해 보세요.',
  default: '꼭 봐야 할 주의사항과 해야 할 일을 먼저 확인해 보세요.'
};

const TAG_ICONS = {
  주의: '⚠️',
  '해야 할 일': '✅',
  비용: '💰',
  기한: '📅',
  개인정보: '🔒',
  핵심: '⭐'
};

// Pick the 3 most important things to confirm first, by priority.
function pickTop(result) {
  const kf = result?.key_facts || {};
  const highlights = Array.isArray(result?.highlights) ? result.highlights : [];
  const cards = Array.isArray(result?.cards) ? result.cards : [];
  const money = Array.isArray(kf.money) ? kf.money : [];
  const dates = Array.isArray(kf.dates) ? kf.dates : [];
  const actions = Array.isArray(kf.actions) ? kf.actions : [];
  const warnings = Array.isArray(kf.warnings) ? kf.warnings : [];

  const items = [];
  const seen = new Set();
  const push = (tag, title, desc, source) => {
    if (!title) return;
    const key = `${tag}|${title}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ tag, title, desc, source: source || '' });
  };

  // 1) 가장 위험한 주의사항
  const highHl = highlights.find((h) => String(h?.severity).toLowerCase() === 'high') || highlights[0];
  if (highHl) {
    push('주의', highHl.label, highHl.reason || '주의해서 볼 문장이 있어요.', highHl.source_text);
  } else if (warnings[0]) {
    push('주의', warnings[0].value, '주의가 필요한 조건이 있어요.', warnings[0].source_text);
  }

  // 2) 가장 중요한 해야 할 일
  if (actions[0]) {
    push('해야 할 일', actions[0].value, '문서에서 직접 처리해야 할 내용이 있어요.', actions[0].source_text);
  }

  // 3) 비용 / 기한 / 개인정보 중 하나
  if (money[0]) {
    push('비용', money[0].label || '비용', money[0].value, money[0].source_text);
  } else if (dates[0]) {
    push('기한', dates[0].label || '기한', dates[0].value, dates[0].source_text);
  } else {
    const privacy = warnings.find((w) => /개인정보|제3자/.test(w.value || ''));
    if (privacy) push('개인정보', privacy.value, '개인정보 관련 조건이 있어요.', privacy.source_text);
  }

  // 부족하면 카드(중요도 높음 우선)로 채우기
  if (items.length < 3) {
    const sortedCards = [...cards].sort((a, b) => {
      const ah = String(a?.level || '').includes('높') ? 1 : 0;
      const bh = String(b?.level || '').includes('높') ? 1 : 0;
      return bh - ah;
    });
    for (const card of sortedCards) {
      if (items.length >= 3) break;
      const tag = String(card?.level || '').includes('높') ? '주의' : '핵심';
      push(tag, card?.title || card?.category, card?.message || '', card?.original_sentence);
    }
  }

  return items.slice(0, 3);
}

function TopPriorities({ result }) {
  const [open, setOpen] = useState(null);
  const items = pickTop(result);
  if (items.length === 0) return null;

  const hint = TYPE_HINTS[result?.document_type] || TYPE_HINTS.default;

  return (
    <section className="top-priorities">
      <div className="top-priorities-head">
        <h3 className="top-priorities-title">지금 꼭 확인할 것</h3>
        <p className="top-priorities-hint">{hint}</p>
      </div>

      <ol className="top-priorities-list">
        {items.map((item, index) => {
          const isOpen = open === index;
          return (
            <li className="top-priority-item" key={`${item.tag}-${index}`}>
              <button
                type="button"
                className="top-priority-row"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                <span className="top-priority-rank">{index + 1}</span>
                <span className="top-priority-body">
                  <span className="top-priority-label">
                    <span className="top-priority-emoji" aria-hidden="true">{TAG_ICONS[item.tag] || '⭐'}</span>
                    {item.title}
                  </span>
                  {item.desc && <span className="top-priority-desc">{item.desc}</span>}
                </span>
                <span className="top-priority-toggle" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>

              {isOpen && (
                <div className="top-priority-detail">
                  {item.source
                    ? <p className="top-priority-source">“{item.source}”</p>
                    : <p className="top-priority-source muted">관련 내용을 근거 탭에서 확인해 보세요.</p>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default TopPriorities;
