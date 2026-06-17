import RecentAnalyses from './RecentAnalyses';

function HistoryScreen({ history, onRestore, onDeleteRecord }) {
  return (
    <div className="screen history-screen">
      <header className="screen-bar">
        <div>
          <h1 className="screen-bar-title">기록</h1>
          <p className="screen-bar-sub">최근 분석 다시 보기</p>
        </div>
        <span className="brand-chip">문요</span>
      </header>

      <RecentAnalyses records={history} onRestore={onRestore} onDelete={onDeleteRecord} />
    </div>
  );
}

export default HistoryScreen;
