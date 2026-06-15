import ResultTabs from './ResultTabs';

function ResultView({ result, shortSource, documentText, documentMeta, onNew }) {
  if (!result) return null;

  return (
    <div className="result-view">
      <div className="result-view-actions">
        <button type="button" className="primary-button" onClick={onNew}>
          새 문서 분석하기
        </button>
      </div>

      <ResultTabs
        result={result}
        shortSource={shortSource}
        documentText={documentText}
        documentMeta={documentMeta}
      />
    </div>
  );
}

export default ResultView;
