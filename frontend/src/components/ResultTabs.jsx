import { useState } from 'react';
import Checklist from './Checklist';
import DocumentQA from './DocumentQA';
import KeyFacts from './KeyFacts';
import ResultCard from './ResultCard';
import ResultSummary from './ResultSummary';
import SourceHighlights from './SourceHighlights';

const TABS = [
  { key: 'summary', label: '요점' },
  { key: 'qa', label: '질문' },
  { key: 'evidence', label: '근거' },
  { key: 'check', label: '체크' }
];

const INITIAL_CARDS = 3;

function ResultTabs({ result, shortSource, documentText }) {
  const [tab, setTab] = useState('summary');
  const [cardsExpanded, setCardsExpanded] = useState(false);

  const cards = Array.isArray(result?.cards) ? result.cards : [];
  const checklist = Array.isArray(result?.checklist) ? result.checklist : [];
  const visibleCards = cardsExpanded ? cards : cards.slice(0, INITIAL_CARDS);

  return (
    <div className="result-tabs">
      <div className="result-tabbar" role="tablist" aria-label="분석 결과 보기">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={`result-tab${tab === item.key ? ' is-active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="result-tab-panel">
        {tab === 'summary' && (
          <>
            <ResultSummary result={result} />
            <KeyFacts keyFacts={result?.key_facts} previewCount={2} />
            <SourceHighlights highlights={result?.highlights} initialCount={3} />
          </>
        )}

        {tab === 'qa' && <DocumentQA documentText={documentText} prominent />}

        {tab === 'evidence' && (
          <>
            <SourceHighlights highlights={result?.highlights} />

            <section className="result-section">
              <div className="section-title-row">
                <h3>상세 분석</h3>
                <span className="count-chip">{cards.length}</span>
              </div>

              {cards.length > 0 ? (
                <>
                  <div className="card-grid">
                    {visibleCards.map((card, index) => (
                      <ResultCard key={`${card.category}-${index}`} card={card} shortSource={shortSource} />
                    ))}
                  </div>
                  {cards.length > INITIAL_CARDS && (
                    <button
                      type="button"
                      className="more-button"
                      onClick={() => setCardsExpanded((prev) => !prev)}
                    >
                      {cardsExpanded ? '접기' : `상세 분석 ${cards.length - INITIAL_CARDS}개 더 보기`}
                    </button>
                  )}
                </>
              ) : (
                <p className="tab-empty">상세 분석 항목이 없습니다.</p>
              )}
            </section>
          </>
        )}

        {tab === 'check' && (
          <section className="result-section">
            <div className="section-title-row">
              <h3>체크리스트</h3>
              <span className="count-chip">{checklist.length}</span>
            </div>
            {checklist.length > 0 ? (
              <Checklist items={checklist} />
            ) : (
              <p className="tab-empty">체크리스트 항목이 없습니다.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default ResultTabs;
