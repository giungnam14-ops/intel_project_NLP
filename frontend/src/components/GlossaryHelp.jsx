import { useState } from 'react';
import { findTerms } from '../data/glossary';

function GlossaryHelp({ documentText }) {
  const [open, setOpen] = useState(false);
  const terms = findTerms(documentText);

  if (terms.length === 0) return null;

  return (
    <section className="result-section glossary-section">
      <button
        type="button"
        className="glossary-toggle"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>📖 어려운 말 쉽게 보기 ({terms.length})</span>
        <span className="glossary-caret" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <dl className="glossary-list">
          {terms.map((entry) => (
            <div className="glossary-item" key={entry.term}>
              <dt className="glossary-term">{entry.term}</dt>
              <dd className="glossary-desc">{entry.desc}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export default GlossaryHelp;
