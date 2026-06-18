import { useState } from 'react';
import { submitMessage } from '../api/analyze';

function VoiceScreen({ onBack }) {
  const [kind, setKind] = useState('review'); // review | inquiry
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done
  const [error, setError] = useState('');

  const reset = () => {
    setRating(0);
    setMessage('');
    setContact('');
    setError('');
    setStatus('idle');
  };

  const switchKind = (next) => {
    if (next === kind) return;
    setKind(next);
    reset();
  };

  const send = async () => {
    if (!message.trim()) {
      setError('내용을 입력해 주세요.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await submitMessage({ kind, rating, message, contact });
      setStatus('done');
    } catch (err) {
      setError(err?.message || '전송하지 못했어요.');
      setStatus('idle');
    }
  };

  return (
    <div className="screen voice-screen">
      <header className="screen-bar">
        <div>
          <button type="button" className="voice-back" onClick={onBack}>← 홈으로</button>
          <h1 className="screen-bar-title">후기·문의</h1>
          <p className="screen-bar-sub">의견을 남기면 운영자가 확인해요</p>
        </div>
        <span className="brand-chip">문요</span>
      </header>

      {status === 'done' ? (
        <div className="card voice-done">
          <span className="voice-done-emoji" aria-hidden="true">💌</span>
          <p className="voice-done-title">
            {kind === 'review' ? '소중한 후기 감사합니다!' : '문의가 접수됐어요.'}
          </p>
          <p className="voice-done-sub">
            {kind === 'review'
              ? '남겨주신 후기는 더 나은 문요를 만드는 데 쓰일게요.'
              : '운영자가 확인 후, 연락처를 남기셨다면 답변드릴게요.'}
          </p>
          <div className="voice-done-actions">
            <button type="button" className="primary-button" onClick={reset}>또 남기기</button>
            <button type="button" className="ghost-button" onClick={onBack}>홈으로</button>
          </div>
        </div>
      ) : (
        <div className="card voice-card">
          <div className="voice-kind-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'review'}
              className={`voice-kind-tab${kind === 'review' ? ' is-active' : ''}`}
              onClick={() => switchKind('review')}
            >
              ⭐ 사용 후기
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={kind === 'inquiry'}
              className={`voice-kind-tab${kind === 'inquiry' ? ' is-active' : ''}`}
              onClick={() => switchKind('inquiry')}
            >
              ✉️ 문의하기
            </button>
          </div>

          {kind === 'review' && (
            <div className="voice-field">
              <label className="voice-label">별점</label>
              <div className="voice-stars" role="radiogroup" aria-label="별점">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    role="radio"
                    aria-checked={rating === n}
                    className={`voice-star${n <= rating ? ' is-on' : ''}`}
                    onClick={() => setRating(n)}
                    aria-label={`${n}점`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="voice-field">
            <label className="voice-label" htmlFor="voice-message">
              {kind === 'review' ? '후기 내용' : '문의 내용'}
            </label>
            <textarea
              id="voice-message"
              className="voice-textarea"
              rows={5}
              placeholder={
                kind === 'review'
                  ? '문요를 써보니 어떠셨나요? 좋았던 점, 아쉬운 점을 자유롭게 적어주세요.'
                  : '궁금하거나 불편했던 점을 적어주세요.'
              }
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
            />
          </div>

          {kind === 'inquiry' && (
            <div className="voice-field">
              <label className="voice-label" htmlFor="voice-contact">답변 받을 연락처 (선택)</label>
              <input
                id="voice-contact"
                type="text"
                className="voice-input"
                placeholder="이메일 등 — 답변이 필요할 때만 적어주세요"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                maxLength={200}
              />
            </div>
          )}

          {error && <p className="voice-error">{error}</p>}

          <button
            type="button"
            className="primary-button voice-submit"
            onClick={send}
            disabled={status === 'sending'}
          >
            {status === 'sending' ? '보내는 중…' : '보내기'}
          </button>

          <p className="voice-privacy">
            🔒 입력한 내용만 운영자에게 전달돼요. 분석한 문서 내용은 함께 전송되지 않습니다.
          </p>
        </div>
      )}
    </div>
  );
}

export default VoiceScreen;
