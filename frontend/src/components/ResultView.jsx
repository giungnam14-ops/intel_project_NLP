import ResultTabs from './ResultTabs';

function ResultView({ result, shortSource, documentText, documentMeta, savedView = false, onNew }) {
  if (!result) return null;

  return (
    <div className="result-view">
      {savedView && (
        <p className="saved-banner">저장된 분석 기록이에요. 원본 파일은 저장하지 않았어요.</p>
      )}

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
