// Lets users opt into AI 고급 분석 (PRO) at the start of analysis. Available to
// use now (server runs it with the API token); billing/limits come later.
function AdvancedAnalysisOption({ advanced, onToggle }) {
  return (
    <section className="adv-option">
      <label className="adv-option-row">
        <span className="adv-option-text">
          <span className="adv-option-title">
            ✨ AI 고급 분석 함께 받기 <span className="ai-pro-badge sm">PRO</span>
          </span>
          <span className="adv-option-sub">
            켜면 분석할 때 AI가 더 깊은 요약과 핵심 문장 설명을 함께 만들어요. (문서 내용이 AI로 전송돼요)
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

export default AdvancedAnalysisOption;
