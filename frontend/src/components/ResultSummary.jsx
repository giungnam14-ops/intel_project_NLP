function ResultSummary({ result }) {
  if (!result) return null;

  return (
    <section className="summary-card">
      <div className="pill-row">
        <span className="pill pill-primary">{result.document_type_label || result.document_type}</span>
        <span className="pill pill-accent">중요도 {result.risk_level}</span>
      </div>
      <h3>한 줄 요약</h3>
      <p className="summary-text">{result.summary}</p>
    </section>
  );
}

export default ResultSummary;
