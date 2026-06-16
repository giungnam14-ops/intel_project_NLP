import ResultFeedback from './ResultFeedback';
import ResultTabs from './ResultTabs';

function ResultView({
  result,
  shortSource,
  documentText,
  documentMeta,
  savedView = false,
  analysisMode = 'quick',
  isSample = false,
  resultId = null,
  onFeedbackSaved,
  onNew
}) {
  if (!result) return null;

  return (
    <div className="result-view">
      {isSample && (
        <p className="sample-banner">📄 샘플 문서를 분석한 결과예요. 실제 문서로도 똑같이 분석할 수 있어요.</p>
      )}
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
        analysisMode={analysisMode}
      />

      <ResultFeedback
        key={resultId || 'feedback'}
        resultId={resultId}
        documentType={result?.document_type}
        analysisMode={analysisMode}
        onSaved={onFeedbackSaved}
      />
    </div>
  );
}

export default ResultView;
