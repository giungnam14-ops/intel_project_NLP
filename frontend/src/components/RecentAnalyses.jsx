import { MODE_LABEL } from '../utils/modes';

const TYPE_BADGE = {
  contract: '계약서',
  terms: '약관',
  notice: '공지문',
  paper: '논문'
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

function RecentAnalyses({ records, onRestore, onDelete, limit, onShowAll, totalCount }) {
  const all = Array.isArray(records) ? records : [];
  const list = typeof limit === 'number' ? all.slice(0, limit) : all;
  const total = typeof totalCount === 'number' ? totalCount : all.length;
  const hasMore = onShowAll && total > list.length;

  return (
    <section className="home-section recent-section">
      <h2 className="home-section-title">최근 분석</h2>

      {list.length === 0 ? (
        <p className="recent-empty">아직 분석한 문서가 없어요. 문서를 가져와 요점을 확인해 보세요.</p>
      ) : (
        <div className="recent-list">
          {list.map((record) => (
            <article className="recent-card" key={record.id}>
              <div className="recent-card-head">
                <span className="recent-title" title={record.title}>{record.title}</span>
                <span className="recent-badges">
                  {record.isSample && <span className="mini-tag">샘플</span>}
                  {TYPE_BADGE[record.documentType] && (
                    <span className="mini-tag type">{TYPE_BADGE[record.documentType]}</span>
                  )}
                </span>
              </div>
              <p className="recent-date">
                {record.createdAt && <span>{formatDate(record.createdAt)}</span>}
                {record.analysisMode && record.analysisMode !== 'quick' && (
                  <span className="recent-mode">· {MODE_LABEL[record.analysisMode]}</span>
                )}
              </p>
              {record.summary && <p className="recent-summary">{record.summary}</p>}
              <div className="recent-actions">
                <button type="button" className="recent-open" onClick={() => onRestore(record)}>
                  다시 보기
                </button>
                <button type="button" className="recent-delete" onClick={() => onDelete(record)}>
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {hasMore && (
        <button type="button" className="recent-showall" onClick={onShowAll}>
          기록 탭에서 모두 보기 ({total})
        </button>
      )}

      <p className="recent-privacy">
        분석 기록은 이 브라우저에만 저장되며, 원본 파일은 저장하지 않아요.
      </p>
    </section>
  );
}

export default RecentAnalyses;
