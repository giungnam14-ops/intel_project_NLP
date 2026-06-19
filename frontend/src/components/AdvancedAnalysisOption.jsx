import { useEffect, useState } from 'react';
import { aiStatus } from '../api/analyze';

// Lets users opt into AI 고급 분석 (PRO) at the start of analysis. When the
// feature is configured, it's a toggle; otherwise it's a PRO upsell.
function AdvancedAnalysisOption({ advanced, onToggle }) {
  const [enabled, setEnabled] = useState(null); // null = checking

  useEffect(() => {
    let cancelled = false;
    aiStatus()
      .then((result) => {
        if (!cancelled) setEnabled(Boolean(result?.available));
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (enabled) {
    return (
      <section className="adv-option">
        <label className="adv-option-row">
          <span className="adv-option-text">
            <span className="adv-option-title">
              ✨ AI 고급 분석 함께 받기 <span className="ai-pro-badge sm">PRO</span>
            </span>
            <span className="adv-option-sub">
              분석할 때 AI가 더 깊은 요약과 핵심 문장 설명을 함께 만들어요. (문서 내용이 AI로 전송돼요)
            </span>
          </span>
          <span className={`switch${advanced ? ' is-on' : ''}`}>
            <input
              type="checkbox"
              checked={advanced}
              onChange={(event) => onToggle(event.target.checked)}
            />
            <span className="switch-knob" aria-hidden="true" />
          </span>
        </label>
      </section>
    );
  }

  // Not configured yet → PRO upsell (disabled).
  return (
    <section className="adv-option is-locked">
      <div className="adv-option-text">
        <span className="adv-option-title">
          ✨ AI 고급 분석 <span className="ai-pro-badge sm">PRO</span>
        </span>
        <span className="adv-option-sub">
          더 깊은 요약 · 핵심 문장 설명 · 정밀 탐지. 프리미엄에서 곧 제공돼요.
        </span>
      </div>
      <span className="adv-option-lock">곧 제공</span>
    </section>
  );
}

export default AdvancedAnalysisOption;
