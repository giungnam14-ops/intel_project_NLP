import { useEffect, useMemo, useRef } from 'react';

// Normalize for fuzzy matching: drop all whitespace + lowercase so spacing
// differences (PDF/OCR joins) don't break the match.
function normalize(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

// Split text into sentence-like chunks without relying on regex lookbehind
// (older Safari support). Keeps newlines as boundaries too.
function splitChunks(text) {
  const chunks = [];
  const lines = String(text || '').split(/\n+/);
  for (const line of lines) {
    let current = '';
    for (const ch of line) {
      current += ch;
      if ('.!?。'.includes(ch)) {
        const trimmed = current.trim();
        if (trimmed) chunks.push(trimmed);
        current = '';
      }
    }
    const tail = current.trim();
    if (tail) chunks.push(tail);
  }
  return chunks;
}

function EvidenceDocumentViewer({ text, activeEvidence }) {
  const activeRef = useRef(null);
  const body = (text || '').trim();

  const chunks = useMemo(() => splitChunks(body), [body]);

  const needle = normalize(
    activeEvidence?.rawTextForMatch || activeEvidence?.text || activeEvidence?.source || ''
  );

  // Decide which chunk(s) match the active evidence; the first match is active.
  const { marks, activeIndex } = useMemo(() => {
    const result = { marks: chunks.map(() => false), activeIndex: -1 };
    if (!needle || needle.length < 4) return result;
    chunks.forEach((chunk, index) => {
      const normChunk = normalize(chunk);
      if (!normChunk) return;
      const matched =
        normChunk.includes(needle) ||
        (needle.length >= 6 && normChunk.length >= 6 && needle.includes(normChunk));
      if (matched) {
        result.marks[index] = true;
        if (result.activeIndex === -1) result.activeIndex = index;
      }
    });
    return result;
  }, [chunks, needle]);

  // Scroll to the active sentence whenever the active evidence changes.
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeEvidence, activeIndex]);

  const notFound = Boolean(activeEvidence) && needle.length >= 4 && activeIndex === -1;

  return (
    <div className="evidence-viewer">
      <p className="evidence-viewer-title">분석에 사용된 문서</p>

      {!activeEvidence && (
        <p className="evidence-viewer-hint">
          분석 결과에서 궁금한 항목을 누르면 관련 문장이 여기에서 표시돼요.
        </p>
      )}
      {notFound && (
        <p className="evidence-viewer-miss">
          정확히 같은 문장을 찾지 못했어요. 근거 탭의 원문을 함께 확인해 주세요.
        </p>
      )}

      {body ? (
        <div className="evidence-viewer-body">
          {chunks.map((chunk, index) => {
            const isActive = index === activeIndex;
            const className = `evidence-line${marks[index] ? (isActive ? ' is-active' : ' is-mark') : ''}`;
            return (
              <p key={index} ref={isActive ? activeRef : null} className={className}>
                {chunk}
              </p>
            );
          })}
        </div>
      ) : (
        <p className="evidence-viewer-hint">표시할 추출 텍스트가 없어요.</p>
      )}
    </div>
  );
}

export default EvidenceDocumentViewer;
