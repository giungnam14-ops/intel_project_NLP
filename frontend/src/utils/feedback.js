// Result feedback stored in localStorage only (no server). One feedback per
// result id (re-submitting replaces the previous one).

const KEY = 'munyo-feedback';

export function loadFeedback() {
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
    console.warn('[문요] 피드백을 저장하지 못했어요.', err);
    return false;
  }
}

export function getFeedbackFor(resultId) {
  if (!resultId) return null;
  return loadFeedback().find((item) => item.resultId === resultId) || null;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveFeedback({ resultId, documentType, analysisMode, helpful, reason, note }) {
  const record = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    resultId: resultId || '',
    documentType: documentType || '',
    analysisMode: analysisMode || 'quick',
    helpful: Boolean(helpful),
    reason: reason || '',
    note: note || ''
  };

  // Replace any existing feedback for the same result.
  const others = record.resultId
    ? loadFeedback().filter((item) => item.resultId !== record.resultId)
    : loadFeedback();
  const next = [record, ...others];
  persist(next);
  return next;
}

export function clearFeedback() {
  persist([]);
  return [];
}

export function countFeedback() {
  return loadFeedback().length;
}
