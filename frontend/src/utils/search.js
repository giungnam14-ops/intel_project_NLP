// Client-side search across the analysis result + extracted text. No backend.
import { buildEvidence } from './evidence';

function splitSentences(text) {
  const out = [];
  const lines = String(text || '').split(/\n+/);
  for (const line of lines) {
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
  }
  return out;
}

function makeSnippet(text, query, radius = 36) {
  const norm = String(text || '').replace(/\s+/g, ' ').trim();
  const idx = norm.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return norm.slice(0, 90);
  const start = Math.max(0, idx - radius);
  const end = Math.min(norm.length, idx + query.length + radius + 14);
  return `${start > 0 ? '…' : ''}${norm.slice(start, end)}${end < norm.length ? '…' : ''}`;
}

const norm = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();

// Returns matched items: { type, label, raw, cleaned, quality, snippet }.
// type is one of 문서 / 근거 / 요약 / 확인.
export function searchResult(result, extractedText, query) {
  const q = String(query || '').trim();
  if (!q) return [];
  const needle = q.toLowerCase();

  const items = [];
  const seen = new Set();

  const add = (type, label, text) => {
    const value = String(text || '');
    if (!value || !value.toLowerCase().includes(needle)) return;
    const key = norm(value);
    if (seen.has(key)) return; // dedupe same sentence across sources
    seen.add(key);
    const ev = buildEvidence(value);
    items.push({
      type,
      label: label || '',
      raw: value,
      cleaned: ev.cleaned || '',
      quality: ev.quality,
      snippet: makeSnippet(value, q)
    });
  };

  // Priority order: summary → 근거 → 확인 → 문서 (first wins on dedupe).
  add('요약', '한 줄 요약', result?.summary);

  (Array.isArray(result?.highlights) ? result.highlights : []).forEach((h) =>
    add('근거', h?.label || '주의 문장', h?.source_text));
  (Array.isArray(result?.cards) ? result.cards : []).forEach((c) =>
    add('근거', c?.category || c?.title, c?.original_sentence));

  const kf = result?.key_facts || {};
  ['money', 'dates', 'actions', 'warnings'].forEach((groupKey) =>
    (Array.isArray(kf[groupKey]) ? kf[groupKey] : []).forEach((fact) =>
      add('확인', fact?.label || fact?.value, fact?.source_text)));
  (Array.isArray(result?.checklist) ? result.checklist : []).forEach((text) =>
    add('확인', '체크 항목', text));

  splitSentences(extractedText).forEach((sentence) => add('문서', '문서 문장', sentence));

  return items;
}

// Suggested search terms by document type.
const TYPE_TERMS = {
  terms: ['환불', '자동결제', '개인정보', '해지'],
  contract: ['보증금', '계약기간', '위약금', '특약'],
  notice: ['신청', '제출', '장소', '준비물'],
  paper: ['목적', '결과', '한계', '방법']
};

export function suggestedTerms(documentType) {
  return TYPE_TERMS[documentType] || ['환불', '기한', '개인정보', '책임'];
}
