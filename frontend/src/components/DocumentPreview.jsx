const PREVIEW_THRESHOLD = 180;

function DocumentPreview({ text, onViewFull }) {
  const value = (text || '').trim();
  if (!value) return null;

  const isLong = value.length > PREVIEW_THRESHOLD;

  return (
    <section className="doc-preview">
      <p className="doc-preview-title">문서 미리보기</p>
      <div className={`doc-preview-paper${isLong ? ' is-clamped' : ''}`}>
        <p className="doc-preview-text">{value}</p>
      </div>
      {isLong && onViewFull && (
        <button type="button" className="text-link-button" onClick={onViewFull}>
          전체 텍스트 보기
        </button>
      )}
    </section>
  );
}

export default DocumentPreview;
