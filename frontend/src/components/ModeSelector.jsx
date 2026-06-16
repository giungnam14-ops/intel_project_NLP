import { ANALYSIS_MODES } from '../utils/modes';

function ModeSelector({ value, onChange }) {
  const active = value || 'quick';
  const current = ANALYSIS_MODES.find((mode) => mode.key === active) || ANALYSIS_MODES[0];

  return (
    <section className="card mode-selector">
      <div className="panel-head">
        <div>
          <p className="eyebrow">분석 모드</p>
          <h2 className="panel-title">어떤 관점으로 볼까요?</h2>
        </div>
      </div>

      <div className="mode-chip-row">
        {ANALYSIS_MODES.map((mode) => (
          <button
            type="button"
            key={mode.key}
            className={`mode-chip${mode.key === active ? ' is-active' : ''}`}
            aria-pressed={mode.key === active}
            onClick={() => onChange(mode.key)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <p className="mode-desc">{current.desc}</p>
    </section>
  );
}

export default ModeSelector;
