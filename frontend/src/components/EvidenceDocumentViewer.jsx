import { useEffect, useMemo, useRef } from 'react';

// Normalize for fuzzy matching: drop all whitespace + lowercase so spacing
// differences (PDF/OCR joins) don't break the match.
function normalize(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

// Split text into sentence-like chunks without regex lookbehind (older Safari).
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

function EvidenceDocumentViewer({ text, activeEvidence, documentMeta }) {
  const activeRef = useRef(null);
  const body = (text || '').trim();
  const chunks = useMemo(() => splitChunks(body), [body]);

  const isLowQuality = activeEvidence?.quality === 'low';
  const needle = isLowQuality
    ? ''
    : normalize(activeEvidence?.rawTextForMatch || activeEvidence?.text || activeEvidence?.source || '');

  // Match exactly ONE sentence (the shortest containing chunk) — never paint the
  // whole document with multiple yellow boxes.
  const activeIndex = useMemo(() => {
    if (!needle || needle.length < 6) return -1;
    let best = -1;
    let bestLen = Infinity;
    chunks.forEach((chunk, index) => {
      const normChunk = normalize(chunk);
      if (!normChunk) return;
      const matched =
        normChunk.includes(needle) ||
        (needle.length >= 8 && normChunk.length >= 8
          && needle.includes(normChunk) && normChunk.length >= needle.length * 0.6);
      if (matched && normChunk.length < bestLen) {
        bestLen = normChunk.length;
        best = index;
      }
    });
    return best;
  }, [chunks, needle]);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeEvidence, activeIndex]);

  const pdfUrl = documentMeta?.previewKind === 'pdf' ? documentMeta?.previewUrl : '';

  // Low-quality evidence → guidance card only, no highlight, no broken block.
  if (activeEvidence && isLowQuality) {
    return (
      <div className="evidence-viewer">
        <div className="evidence-guard">
          <p className="evidence-guard-title">정확한 위치를 표시하기 어려워요</p>
          <p className="evidence-guard-desc">
            PDF에서 추출된 텍스트가 일부 깨져 이 근거의 위치를 정확히 찾기 어렵습니다.
            원본 문서와 함께 확인해 주세요.
          </p>
          {pdfUrl && (
            <a className="text-link-button" href={pdfUrl} target="_blank" rel="noreferrer">
              새 탭에서 원본 열기
            </a>
          )}
        </div>
      </div>
    );
  }

  const notFound = Boolean(activeEvidence) && needle.length >= 6 && activeIndex === -1;

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
            return (
              <p
                key={index}
                ref={isActive ? activeRef : null}
                className={`evidence-line${isActive ? ' is-active' : ''}`}
              >
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
