import { useState } from 'react';
import { fetchAdminFeedback } from '../api/analyze';

const TYPE_LABEL = {
  contract: '계약서',
  terms: '약관',
  notice: '공지문',
  paper: '논문',
  '(미지정)': '(미지정)'
};

const TOKEN_KEY = 'munyo-admin-token';

function AdminFeedback() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    } catch {
      return '';
    }
  });
  const [status, setStatus] = useState('idle'); // idle | loading | done
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    const value = token.trim();
    if (!value || status === 'loading') return;
    setStatus('loading');
    setError('');
    try {
      const result = await fetchAdminFeedback(value);
      try {
        sessionStorage.setItem(TOKEN_KEY, value);
      } catch {
        // ignore storage errors
      }
      setData(result);
      setStatus('done');
    } catch (err) {
      setError(err?.message || '불러오지 못했어요.');
      setStatus('idle');
    }
  };

  const summary = data?.summary;
  const items = Array.isArray(data?.items) ? data.items : [];
  const notes = items.filter((item) => item.note && item.note.trim());

  return (
    <section className="settings-group">
      <h2 className="settings-group-title">관리자 · 평가 확인</h2>
      <div className="card settings-card">
        {!open ? (
          <button type="button" className="admin-open-button" onClick={() => setOpen(true)}>
            관리자 평가 보기
          </button>
        ) : (
          <div className="admin-panel">
            <p className="admin-hint">
              서버에 설정된 관리자 토큰을 입력하면 사용자 평가 집계를 볼 수 있어요.
              (문서 내용은 저장되지 않습니다.)
            </p>
            <div className="admin-token-row">
              <input
                type="password"
                className="admin-token-input"
                placeholder="관리자 토큰"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') load();
                }}
              />
              <button
                type="button"
                className="primary-button admin-load-button"
                onClick={load}
                disabled={!token.trim() || status === 'loading'}
              >
                {status === 'loading' ? '불러오는 중…' : '불러오기'}
              </button>
            </div>

            {error && <p className="admin-error">{error}</p>}

            {status === 'done' && summary && (
              <div className="admin-result">
                <div className="admin-stat-row">
                  <div className="admin-stat">
                    <span className="admin-stat-num">{summary.total}</span>
                    <span className="admin-stat-label">전체 평가</span>
                  </div>
                  <div className="admin-stat up">
                    <span className="admin-stat-num">👍 {summary.helpful}</span>
                    <span className="admin-stat-label">도움 됨</span>
                  </div>
                  <div className="admin-stat down">
                    <span className="admin-stat-num">👎 {summary.not_helpful}</span>
                    <span className="admin-stat-label">아쉬움</span>
                  </div>
                  <div className="admin-stat">
                    <span className="admin-stat-num">{summary.helpful_rate}%</span>
                    <span className="admin-stat-label">만족도</span>
                  </div>
                </div>

                {summary.total === 0 && (
                  <p className="admin-empty">아직 수집된 평가가 없어요.</p>
                )}

                {summary.top_reasons?.length > 0 && (
                  <div className="admin-block">
                    <p className="admin-block-title">아쉬웠던 이유 (👎)</p>
                    <ul className="admin-bar-list">
                      {summary.top_reasons.map((row) => (
                        <li key={row.reason} className="admin-bar-item">
                          <span className="admin-bar-label">{row.reason}</span>
                          <span className="admin-bar-count">{row.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.by_document_type && Object.keys(summary.by_document_type).length > 0 && (
                  <div className="admin-block">
                    <p className="admin-block-title">문서 종류별</p>
                    <ul className="admin-bar-list">
                      {Object.entries(summary.by_document_type).map(([type, count]) => (
                        <li key={type} className="admin-bar-item">
                          <span className="admin-bar-label">{TYPE_LABEL[type] || type}</span>
                          <span className="admin-bar-count">{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {notes.length > 0 && (
                  <div className="admin-block">
                    <p className="admin-block-title">남긴 메모</p>
                    <ul className="admin-note-list">
                      {notes.slice(0, 30).map((item) => (
                        <li key={item.id} className="admin-note-item">
                          <span className={`admin-note-dot ${item.helpful ? 'up' : 'down'}`} aria-hidden="true" />
                          {item.note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="admin-foot">집계는 익명 데이터이며 문서 본문은 포함되지 않습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default AdminFeedback;
