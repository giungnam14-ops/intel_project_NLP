import { useEffect, useMemo, useRef } from 'react';

// ---- text helpers ---------------------------------------------------------

function stripNeedle(value) {
  return String(value || '')
    .replace(/[“”"'’]/g, '')
    .replace(/[…\s]+$/g, '')
    .trim();
}

function normalizeAll(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

// Whitespace-insensitive normalized form of a chunk + a map back to the original
// character index, so a match found in normalized space can be highlighted in
// the original text precisely.
function normalizeWithMap(chunk) {
  let norm = '';
  const map = [];
  for (let i = 0; i < chunk.length; i += 1) {
    const ch = chunk[i];
    if (/\s/.test(ch)) continue;
    norm += ch.toLowerCase();
    map.push(i);
  }
  return { norm, map };
}

// Sørensen–Dice similarity on character bigrams (0–1).
function diceSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const grams = new Map();
  for (let i = 0; i < a.length - 1; i += 1) {
    const g = a.slice(i, i + 2);
    grams.set(g, (grams.get(g) || 0) + 1);
  }
  let inter = 0;
  for (let i = 0; i < b.length - 1; i += 1) {
    const g = b.slice(i, i + 2);
    const c = grams.get(g) || 0;
    if (c > 0) {
      inter += 1;
      grams.set(g, c - 1);
    }
  }
  return (2 * inter) / (a.length - 1 + (b.length - 1));
}

// Split text into sentence-like chunks (no regex lookbehind for old Safari).
function splitChunks(text) {
  const chunks = [];
  String(text || '').split(/\n+/).forEach((line) => {
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
  });
  return chunks;
}

const FUZZY_THRESHOLD = 0.45;

// Decide which chunk to highlight and (when possible) the exact phrase range.
function matchChunk(chunks, needle) {
  if (!needle || needle.length < 4) return { index: -1, phrase: null };

  // Pass 1 — exact substring → precise phrase highlight (shortest chunk wins).
  let index = -1;
  let phrase = null;
  let bestLen = Infinity;
  chunks.forEach((chunk, i) => {
    const { norm, map } = normalizeWithMap(chunk);
    const at = norm.indexOf(needle);
    if (at >= 0 && norm.length < bestLen) {
      bestLen = norm.length;
      index = i;
      phrase = { start: map[at], end: map[at + needle.length - 1] + 1 };
    }
  });
  if (index !== -1) return { index, phrase };

  // Pass 2 — chunk is a subset of the needle → highlight whole chunk.
  let bestSub = 0;
  chunks.forEach((chunk, i) => {
    const { norm } = normalizeWithMap(chunk);
    if (norm.length >= 8 && needle.includes(norm) && norm.length > bestSub) {
      bestSub = norm.length;
      index = i;
    }
  });
  if (index !== -1) return { index, phrase: null };

  // Pass 3 — fuzzy similarity → best chunk above threshold.
  let best = 0;
  chunks.forEach((chunk, i) => {
    const { norm } = normalizeWithMap(chunk);
    const score = diceSimilarity(needle, norm);
    if (score > best) {
      best = score;
      if (score >= FUZZY_THRESHOLD) index = i;
    }
  });
  return { index, phrase: null };
}

// ---- component ------------------------------------------------------------

function EvidenceDocumentViewer({ text, activeEvidence, documentMeta }) {
  const activeRef = useRef(null);
  const body = (text || '').trim();
  const chunks = useMemo(() => splitChunks(body), [body]);

  const isLowQuality = activeEvidence?.quality === 'low';
  const needle = isLowQuality
    ? ''
    : normalizeAll(stripNeedle(activeEvidence?.rawTextForMatch || activeEvidence?.text || activeEvidence?.source || ''));

  const { index: activeIndex, phrase } = useMemo(
    () => matchChunk(chunks, needle),
    [chunks, needle]
  );

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeEvidence, activeIndex]);

  const pdfUrl = documentMeta?.previewKind === 'pdf' ? documentMeta?.previewUrl : '';

  // Low-quality evidence → guidance only (no highlight, no broken block).
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
            <a className="text-link-button" href={pdfUrl} target="_blank" rel="noreferrer">새 탭에서 원본 열기</a>
          )}
        </div>
      </div>
    );
  }

  const notFound = Boolean(activeEvidence) && needle.length >= 4 && activeIndex === -1;

  const renderChunk = (chunk, isActive) => {
    if (!isActive || !phrase) return chunk;
    const start = Math.max(0, phrase.start);
    const end = Math.min(chunk.length, phrase.end);
    if (end <= start) return chunk;
    return (
      <>
        {chunk.slice(0, start)}
        <mark className="evidence-mark">{chunk.slice(start, end)}</mark>
        {chunk.slice(end)}
      </>
    );
  };

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
                {renderChunk(chunk, isActive)}
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
