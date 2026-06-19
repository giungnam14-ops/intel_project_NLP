import { buildEvidence } from '../utils/evidence';
import { MODE_THEME_PRIORITY } from '../utils/modes';

// Per-theme copy. Each item explains WHY it matters (자주 놓치지만 중요한 이유)
// and WHAT to do (이렇게 하세요) — not just "이런 조항이 있어요".
const THEMES = {
  refund: {
    emoji: '💳',
    title: '환불·해지 조건을 꼭 확인하세요',
    point: '환불이 아예 안 되거나, 정해진 기간(예: 7일) 안에서만 가능한 경우가 많아요.',
    action: '환불 가능 기간·조건을 메모해 두고, 기간이 지나기 전에 신청하세요.'
  },
  cancel: {
    emoji: '🚪',
    title: '해지가 까다로울 수 있어요',
    point: '자동으로 연장되거나, 해지할 때 위약금·별도 절차가 붙는 경우가 흔해요.',
    action: '해지 방법과 위약금 여부를 미리 확인하고, 자동연장이면 갱신일 전에 해지하세요.'
  },
  privacy: {
    emoji: '🔒',
    title: '개인정보가 제3자에게 갈 수 있어요',
    point: '내 정보가 누구에게·어디까지·왜 제공되는지 모르고 동의하기 쉬워요.',
    action: '제공 대상과 범위를 확인하고, 꼭 필요하지 않은 항목은 동의를 다시 생각하세요.'
  },
  money: {
    emoji: '💰',
    title: '예상 못 한 비용이 나갈 수 있어요',
    point: '자동결제·수수료·위약금처럼 미리 인지하지 못한 돈이 빠져나갈 수 있어요.',
    action: '총 얼마를, 언제, 어떤 조건에서 내야 하는지 숫자로 확인하세요.'
  },
  liability: {
    emoji: '⚠️',
    title: '문제가 생겨도 책임을 안 질 수 있어요',
    point: '사고·손해가 나도 사업자 책임이 면제·제한되는 조항이 자주 들어가요.',
    action: '어떤 경우에 책임을 안 지는지 확인하고, 중요하면 보장 범위를 따로 물어보세요.'
  },
  restriction: {
    emoji: '🚫',
    title: '내 권리가 제한될 수 있어요',
    point: '기간·자격·만기 같은 특정 조건에 걸리면 서비스나 대출 같은 권리를 못 쓸 수 있어요.',
    action: '내가 그 제한 조건에 해당하는지 먼저 확인하고, 해당되면 가입·계약 전에 문의하세요.'
  },
  notice: {
    emoji: '📣',
    title: '예고 없이 조건이 바뀔 수 있어요',
    point: '사전 안내 없이 요금이나 조건이 변경·적용될 수 있어요.',
    action: '변경을 어떻게 통지받는지 확인하고, 알림을 켜두거나 주기적으로 점검하세요.'
  },
  action: {
    emoji: '✅',
    title: '직접 해야 할 일이 있어요',
    point: '서명·제출·신청·동의처럼 내가 직접 안 하면 불이익이 생길 수 있어요.',
    action: '해야 할 일과 기한을 메모하고, 늦지 않게 처리하세요.'
  },
  date: {
    emoji: '📅',
    title: '기한을 놓치면 안 돼요',
    point: '신청·제출·환불 기한을 넘기면 권리를 잃을 수 있어요.',
    action: '기한을 캘린더에 등록하고 미리 알림을 설정하세요.'
  },
  unfair: {
    emoji: '❗',
    title: '나에게 불리한 조건일 수 있어요',
    point: '한쪽(주로 소비자)에게 일방적으로 불리하게 작용할 수 있는 조항이에요.',
    action: '이 조건이 실제로 나에게 어떻게 적용되는지 확인하고, 애매하면 문의하세요.'
  },
  special: {
    emoji: '📌',
    title: '특약을 꼭 확인하세요',
    point: '특약은 일반 조건보다 우선 적용돼, 바로 여기서 손해가 나기 쉬워요.',
    action: '특약을 한 줄씩 확인하고, 불리하면 수정·삭제를 요청하세요.'
  },
  default: {
    emoji: '⭐',
    title: '꼭 확인할 핵심이에요',
    point: '사람들이 자주 지나치지만 실제로는 중요한 조건이에요.',
    action: '내용을 한 번 더 읽어보고, 모르면 담당자에게 물어보세요.'
  }
};

// Contract documents get clearer, contract-specific copy per theme.
const CONTRACT_OVERRIDES = {
  money: {
    title: '금액 조건을 확인하세요',
    point: '계약금·잔금·보증금·위약금 등 큰돈이 걸린 조건이에요.',
    action: '각 금액과 납부 시점·조건을 정확히 확인하세요.'
  },
  date: {
    title: '계약 기간을 확인하세요',
    point: '시작·종료·갱신 시점에 따라 권리와 의무가 달라져요.',
    action: '시작일·종료일·자동갱신 여부를 확인하세요.'
  },
  cancel: {
    title: '해지·위약 조건을 확인하세요',
    point: '중도 해지하면 위약금이나 불이익이 클 수 있어요.',
    action: '해지 절차와 위약금 계산 방식을 미리 확인하세요.'
  },
  refund: {
    title: '해지·위약 조건을 확인하세요',
    point: '중도 해지하면 위약금이나 불이익이 클 수 있어요.',
    action: '해지 절차와 위약금 계산 방식을 미리 확인하세요.'
  },
  restriction: {
    title: '권리가 제한될 수 있어요',
    point: '특정 조건에서 대출·이용 등 권리가 제한될 수 있어요.',
    action: '제한 조건에 해당하는지 확인하고, 필요하면 계약 전에 문의하세요.'
  },
  action: {
    title: '서명·날인 전 확인하세요',
    point: '서명하면 모든 조항에 동의한 것으로 효력이 생겨요.',
    action: '서명 전에 특약·금액·기간을 한 번 더 확인하세요.'
  }
};

const TYPE_HINTS = {
  terms: '결제·환불·개인정보·해지 조건을 먼저 확인해 보세요.',
  notice: '신청 방법·제출 기한·대상 조건을 먼저 확인해 보세요.',
  paper: '연구 목적·방법·결과·한계를 중심으로 확인해 보세요.',
  default: '문서에서 조건과 제한 사항을 먼저 확인해 보세요.'
};

const CONTRACTUAL_RE = /환불|자동결제|제3자|제 3자|책임|위약금|해지|이용 제한|개인정보/;

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

// Gather a broad candidate pool (default importance order) from the result.
function gatherCandidates(result) {
  const kf = result?.key_facts || {};
  const highlights = Array.isArray(result?.highlights) ? result.highlights : [];
  const cards = Array.isArray(result?.cards) ? result.cards : [];
  const money = Array.isArray(kf.money) ? kf.money : [];
  const dates = Array.isArray(kf.dates) ? kf.dates : [];
  const actions = Array.isArray(kf.actions) ? kf.actions : [];
  const warnings = Array.isArray(kf.warnings) ? kf.warnings : [];

  const candidates = [];

  // Warnings / highlights (high severity first).
  [...highlights]
    .sort((a, b) => (String(b?.severity).toLowerCase() === 'high' ? 1 : 0) - (String(a?.severity).toLowerCase() === 'high' ? 1 : 0))
    .forEach((h) => candidates.push({ tag: '주의', text: `${h.label || ''} ${h.source_text || ''}`, value: h.label, source: h.source_text }));

  actions.forEach((a) => candidates.push({ tag: '해야 할 일', text: `${a.value || ''} ${a.source_text || ''}`, value: a.value, source: a.source_text }));
  money.forEach((m) => candidates.push({ tag: '비용', text: `${m.label || ''} ${m.source_text || ''}`, value: m.value, source: m.source_text }));
  dates.forEach((d) => candidates.push({ tag: '기한', text: `${d.label || ''} ${d.source_text || ''}`, value: d.value, source: d.source_text }));
  warnings.forEach((w) => candidates.push({ tag: '주의', text: `${w.value || ''} ${w.source_text || ''}`, value: w.value, source: w.source_text }));

  // Fill from cards (high importance first).
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

// Reorder candidates so the selected mode's preferred themes come first.
function orderByMode(candidates, mode) {
  const priority = MODE_THEME_PRIORITY[mode] || [];
  if (!priority.length) return candidates; // quick: natural order
  const rank = (key) => {
    const index = priority.indexOf(key);
    return index === -1 ? 999 : index;
  };
  // Array.sort is stable in modern engines → preserves original order on ties.
  return [...candidates].sort((a, b) => rank(a.themeKey) - rank(b.themeKey));
}

// Keywords used to pull a real sentence out of the extracted document text for
// each theme — so we can show an actual sentence even when the backend's
// structured extraction came back sparse (e.g. a noisy PDF contract).
const THEME_SCAN = {
  money: ['보증금', '월세', '금액', '대금', '계약금', '중도금', '잔금', '요금', '수수료', '결제', '자동결제'],
  refund: ['환불'],
  cancel: ['해지', '해제', '위약금', '손해배상', '중도'],
  privacy: ['개인정보', '제3자', '제 3자', '제공'],
  date: ['계약기간', '계약 기간', '임대차', '기간', '기한', '까지', '이내', '개시', '만료'],
  special: ['특약', '별도 약정', '단서'],
  action: ['서명', '날인', '제출', '신청', '동의', '확인', '변경'],
  liability: ['책임', '면책', '배상'],
  restriction: ['제한', '금지', '정지'],
  unfair: ['불리', '위험', '주의'],
  default: []
};

function splitDocSentences(text) {
  const out = [];
  String(text || '').split(/\n+/).forEach((line) => {
    let current = '';
    for (const ch of line) {
      current += ch;
      if ('.!?。'.includes(ch)) {
        const trimmed = current.trim();
        if (trimmed) out.push(trimmed);
        current = '';
      }
    }
    const tail = current.trim();
    if (tail) out.push(tail);
  });
  return out;
}

// Return a readable (good-quality) document sentence for a theme, or '' if none.
function findSentenceForTheme(documentText, themeKey) {
  const keywords = THEME_SCAN[themeKey] || [];
  if (!keywords.length) return '';
  for (const sentence of splitDocSentences(documentText)) {
    if (sentence.length < 8 || sentence.length > 220) continue;
    if (!keywords.some((kw) => sentence.includes(kw))) continue;
    const ev = buildEvidence(sentence);
    if (ev.quality === 'good' && ev.cleaned) return ev.cleaned;
  }
  return '';
}

// Produce up to 3 friendly priority items, deduped by theme. Good-quality
// evidence is preferred; the selected mode reorders which themes lead.
function pickTop(result, mode, documentText) {
  const classified = gatherCandidates(result).map((c) => ({ ...c, themeKey: classifyTheme(c.text, c.tag) }));
  const candidates = orderByMode(classified, mode);
  const isContract = result?.document_type === 'contract';
  const items = [];
  const seenThemes = new Set();

  const consider = (preferGood) => {
    for (const candidate of candidates) {
      if (items.length >= 3) break;
      const themeKey = candidate.themeKey;
      if (seenThemes.has(themeKey)) continue;

      const evidence = buildEvidence(candidate.source);
      const isGood = evidence.quality === 'good' && Boolean(evidence.cleaned);
      if (preferGood && !isGood) continue;

      seenThemes.add(themeKey);
      const base = THEMES[themeKey] || THEMES.default;
      const theme = isContract && CONTRACT_OVERRIDES[themeKey]
        ? { ...base, ...CONTRACT_OVERRIDES[themeKey] }
        : base;

      items.push({
        themeKey,
        emoji: base.emoji,
        title: theme.title,
        point: theme.point,
        action: theme.action,
        cleaned: evidence.cleaned,
        raw: evidence.raw,
        quality: isGood ? 'good' : 'low'
      });
    }
  };

  consider(true);
  if (items.length < 3) consider(false);

  // Supplement with a real document sentence when the structured evidence was
  // missing or low-quality, so each item points to an actual sentence.
  if (documentText) {
    for (const item of items) {
      if (item.quality !== 'good' || !item.cleaned) {
        const found = findSentenceForTheme(documentText, item.themeKey);
        if (found) {
          item.cleaned = found;
          item.raw = found;
          item.quality = 'good';
        }
      }
    }
  }

  return items;
}

function TopPriorities({ result, analysisMode = 'quick', documentText = '', onShowInDocument }) {
  const items = pickTop(result, analysisMode, documentText);
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
    <section className="top-priorities is-main">
      <div className="top-priorities-head">
        <span className="top-priorities-eyebrow">가장 먼저 볼 것</span>
        <h3 className="top-priorities-title">이 문서에서는 아래 {items.length}가지를 먼저 확인하세요</h3>
        <p className="top-priorities-hint">{hint}</p>
      </div>

      <ol className="top-priorities-list">
        {items.map((item, index) => {
          const hasSentence = item.quality === 'good' && Boolean(item.cleaned);
          return (
            <li className="top-priority-item" key={`${item.themeKey}-${index}`}>
              <div className="top-priority-row">
                <span className="top-priority-rank">{index + 1}</span>
                <span className="top-priority-body">
                  <span className="top-priority-label">
                    <span className="top-priority-emoji" aria-hidden="true">{item.emoji}</span>
                    {item.title}
                  </span>
                  {hasSentence ? (
                    <span className="top-priority-quote">“{item.cleaned}”</span>
                  ) : item.raw ? (
                    <span className="top-priority-quote is-muted">추출 텍스트가 일부 깨져 있어요. 원본에서 확인해 주세요.</span>
                  ) : (
                    <span className="top-priority-quote is-muted">관련 문장을 찾지 못했어요. 근거 탭에서 확인해 주세요.</span>
                  )}

                  <span className="top-priority-why">
                    <strong>왜 중요?</strong> {item.point}
                  </span>
                  <span className="top-priority-tip">
                    <strong>이렇게 하세요</strong> {item.action}
                  </span>
                </span>
              </div>

              {onShowInDocument && (item.raw || item.cleaned) && (
                <button
                  type="button"
                  className={`evidence-link${hasSentence ? '' : ' is-muted'}`}
                  onClick={() => onShowInDocument({
                    title: item.title,
                    text: hasSentence ? item.cleaned : '',
                    rawTextForMatch: item.raw,
                    source: hasSentence ? item.cleaned : item.raw,
                    quality: hasSentence ? 'good' : 'low'
                  })}
                >
                  {hasSentence ? '문서에서 보기' : '원본 확인 필요'}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default TopPriorities;
