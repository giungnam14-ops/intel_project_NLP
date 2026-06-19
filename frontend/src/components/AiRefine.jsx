import { useEffect, useRef, useState } from 'react';
import { aiAnalyzeDocument } from '../api/analyze';

const LEVEL_LABEL = {
  high: '꼭 확인',
  medium: '확인 권장',
  low: '참고'
};

// PRO feature, always available to use now (server runs it with the API token).
// Billing/limits come later; for now anyone can run it.
function AiRefine({ documentText = '', autoRun = false, onShowInDocument }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const autoRunRef = useRef(false);

  const canRun = Boolean((documentText || '').trim());

  const run = async () => {
    if (!canRun || status === 'loading') return;
    setStatus('loading');
    setError('');
    try {
      const result = await aiAnalyzeDocument(documentText);
      if (result?.available) {
        setData(result);
        setStatus('done');
      } else {
        setError(result?.error || 'AI 정밀 분석을 사용할 수 없어요.');
        setStatus('idle');
      }
    } catch {
      setError('AI 정밀 분석을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      setStatus('idle');
    }
  };

  // Auto-run once when the user opted into 고급 분석 at the start.
  // (Keyed remount per result resets autoRunRef.)
  useEffect(() => {
    if (autoRun && canRun && status === 'idle' && !autoRunRef.current) {
      autoRunRef.current = true;
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, canRun, status]);

  const showQuote = (point) => {
    if (!onShowInDocument || !point?.quote) return;
    onShowInDocument({
      title: point.title || 'AI가 찾은 문장',
      text: point.quote,
      source: point.quote,
      rawTextForMatch: point.quote,
      quality: 'normal'
    });
  };

  return (
    <section className="ai-refine">
      <div className="ai-refine-head">
        <div>
          <p className="ai-refine-title">
            <span className="ai-refine-spark" aria-hidden="true">✨</span> AI 정밀 분석
            <span className="ai-pro-badge sm">PRO</span>
          </p>
          <p className="ai-refine-sub">
            규칙 기반 요약 위에, AI가 문서를 더 깊이 읽고 핵심 문장을 골라 설명해요.
          </p>
        </div>
        {status !== 'done' && (
          <button
            type="button"
            className="primary-button ai-refine-run"
            onClick={run}
            disabled={!canRun || status === 'loading'}
          >
            {status === 'loading' ? '분석 중…' : 'AI로 더 깊이 분석'}
          </button>
        )}
      </div>

      {status !== 'done' && (
        <p className="ai-refine-privacy">
          🔒 누르면 문서 내용이 분석 AI로 전송돼요. 이메일·전화·주민번호 같은 개인정보는 가린 뒤 보냅니다.
        </p>
      )}

      {error && <p className="ai-refine-error">{error}</p>}

      {status === 'loading' && (
        <p className="ai-refine-loading">AI가 문서를 읽고 있어요… 잠시만 기다려 주세요.</p>
      )}

      {status === 'done' && data && (
        <div className="ai-refine-result">
          {data.summary && (
            <div className="ai-refine-summary">
              <span className="ai-refine-summary-label">한 줄 핵심</span>
              <p>{data.summary}</p>
            </div>
          )}

          {Array.isArray(data.key_points) && data.key_points.length > 0 && (
            <ul className="ai-point-list">
              {data.key_points.map((point, index) => (
                <li className={`ai-point level-${point.level || 'medium'}`} key={`${point.title}-${index}`}>
                  <div className="ai-point-head">
                    <span className={`ai-point-badge level-${point.level || 'medium'}`}>
                      {LEVEL_LABEL[point.level] || '확인 권장'}
                    </span>
                    <span className="ai-point-title">{point.title}</span>
                  </div>
                  {point.detail && <p className="ai-point-detail">{point.detail}</p>}
                  {point.quote && (
                    <div className="ai-point-quote-row">
                      <span className="ai-point-quote">“{point.quote}”</span>
                      {onShowInDocument && (
                        <button
                          type="button"
                          className="text-link-button"
                          onClick={() => showQuote(point)}
                        >
                          문서에서 보기
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {Array.isArray(data.watch_outs) && data.watch_outs.length > 0 && (
            <div className="ai-refine-watch">
              <p className="ai-refine-watch-title">⚠️ 특히 조심할 점</p>
              <ul>
                {data.watch_outs.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {data.plain_explanation && (
            <div className="ai-refine-plain">
              <p className="ai-refine-plain-title">쉽게 말하면</p>
              <p>{data.plain_explanation}</p>
            </div>
          )}

          <p className="ai-refine-foot">
            {data.truncated && '문서가 길어 앞부분 위주로 분석했어요. '}
            AI 분석은 참고용이며, 중요한 결정 전에는 원문을 꼭 확인하세요.
          </p>
        </div>
      )}
    </section>
  );
}

export default AiRefine;
