import { useState } from 'react';
import { ANALYSIS_MODES } from '../utils/modes';

const FOCUS_MODES = ANALYSIS_MODES.filter((mode) => mode.key !== 'quick');

function ModeSelector({ value, onChange }) {
  const active = value || 'quick';
  const isQuick = active === 'quick';
  // Auto-expand the focus options when a specific lens is already chosen.
  const [open, setOpen] = useState(!isQuick);

  const current = ANALYSIS_MODES.find((mode) => mode.key === active) || ANALYSIS_MODES[0];

  return (
    <section className="card mode-selector">
      <div className="panel-head">
        <div>
          <p className="eyebrow">분석 방식</p>
          <h2 className="panel-title">어떻게 분석할까요?</h2>
        </div>
      </div>

      {/* Default: whole-document analysis */}
      <button
        type="button"
        className={`mode-primary${isQuick ? ' is-active' : ''}`}
        aria-pressed={isQuick}
        onClick={() => onChange('quick')}
      >
        <span className="mode-primary-text">
          <strong>전체 분석</strong>
          <small>문서 전체를 한눈에 요약해요 · 기본</small>
        </span>
        {isQuick && <span className="mode-primary-check" aria-hidden="true">✓</span>}
      </button>

      {/* Optional: focus on a specific perspective */}
      <button
        type="button"
        className="mode-focus-toggle"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>특정 관점만 골라 보기 (선택)</span>
        <span className="mode-focus-caret" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mode-chip-row">
          {FOCUS_MODES.map((mode) => (
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
      )}

      <p className="mode-desc">{current.desc}</p>
    </section>
  );
}

export default ModeSelector;
