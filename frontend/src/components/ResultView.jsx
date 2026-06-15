import Checklist from './Checklist';
import DocumentQA from './DocumentQA';
import KeyFacts from './KeyFacts';
import ResultCard from './ResultCard';
import ResultSummary from './ResultSummary';
import SourceHighlights from './SourceHighlights';

function ResultView({ result, shortSource, documentText, onNew }) {
  if (!result) return null;

  return (
    <div className="result-view">
      <div className="result-view-actions">
        <button type="button" className="primary-button" onClick={onNew}>
          새 문서 분석하기
        </button>
      </div>

      <ResultSummary result={result} />

      {/* Additive Stage 1 sections — render only when the optional fields exist. */}
      <SourceHighlights highlights={result.highlights} />
      <KeyFacts keyFacts={result.key_facts} />

      {/* Stage 2: ask questions grounded in this document. */}
      <DocumentQA documentText={documentText} />

      <section className="result-section">
        <div className="section-title-row">
          <h3>핵심 카드</h3>
          <span className="count-chip">{result.cards?.length || 0}</span>
        </div>
        <div className="card-grid">
          {result.cards?.map((card, index) => (
            <ResultCard key={`${card.category}-${index}`} card={card} shortSource={shortSource} />
          ))}
        </div>
      </section>

      <section className="result-section">
        <div className="section-title-row">
          <h3>체크리스트</h3>
          <span className="count-chip">{result.checklist?.length || 0}</span>
        </div>
        <Checklist items={result.checklist || []} />
      </section>
    </div>
  );
}

export default ResultView;
