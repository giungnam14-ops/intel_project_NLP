import { useState } from 'react';

// "앞으로 해야 할 일" — concrete to-dos extracted from the document. Checkboxes
// are local-only (visual progress); nothing is sent anywhere.
function ActionItems({ result, onShowInDocument }) {
  const items = Array.isArray(result?.action_items) ? result.action_items : [];
  const [done, setDone] = useState({});

  if (items.length === 0) return null;

  const toggle = (index) => {
    setDone((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <section className="action-items">
      <div className="action-items-head">
        <span className="action-items-icon" aria-hidden="true">✅</span>
        <div>
          <p className="action-items-title">앞으로 해야 할 일</p>
          <p className="action-items-sub">놓치면 불이익이 생길 수 있는 필수 조치예요.</p>
        </div>
      </div>

      <ul className="action-items-list">
        {items.map((item, index) => {
          const checked = Boolean(done[index]);
          return (
            <li key={index} className={`action-item${item.level === 'high' ? ' is-high' : ''}${checked ? ' is-done' : ''}`}>
              <label className="action-item-main">
                <input type="checkbox" checked={checked} onChange={() => toggle(index)} />
                <span className="action-item-text">
                  <span className="action-item-task">{item.task}</span>
                  {item.deadline && <span className="action-item-deadline">⏰ {item.deadline}</span>}
                </span>
              </label>
              {item.source_text && onShowInDocument && (
                <button
                  type="button"
                  className="text-link-button action-item-link"
                  onClick={() =>
                    onShowInDocument({
                      title: item.task,
                      text: item.source_text,
                      source: item.source_text,
                      rawTextForMatch: item.source_text,
                      quality: 'normal'
                    })
                  }
                >
                  문서에서 보기
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ActionItems;
