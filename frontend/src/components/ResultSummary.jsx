function ResultSummary({ result }) {
  if (!result) return null;

  return (
    <section className="summary-card">
      <div className="summary-pills">
        <span className="summary-pill">{result.document_type_label || result.document_type}</span>
        <span className="summary-pill summary-pill-risk">중요도 {result.risk_level}</span>
      </div>
      <span className="summary-label">한 줄 요약</span>
      <p className="summary-text">{result.summary}</p>
    </section>
  );
}

export default ResultSummary;
