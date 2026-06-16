// Recent-analysis history stored in localStorage only. Never stores the original
// file, object URLs, or anything server-side — just the analysis result, the
// extracted text, and lightweight document metadata.

const KEY = 'munyo-history';
const MAX_RECORDS = 10;

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persist(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch (err) {
    // Quota exceeded / private mode — keep the app working, just skip saving.
    console.warn('[문요] 분석 기록을 저장하지 못했어요.', err);
    return false;
  }
}

export function addHistoryRecord({ id, createdAt, title, result, extractedText, documentMeta, analysisMode }) {
  const record = {
    id,
    createdAt,
    title: title || '직접 입력한 문서',
    documentType: result?.document_type || 'other',
    documentTypeLabel: result?.document_type_label || '',
    riskLevel: result?.risk_level || '',
    summary: result?.summary || '',
    analysisMode: analysisMode || 'quick',
    extractedText: extractedText || '',
    result: result || null,
    // Strip previewUrl / file object — keep only safe, serializable fields.
    documentMeta: documentMeta
      ? {
          name: documentMeta.name || '',
          kind: documentMeta.kind || '',
          charCount: documentMeta.charCount || 0,
          previewKind: documentMeta.previewKind || 'text'
        }
      : null
  };

  // Reduce duplicates: drop a previous record with the same title + summary.
  const existing = loadHistory().filter(
    (item) => !(item.title === record.title && item.summary === record.summary)
  );
  const next = [record, ...existing].slice(0, MAX_RECORDS);
  persist(next);
  return next;
}

export function deleteHistoryRecord(id) {
  const next = loadHistory().filter((item) => item.id !== id);
  persist(next);
  return next;
}

export function clearHistory() {
  persist([]);
  return [];
}
