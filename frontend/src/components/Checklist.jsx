import { useEffect, useState } from 'react';

function Checklist({ items }) {
  // Pre-check the first two items (preserves the original default behavior),
  // but keep it controlled so we can show live completion progress.
  const [checked, setChecked] = useState(() => items.map((_, index) => index < 2));

  useEffect(() => {
    setChecked(items.map((_, index) => index < 2));
  }, [items]);

  if (!items.length) {
    return <p className="checklist-empty">표시할 체크리스트가 없습니다.</p>;
  }

  const doneCount = checked.filter(Boolean).length;
  const total = items.length;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;

  const toggle = (index) => {
    setChecked((prev) => prev.map((value, i) => (i === index ? !value : value)));
  };

  return (
    <div className="checklist">
      <div className="checklist-progress">
        <div className="checklist-progress-bar">
          <span style={{ width: `${percent}%` }} />
        </div>
        <span className="checklist-progress-text">{doneCount}/{total} 완료</span>
      </div>

      <ul className="checklist-list">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className={`checklist-item${checked[index] ? ' is-done' : ''}`}
          >
            <label className="check-item">
              <input
                type="checkbox"
                checked={checked[index] || false}
                onChange={() => toggle(index)}
              />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Checklist;
