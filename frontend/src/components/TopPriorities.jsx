import { useState } from 'react';
import { buildEvidence } from '../utils/evidence';

// Friendly, sentence-style copy per theme. Titles read as plain sentences so a
// first-time user understands them without knowing the internal keywords.
const THEMES = {
  refund: {
    emoji: '💳',
    title: '해지·환불 조건을 확인해야 해요',
    desc: '환불·해지 조건이 제한될 수 있어요.',
    why: '환불 가능 기간이나 해지 조건이 제한될 수 있으니 먼저 확인하세요.'
  },
  cancel: {
    emoji: '🚪',
    title: '해지/탈회 조건을 확인해야 해요',
    desc: '해지·탈퇴 조건이 있어요.',
    why: '해지·탈퇴 절차나 제한 조건이 있는지 확인하세요.'
  },
  privacy: {
    emoji: '🔒',
    title: '개인정보 제공 조건이 있어요',
    desc: '개인정보 제공 관련 내용이 있어요.',
    why: '개인정보가 누구에게 어디까지 제공되는지 확인하세요.'
  },
  money: {
    emoji: '💰',
    title: '비용이나 비율 조건이 있어요',
    desc: '비용·수수료·비율 조건이 있어요.',
    why: '비용 또는 비율과 관련된 조건이 있습니다. 실제 부담 여부를 확인하세요.'
  },
  liability: {
    emoji: '⚠️',
    title: '책임이 제한될 수 있어요',
    desc: '책임 제한 조건이 있어요.',
    why: '문제가 생겨도 사업자 책임이 제한되는 조건이 있는지 확인하세요.'
  },
  restriction: {
    emoji: '🚫',
    title: '이용이 제한될 수 있어요',
    desc: '이용 제한 조건이 있어요.',
    why: '특정 조건에서 이용이 제한될 수 있으니 제한 조건을 확인하세요.'
  },
  notice: {
    emoji: '📣',
    title: '사전 안내 없이 적용될 수 있어요',
    desc: '사전 고지 없이 적용될 수 있어요.',
    why: '사전 고지 없이 조건이 바뀌거나 적용될 수 있으니 확인하세요.'
  },
  action: {
    emoji: '✅',
    title: '직접 해야 할 일이 있어요',
    desc: '직접 처리할 내용이 있어요.',
    why: '서명·제출·동의처럼 사용자가 직접 처리해야 할 내용이 있습니다.'
  },
  date: {
    emoji: '📅',
    title: '기한이나 마감이 있어요',
    desc: '확인할 기한이 있어요.',
    why: '신청·제출·환불 기한을 놓치지 않도록 날짜를 확인하세요.'
  },
  unfair: {
    emoji: '❗',
    title: '불리한 조건이 있을 수 있어요',
    desc: '불리한 조건이 있을 수 있어요.',
    why: '불리하게 작용할 수 있는 조건이 있는지 확인하세요.'
  },
  special: {
    emoji: '📌',
    title: '특약 사항을 확인하세요',
    desc: '특별한 약속이 있을 수 있어요.',
    why: '일반 조건과 다른 특별한 약속(특약)이 있는지 확인하세요.'
  },
  default: {
    emoji: '⭐',
    title: '문서에서 꼭 확인할 내용이에요',
    desc: '핵심 조건을 확인하세요.',
    why: '문서의 핵심 조건을 확인하세요.'
  }
};

// Contract documents get clearer, contract-specific copy per theme.
const CONTRACT_OVERRIDES = {
  money: {
    title: '금액 조건을 확인하세요',
    desc: '계약금·잔금·보증금 등 돈 조건이 있어요.',
    why: '계약금, 잔금, 보증금, 수수료처럼 돈과 관련된 조건이 있는지 확인하세요.'
  },
  date: {
    title: '계약 기간을 확인하세요',
    desc: '시작일·종료일·갱신 조건이 있어요.',
    why: '계약 시작일, 종료일, 갱신 조건을 확인하세요.'
  },
  cancel: {
    title: '해지/위약 조건을 확인하세요',
    desc: '해지 시 불이익이 있을 수 있어요.',
    why: '계약을 해지할 때 불이익이나 위약금이 있는지 확인하세요.'
  },
  refund: {
    title: '해지/위약 조건을 확인하세요',
    desc: '해지 시 불이익이 있을 수 있어요.',
    why: '계약을 해지할 때 불이익이나 위약금이 있는지 확인하세요.'
  },
  action: {
    title: '서명/날인이 필요해요',
    desc: '직접 처리해야 할 항목이 있어요.',
    why: '계약 효력을 위해 서명·날인처럼 직접 처리해야 할 항목이 있을 수 있어요.'
  }
};

const TYPE_HINTS = {
  terms: '결제·환불·개인정보·해지 조건을 먼저 확인해 보세요.',
  notice: '신청 방법·제출 기한·대상 조건을 먼저 확인해 보세요.',
  paper: '연구 목적·방법·결과·한계를 중심으로 확인해 보세요.',
  default: '문서에서 조건과 제한 사항을 먼저 확인해 보세요.'
};

const CONTRACTUAL_RE = /환불|자동결제|제3자|제 3자|책임|위약금|해지|이용 제한|개인정보/;
const NUMBERY_RE = /[0-9]/;

// Map a piece of evidence text to a friendly theme key.
function classifyTheme(text, tag) {
  const value = String(text || '');
  if (/특약|별도 약정/.test(value)) return 'special';
  if (/환불/.test(value)) return 'refund';
  if (/해지|탈회|탈퇴|취소|위약금|손해배상/.test(value)) return 'cancel';
  if (/개인정보|제3자|제 3자/.test(value)) return 'privacy';
  if (/위약금|수수료|결제|자동결제|비용|금액|요금|원|%/.test(value)) return 'money';
  if (/책임|면책|손해|배상/.test(value)) return 'liability';
  if (/별도 고지|사전 고지|고지 없이|안내 없이/.test(value)) return 'notice';
  if (/제한/.test(value)) return 'restriction';
  if (/서명|제출|신청|동의|변경|작성|확인해야/.test(value)) return 'action';
  if (/기한|마감|이내|까지|날짜|기간/.test(value)) return 'date';
  if (/불리|위험|주의/.test(value)) return 'unfair';

  // Fall back to the selection tag.
  if (tag === '해야 할 일') return 'action';
  if (tag === '비용') return 'money';
  if (tag === '기한') return 'date';
  if (tag === '개인정보') return 'privacy';
  if (tag === '주의') return 'unfair';
  return 'default';
}

// Gather ordered candidates (most important first) from the analysis result.
function gatherCandidates(result) {
  const kf = result?.key_facts || {};
  const highlights = Array.isArray(result?.highlights) ? result.highlights : [];
  const cards = Array.isArray(result?.cards) ? result.cards : [];
  const money = Array.isArray(kf.money) ? kf.money : [];
  const dates = Array.isArray(kf.dates) ? kf.dates : [];
  const actions = Array.isArray(kf.actions) ? kf.actions : [];
  const warnings = Array.isArray(kf.warnings) ? kf.warnings : [];

  const candidates = [];

  // 1) Most serious warning.
  const highHl = highlights.find((h) => String(h?.severity).toLowerCase() === 'high') || highlights[0];
  if (highHl) {
    candidates.push({ tag: '주의', text: `${highHl.label || ''} ${highHl.source_text || ''}`, value: highHl.label, source: highHl.source_text });
  } else if (warnings[0]) {
    candidates.push({ tag: '주의', text: `${warnings[0].value || ''} ${warnings[0].source_text || ''}`, value: warnings[0].value, source: warnings[0].source_text });
  }

  // 2) Something the user must do.
  if (actions[0]) {
    candidates.push({ tag: '해야 할 일', text: `${actions[0].value || ''} ${actions[0].source_text || ''}`, value: actions[0].value, source: actions[0].source_text });
  }

  // 3) Cost / deadline / privacy.
  if (money[0]) {
    candidates.push({ tag: '비용', text: `${money[0].label || ''} ${money[0].source_text || ''}`, value: money[0].value, source: money[0].source_text });
  } else if (dates[0]) {
    candidates.push({ tag: '기한', text: `${dates[0].label || ''} ${dates[0].source_text || ''}`, value: dates[0].value, source: dates[0].source_text });
  } else {
    const privacy = warnings.find((w) => /개인정보|제3자/.test(w.value || ''));
    if (privacy) candidates.push({ tag: '개인정보', text: `${privacy.value || ''} ${privacy.source_text || ''}`, value: privacy.value, source: privacy.source_text });
  }

  // Fill from cards (high importance first) if needed.
  const sortedCards = [...cards].sort((a, b) => {
    const ah = String(a?.level || '').includes('높') ? 1 : 0;
    const bh = String(b?.level || '').includes('높') ? 1 : 0;
    return bh - ah;
  });
  for (const card of sortedCards) {
    const tag = String(card?.level || '').includes('높') ? '주의' : '핵심';
    candidates.push({ tag, text: `${card?.title || card?.category || ''} ${card?.original_sentence || ''}`, value: card?.title, source: card?.original_sentence });
  }

  return candidates;
}

// Produce up to 3 friendly priority items, deduped by theme. Good-quality
// evidence is preferred; low-quality (broken PDF/OCR) evidence is softened.
function pickTop(result) {
  const candidates = gatherCandidates(result);
  const isContract = result?.document_type === 'contract';
  const items = [];
  const seenThemes = new Set();

  const consider = (preferGood) => {
    for (const candidate of candidates) {
      if (items.length >= 3) break;
      const themeKey = classifyTheme(candidate.text, candidate.tag);
      if (seenThemes.has(themeKey)) continue;

      const evidence = buildEvidence(candidate.source);
      const isGood = evidence.quality === 'good' && Boolean(evidence.cleaned);
      if (preferGood && !isGood) continue;

      seenThemes.add(themeKey);
      const base = THEMES[themeKey] || THEMES.default;
      const theme = isContract && CONTRACT_OVERRIDES[themeKey]
        ? { ...base, ...CONTRACT_OVERRIDES[themeKey] }
        : base;

      let why = theme.why;
      if (isGood && themeKey === 'money' && !isContract && NUMBERY_RE.test(String(candidate.value || ''))) {
        why = `${candidate.value}처럼 ${theme.why}`;
      }

      items.push({
        themeKey,
        emoji: base.emoji,
        title: theme.title,
        desc: isGood ? theme.desc : '근거 텍스트가 일부 깨져 있어 원문 확인이 필요해요.',
        why: isGood ? why : `${theme.why} 다만 근거 텍스트가 일부 깨져 있어 원문 확인이 필요해요.`,
        cleaned: evidence.cleaned,
        raw: evidence.raw,
        quality: isGood ? 'good' : 'low'
      });
    }
  };

  consider(true);
  if (items.length < 3) consider(false);

  return items;
}

function TopPriorities({ result, onShowInDocument }) {
  const [open, setOpen] = useState(null);
  const items = pickTop(result);
  if (items.length === 0) return null;

  const highlights = Array.isArray(result?.highlights) ? result.highlights : [];
  const warnings = Array.isArray(result?.key_facts?.warnings) ? result.key_facts.warnings : [];
  const contractualText = [...highlights, ...warnings]
    .map((entry) => `${entry?.label || ''} ${entry?.value || ''} ${entry?.source_text || ''}`)
    .join(' ');
  const hasContractual = CONTRACTUAL_RE.test(contractualText);

  const type = result?.document_type;
  let hint;
  if (type === 'terms') hint = TYPE_HINTS.terms;
  else if (type === 'paper') hint = TYPE_HINTS.paper;
  else if (type === 'notice' && !hasContractual) hint = TYPE_HINTS.notice;
  else hint = TYPE_HINTS.default;

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
            <li className="top-priority-item" key={`${item.themeKey}-${index}`}>
              <div className="top-priority-row">
                <span className="top-priority-rank">{index + 1}</span>
                <span className="top-priority-body">
                  <span className="top-priority-label">
                    <span className="top-priority-emoji" aria-hidden="true">{item.emoji}</span>
                    {item.title}
                  </span>
                  <span className="top-priority-desc">{item.desc}</span>
                </span>
              </div>

              <button
                type="button"
                className="top-priority-toggle"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : index)}
              >
                {isOpen ? '접기' : '근거 보기'}
              </button>

              {isOpen && (
                <div className="top-priority-detail">
                  <p className="top-priority-detail-label">왜 중요해요</p>
                  <p className="top-priority-why">{item.why}</p>
                  {item.quality === 'good' && item.cleaned ? (
                    <>
                      <p className="top-priority-detail-label">근거 문장</p>
                      <p className="top-priority-source">“{item.cleaned}”</p>
                      {onShowInDocument && (
                        <button
                          type="button"
                          className="evidence-link"
                          onClick={() => onShowInDocument({
                            title: item.title,
                            text: item.cleaned,
                            rawTextForMatch: item.raw,
                            source: item.cleaned,
                            quality: 'good'
                          })}
                        >
                          문서에서 보기
                        </button>
                      )}
                    </>
                  ) : item.raw ? (
                    <div className="evidence-lowq">
                      <p className="evidence-lowq-title">근거 문장을 정확히 찾기 어려워요</p>
                      <p className="evidence-lowq-desc">
                        PDF에서 추출된 텍스트가 일부 깨져 있어요. 원본 문서나 추출 텍스트를 확인해 주세요.
                      </p>
                      {onShowInDocument && (
                        <button
                          type="button"
                          className="evidence-link is-muted"
                          onClick={() => onShowInDocument({
                            title: item.title,
                            text: '',
                            rawTextForMatch: item.raw,
                            source: item.raw,
                            quality: 'low'
                          })}
                        >
                          원본 확인 필요
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="top-priority-source muted">관련 내용을 근거 탭에서 확인해 보세요.</p>
                  )}
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
