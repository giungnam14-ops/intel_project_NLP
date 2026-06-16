// Shared helpers to clean noisy PDF/OCR evidence text and judge its quality so
// the UI never shows broken, unreadable source blocks as "근거 문장".

const MAX_EVIDENCE_CHARS = 180;

export function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

// Split into sentence-like chunks without regex lookbehind (older Safari).
function splitSentences(text) {
  const out = [];
  let current = '';
  for (const ch of text) {
    current += ch;
    if ('.!?。'.includes(ch)) {
      const trimmed = current.trim();
      if (trimmed) out.push(trimmed);
      current = '';
    }
  }
  const tail = current.trim();
  if (tail) out.push(tail);
  return out;
}

// Trim to 1–2 readable sentences within MAX_EVIDENCE_CHARS, tidy quotes/spaces.
export function cleanEvidence(raw, maxChars = MAX_EVIDENCE_CHARS) {
  let text = normalizeWhitespace(raw);
  text = text.replace(/^[“”"'’\s]+/, '').replace(/[“”"'’\s]+$/, '');
  if (!text) return '';

  const sentences = splitSentences(text);
  let out = '';
  for (let i = 0; i < sentences.length && i < 2; i += 1) {
    const next = out ? `${out} ${sentences[i]}` : sentences[i];
    if (out && next.length > maxChars) break;
    out = next;
    if (out.length >= maxChars) break;
  }
  if (!out) out = text;

  if (out.length > maxChars) {
    out = `${out.slice(0, maxChars).trim()}…`;
  } else if (out.length < text.length) {
    // We trimmed extra sentences/content — signal that more exists.
    out = `${out}…`;
  }
  return out;
}

// Heuristic quality check: 'good' or 'low'. Tuned so normal Korean sentences
// pass while garbled PDF/OCR fragments ("RE FJ 2554 모 바일…") are flagged.
export function assessEvidenceQuality(raw) {
  const text = normalizeWhitespace(raw);
  if (!text) return 'low';

  const len = text.length;
  const korean = (text.match(/[가-힣]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  const digits = (text.match(/[0-9]/g) || []).length;
  const meaningful = korean + latin + digits;
  const koreanRatio = meaningful ? korean / meaningful : 0;

  const tokens = text.split(/\s+/).filter(Boolean);
  const upperTokens = tokens.filter((token) => /^[A-Z]{2,}$/.test(token)).length;
  const longGlued = tokens.some((token) => token.length >= 25);
  const symbols = (text.match(/[^가-힣A-Za-z0-9\s.,%·\-:()/“”"'’]/g) || []).length;
  const symbolRatio = len ? symbols / len : 0;
  const repeated = /(.)\1{4,}/.test(text) || /([가-힣A-Za-z]{2,})\1{2,}/.test(text);
  const sentenceBreaks = (text.match(/[.!?。]/g) || []).length;

  let score = 0;
  if (korean > 0 && meaningful >= 12 && koreanRatio < 0.45) score += 2; // Korean doc, too much latin/digits
  if (korean === 0 && latin > 15) score += 1; // no Korean at all
  if (upperTokens >= 2) score += 1;
  if (symbolRatio > 0.18) score += 1;
  if (longGlued) score += 2;
  if (repeated) score += 1;
  if (len > 400 && sentenceBreaks < 2) score += 1;

  return score >= 2 ? 'low' : 'good';
}

// Convenience: returns the cleaned display text, the raw (for doc matching),
// and the quality flag.
export function buildEvidence(raw) {
  const quality = assessEvidenceQuality(raw);
  return {
    raw: String(raw || ''),
    cleaned: quality === 'low' ? '' : cleanEvidence(raw),
    quality
  };
}

// Whole-document noise check, for the "PDF 텍스트가 깨졌어요" warning.
export function isDocumentNoisy(text) {
  const value = normalizeWhitespace(text);
  if (value.length < 80) return false; // too short to judge

  const korean = (value.match(/[가-힣]/g) || []).length;
  const latin = (value.match(/[A-Za-z]/g) || []).length;
  const digits = (value.match(/[0-9]/g) || []).length;
  const meaningful = korean + latin + digits;
  const koreanRatio = meaningful ? korean / meaningful : 0;

  const tokens = value.split(/\s+/).filter(Boolean);
  const upperTokens = tokens.filter((token) => /^[A-Z]{2,}$/.test(token)).length;
  const longGlued = tokens.filter((token) => token.length >= 25).length;
  const sentenceBreaks = (value.match(/[.!?。\n]/g) || []).length;

  let score = 0;
  if (korean > 0 && koreanRatio < 0.4) score += 2;
  if (korean === 0 && latin > 40) score += 2;
  if (upperTokens >= 6) score += 1;
  if (longGlued >= 3) score += 1;
  if (value.length > 600 && sentenceBreaks < 3) score += 1;

  return score >= 2;
}
