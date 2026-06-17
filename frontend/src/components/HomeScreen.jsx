import { useState } from 'react';
import HowToUse from './HowToUse';
import RecentAnalyses from './RecentAnalyses';

const GUIDE_KEY = 'munyo-guide-dismissed';

function HomeScreen({ onStart, onImport, onCamera, onGoExperience, onGoHistory, history, onRestore, onDeleteRecord }) {
  const [showGuide, setShowGuide] = useState(() => {
    try {
      return localStorage.getItem(GUIDE_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const dismissGuide = () => {
    setShowGuide(false);
    try {
      localStorage.setItem(GUIDE_KEY, '1');
    } catch {
      // localStorage unavailable (private mode) — guide just stays hidden this session.
    }
  };

  return (
    <div className="screen home-screen">
      <header className="home-hero">
        <div className="home-hero-top">
          <span className="brand-mark brand-mark-lg" aria-hidden="true">문</span>
          <span className="home-splash-badge">AI 문서 요점 체크</span>
        </div>

        <h1 className="home-title">문요</h1>
        <p className="home-lead">
          긴 문서 속 꼭 확인해야 할 요점을<br />
          AI가 콕 집어드립니다.
        </p>

        <button type="button" className="primary-button home-cta" onClick={onStart}>
          문서 분석 시작하기
        </button>

        <div className="home-secondary">
          <button type="button" className="import-button" onClick={onImport}>
            <span className="import-icon" aria-hidden="true">📁</span>
            <span>파일 가져오기</span>
          </button>
          <button type="button" className="import-button" onClick={onCamera}>
            <span className="import-icon" aria-hidden="true">📷</span>
            <span>사진 찍어 분석하기</span>
          </button>
        </div>
      </header>

      <div className="home-sample-cta">
        <span className="home-sample-cta-text">처음이라면 샘플로 먼저 체험해 보세요.</span>
        <button type="button" className="home-sample-cta-button" onClick={onGoExperience}>
          샘플 체험하기
        </button>
      </div>

      {Array.isArray(history) && history.length > 0 && (
        <RecentAnalyses
          records={history}
          limit={2}
          totalCount={history.length}
          onRestore={onRestore}
          onDelete={onDeleteRecord}
          onShowAll={onGoHistory}
        />
      )}

      {showGuide && <HowToUse dismissible onDismiss={dismissGuide} />}

      <section className="home-section">
        <h2 className="home-section-title">이런 문서에 딱 맞아요</h2>
        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-emoji" aria-hidden="true">📄</span>
            <div className="feature-text">
              <h3>약관 체크</h3>
              <p>자동결제·해지·환불처럼 꼭 봐야 할 조항을 짚어드려요.</p>
            </div>
          </article>
          <article className="feature-card">
            <span className="feature-emoji" aria-hidden="true">📢</span>
            <div className="feature-text">
              <h3>공지문 요점</h3>
              <p>일정·준비물·마감을 한눈에 정리해 드려요.</p>
            </div>
          </article>
          <article className="feature-card">
            <span className="feature-emoji" aria-hidden="true">🔬</span>
            <div className="feature-text">
              <h3>논문·보고서 핵심</h3>
              <p>방법·결과·한계를 빠르게 요약해 드려요.</p>
            </div>
          </article>
        </div>
      </section>

      <p className="privacy-note">
        <span aria-hidden="true">🔒</span>
        파일은 서버에 저장하지 않고, 추출된 텍스트만 분석합니다.
      </p>
    </div>
  );
}

export default HomeScreen;
