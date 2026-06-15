import { useEffect, useRef, useState } from 'react';
import { askDocument } from '../api/analyze';

const SUGGESTED_QUESTIONS = [
  '돈 내야 하는 부분만 알려줘',
  '환불 조건이 뭐야?',
  '개인정보 제공 내용 알려줘',
  '내가 해야 할 일이 뭐야?',
  '마감일이 있어?',
  '불리한 조건이 있어?'
];

const CONFIDENCE_META = {
  high: { label: '신뢰 높음', cls: 'high' },
  medium: { label: '일부 근거 있음', cls: 'medium' },
  low: { label: '명확히 찾지 못함', cls: 'low' }
};

function DocumentQA({ documentText, prominent = false, initialQuestion = '', initialSeq = 0 }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastSeqRef = useRef(0);

  const runAsk = async (raw) => {
    const query = (raw ?? question).trim();
    if (!query) {
      setError('궁금한 내용을 입력해 주세요.');
      setAnswer(null);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const data = await askDocument(documentText || '', query);
      setAnswer(data);
    } catch (err) {
      setAnswer(null);
      setError(err.message || '질문에 답변하는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChip = (q) => {
    setQuestion(q);
    runAsk(q);
  };

  // Auto-run a question routed in from the result-top quick-ask box.
  useEffect(() => {
    if (initialSeq && initialSeq !== lastSeqRef.current && initialQuestion) {
      lastSeqRef.current = initialSeq;
      setQuestion(initialQuestion);
      runAsk(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSeq, initialQuestion]);

  const confidenceKey = String(answer?.confidence || 'low').toLowerCase();
  const confidence = CONFIDENCE_META[confidenceKey] || CONFIDENCE_META.low;
  const evidence = Array.isArray(answer?.evidence) ? answer.evidence : [];
  const followups = Array.isArray(answer?.suggested_followups) ? answer.suggested_followups : [];

  return (
    <section className="result-section qa-section">
      <div className="section-title-row">
        <h3>문요에게 물어보기</h3>
      </div>

      {prominent && (
        <p className="qa-intro">
          이 문서에서 궁금한 점을 물어보세요.
          <span className="qa-intro-eg">예: 환불 조건이 뭐야?</span>
        </p>
      )}

      <div className="qa-input-row">
        <input
          type="text"
          className="qa-input"
          placeholder="이 문서에 대해 궁금한 점을 물어보세요"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') runAsk();
          }}
          disabled={loading}
        />
        <button
          type="button"
          className="primary-button qa-ask"
          onClick={() => runAsk()}
          disabled={loading}
        >
          질문하기
        </button>
      </div>

      <div className="qa-chip-row">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            type="button"
            key={q}
            className="chip qa-chip"
            onClick={() => handleChip(q)}
            disabled={loading}
          >
            {q}
          </button>
        ))}
      </div>

      {loading && <p className="qa-status">문서에서 답을 찾는 중입니다…</p>}
      {!loading && error && <p className="qa-status qa-status-error">{error}</p>}

      {!loading && !error && answer && (
        <div className="qa-answer-card">
          <div className="qa-answer-head">
            <span className="qa-answer-badge">답변</span>
            <span className={`qa-confidence qa-confidence-${confidence.cls}`}>{confidence.label}</span>
          </div>
          <p className="qa-answer-text">{answer.answer}</p>

          {evidence.length > 0 ? (
            <div className="qa-evidence">
              <p className="qa-evidence-title">근거 문장</p>
              {evidence.map((item, index) => (
                <article className="qa-evidence-card" key={index}>
                  {item?.label && <span className="qa-evidence-label">{item.label}</span>}
                  <p>{item?.source_text}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="qa-evidence-empty">근거 문장을 찾지 못했습니다.</p>
          )}

          {followups.length > 0 && (
            <div className="qa-followups">
              <p className="qa-followups-title">이어서 물어보기</p>
              <div className="qa-chip-row">
                {followups.map((q) => (
                  <button
                    type="button"
                    key={q}
                    className="chip qa-chip"
                    onClick={() => handleChip(q)}
                    disabled={loading}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default DocumentQA;
