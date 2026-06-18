import { useState } from 'react';
import { submitFeedback } from '../api/analyze';
import { getFeedbackFor, saveFeedback } from '../utils/feedback';

const REASONS = [
  '요약이 부족해요',
  '근거가 이상해요',
  '문서 유형이 틀린 것 같아요',
  '중요한 내용이 빠졌어요',
  '기타'
];

function ResultFeedback({ resultId, documentType, analysisMode, onSaved }) {
  const existing = getFeedbackFor(resultId);
  const [phase, setPhase] = useState(existing ? 'done' : 'ask'); // ask | reasons | done
  const [helpful, setHelpful] = useState(existing ? existing.helpful : null);
  const [reason, setReason] = useState(existing ? existing.reason : '');

  const commit = (data) => {
    saveFeedback({ resultId, documentType, analysisMode, ...data });
    // Best-effort, anonymous send for admin review (no document text).
    submitFeedback({
      helpful: data.helpful,
      reason: data.reason || '',
      note: data.note || '',
      document_type: documentType || '',
      analysis_mode: analysisMode || 'quick'
    });
    onSaved?.();
  };

  const handleUp = () => {
    setHelpful(true);
    setReason('');
    commit({ helpful: true, reason: '', note: '' });
    setPhase('done');
  };

  const handleDown = () => {
    setHelpful(false);
    setPhase('reasons');
  };

  const handleReason = (value) => {
    setReason(value);
    commit({ helpful: false, reason: value, note: '' });
    setPhase('done');
  };

  const handleRedo = () => {
    setPhase('ask');
    setHelpful(null);
    setReason('');
  };

  return (
    <section className="result-feedback">
      {phase === 'ask' && (
        <>
          <p className="feedback-title">이 분석이 도움이 됐나요?</p>
          <div className="feedback-buttons">
            <button type="button" className="feedback-btn up" onClick={handleUp}>👍 도움 됐어요</button>
            <button type="button" className="feedback-btn down" onClick={handleDown}>👎 아쉬워요</button>
          </div>
        </>
      )}

      {phase === 'reasons' && (
        <>
          <p className="feedback-title">어떤 점이 아쉬웠나요?</p>
          <div className="feedback-reasons">
            {REASONS.map((item) => (
              <button type="button" key={item} className="feedback-reason" onClick={() => handleReason(item)}>
                {item}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'done' && (
        <>
          <p className="feedback-done">의견을 반영해 더 나은 분석 경험을 만들게요.</p>
          <p className="feedback-done-detail">
            {helpful ? '👍 도움 됐어요' : `👎 아쉬워요${reason ? ` · ${reason}` : ''}`}
          </p>
          <button type="button" className="feedback-redo" onClick={handleRedo}>다시 선택</button>
        </>
      )}
    </section>
  );
}

export default ResultFeedback;
