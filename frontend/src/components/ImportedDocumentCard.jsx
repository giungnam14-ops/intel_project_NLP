const KIND_ICONS = {
  PDF: '📕',
  DOCX: '📘',
  이미지: '🖼️',
  텍스트: '📄'
};

const STATUS_META = {
  extracted: { label: '텍스트 추출 완료', cls: 'ok' },
  ocr: { label: 'OCR 완료', cls: 'ok' },
  review: { label: '확인 필요', cls: 'warn' }
};

// Matches the backend LONG_DOCUMENT_THRESHOLD (characters).
const LONG_DOCUMENT_CHARS = 12000;

function ImportedDocumentCard({ meta, editorOpen, onToggleEditor, onReimport }) {
  if (!meta) return null;

  const status = STATUS_META[meta.status] || STATUS_META.extracted;
  const icon = KIND_ICONS[meta.kind] || '📄';
  const charCount = Number(meta.charCount || 0);
  const isLong = charCount >= LONG_DOCUMENT_CHARS;

  return (
    <section className={`imported-card${status.cls === 'warn' ? ' imported-card--review' : ''}`}>
      <div className="imported-card-head">
        <span className="imported-icon" aria-hidden="true">{icon}</span>
        <div className="imported-meta">
          <p className="imported-eyebrow">가져온 문서</p>
          <p className="imported-name" title={meta.name}>{meta.name || '문서'}</p>
          <div className="imported-tags">
            <span className="imported-tag">{meta.kind}</span>
            <span className={`imported-status imported-status-${status.cls}`}>{status.label}</span>
            <span className="imported-tag">{charCount.toLocaleString()}자</span>
            {isLong && <span className="imported-tag imported-tag-long">긴 문서 · 핵심 위주 분석</span>}
          </div>
        </div>
      </div>

      <p className="imported-desc">
        {status.cls === 'warn'
          ? '인식 품질이 낮을 수 있어요. 추출 텍스트를 확인하고 수정해 주세요.'
          : '이 문서에서 분석할 내용을 준비했습니다.'}
      </p>

      <div className="imported-actions">
        <button
          type="button"
          className={status.cls === 'warn' && !editorOpen ? 'primary-button' : 'secondary-button'}
          onClick={onToggleEditor}
        >
          {editorOpen ? '추출 텍스트 접기' : '추출 텍스트 보기/수정'}
        </button>
        <button type="button" className="secondary-button" onClick={onReimport}>
          문서 다시 가져오기
        </button>
      </div>
    </section>
  );
}

export default ImportedDocumentCard;
