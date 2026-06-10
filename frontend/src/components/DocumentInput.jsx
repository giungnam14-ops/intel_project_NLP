function DocumentInput({ text, setText, loading, onAnalyze, onReset, onExample }) {
  return (
    <section className="panel input-panel">
      <div className="section-header">
        <div>
          <p className="eyebrow">문서 입력</p>
          <h2>분석할 문서를 붙여넣으세요</h2>
        </div>
        <span className="sub-badge">FastAPI 연결</span>
      </div>

      <div className="example-row">
        <button type="button" className="ghost-button" onClick={() => onExample('terms')}>약관 예시</button>
        <button type="button" className="ghost-button" onClick={() => onExample('notice')}>공지문 예시</button>
        <button type="button" className="ghost-button" onClick={() => onExample('paper')}>논문 예시</button>
      </div>

      <label className="sr-only" htmlFor="document-input">문서 입력</label>
      <textarea
        id="document-input"
        className="input-box"
        placeholder="분석할 문서를 붙여넣어 주세요."
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={12}
        disabled={loading}
      />

      <div className="button-row">
        <button type="button" className="primary-button" onClick={onAnalyze} disabled={loading}>
          {loading ? '분석 중입니다...' : '분석하기'}
        </button>
        <button type="button" className="secondary-button" onClick={onReset} disabled={loading}>
          초기화
        </button>
      </div>

      <p className="helper-text">입력값은 FastAPI의 /analyze로 전송됩니다.</p>
    </section>
  );
}

export default DocumentInput;
