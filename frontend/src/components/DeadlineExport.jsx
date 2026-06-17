import { downloadIcs, extractDeadlines } from '../utils/deadlines';

function DeadlineExport({ result }) {
  const deadlines = extractDeadlines(result);
  if (deadlines.length === 0) return null;

  const exportable = deadlines.filter((entry) => entry.parsed);

  return (
    <section className="result-section deadline-section">
      <div className="section-title-row">
        <h3>기한 챙기기</h3>
        <span className="count-chip">{deadlines.length}</span>
      </div>

      <ul className="deadline-list">
        {deadlines.map((entry, index) => (
          <li className="deadline-item" key={`${entry.value}-${index}`}>
            <div className="deadline-text">
              <span className="deadline-value">{entry.value || entry.label}</span>
              <span className="deadline-label">{entry.label}</span>
            </div>
            {entry.parsed ? (
              <button
                type="button"
                className="deadline-add"
                onClick={() => downloadIcs([entry], 'munyo-deadline.ics')}
              >
                캘린더에 추가
              </button>
            ) : (
              <span className="deadline-relative">기준일 기준</span>
            )}
          </li>
        ))}
      </ul>

      {exportable.length > 0 && (
        <button
          type="button"
          className="deadline-export-all"
          onClick={() => downloadIcs(exportable, 'munyo-deadlines.ics')}
        >
          전체 기한 캘린더(.ics)로 저장 ({exportable.length})
        </button>
      )}

      <p className="deadline-note">
        날짜가 분명한 기한만 캘린더에 추가할 수 있어요. ‘7일 이내’처럼 기준일이 필요한 기한은 원문에서 직접 확인해 주세요.
      </p>
    </section>
  );
}

export default DeadlineExport;
