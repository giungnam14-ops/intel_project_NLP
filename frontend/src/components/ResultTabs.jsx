import { useState } from 'react';
import Checklist from './Checklist';
import DocumentQA from './DocumentQA';
import KeyFacts from './KeyFacts';
import ResultCard from './ResultCard';
import ResultSummary from './ResultSummary';
import SourceHighlights from './SourceHighlights';
import TopPriorities from './TopPriorities';

const TABS = [
  { key: 'summary', label: '요점' },
  { key: 'qa', label: '물어보기' },
  { key: 'evidence', label: '근거' },
  { key: 'check', label: '체크' }
];

const INITIAL_CARDS = 3;

const QUICK_QUESTIONS = [
  '환불 조건이 뭐야?',
  '돈 내야 하는 부분 알려줘',
  '내가 해야 할 일이 뭐야?'
];

function ResultTabs({ result, shortSource, documentText }) {
  const [tab, setTab] = useState('summary');
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [quickAsk, setQuickAsk] = useState(null); // { q, seq }
  const [quickInput, setQuickInput] = useState('');

  const cards = Array.isArray(result?.cards) ? result.cards : [];
  const checklist = Array.isArray(result?.checklist) ? result.checklist : [];
  const visibleCards = cardsExpanded ? cards : cards.slice(0, INITIAL_CARDS);

  const highlights = Array.isArray(result?.highlights) ? result.highlights : [];
  const hasSecurityNotice = Boolean(result?.security_notice)
    || highlights.some((item) => item?.label === '보안 주의');
  const isLongDocument = Boolean(result?.long_document) || Boolean(result?.processing_note);

  const handleQuickAsk = (question) => {
    const value = (question || '').trim();
    if (!value) return;
    setQuickAsk((prev) => ({ q: value, seq: (prev?.seq || 0) + 1 }));
    setTab('qa');
  };

  return (
    <div className="result-tabs">
      {isLongDocument && (
        <div className="longdoc-banner" role="status">
          <span className="longdoc-banner-icon" aria-hidden="true">📚</span>
          <div>
            <p className="longdoc-banner-title">긴 문서 모드로 분석했어요.</p>
            <p className="longdoc-banner-text">
              {result?.processing_note
                || '문서 전체를 한 번에 보여주기보다, 핵심 문장과 주의 표현을 중심으로 요약했습니다.'}
            </p>
          </div>
        </div>
      )}

      {hasSecurityNotice && (
        <div className="security-banner" role="status">
          <span className="security-banner-icon" aria-hidden="true">🔒</span>
          <div>
            <p className="security-banner-title">보안 주의</p>
            <p className="security-banner-text">
              문서 안에 AI 지시를 조작하려는 표현이 포함되어 있어 주의가 필요합니다.
              문서 내용 자체는 계속 분석했지만, 해당 문장은 보안 주의 문장으로 표시했어요.
            </p>
          </div>
        </div>
      )}

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

            {/* Quick ask — surface the Q&A right under the summary. */}
            <section className="quick-ask">
              <p className="quick-ask-title">문요에게 바로 물어보기</p>
              <div className="quick-ask-row">
                <input
                  type="text"
                  className="quick-ask-input"
                  placeholder="예: 환불 조건이 뭐야?"
                  value={quickInput}
                  onChange={(event) => setQuickInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleQuickAsk(quickInput);
                      setQuickInput('');
                    }
                  }}
                />
                <button
                  type="button"
                  className="primary-button quick-ask-button"
                  onClick={() => {
                    handleQuickAsk(quickInput);
                    setQuickInput('');
                  }}
                >
                  질문
                </button>
              </div>
              <div className="quick-ask-chips">
                {QUICK_QUESTIONS.map((question) => (
                  <button
                    type="button"
                    key={question}
                    className="chip qa-chip"
                    onClick={() => handleQuickAsk(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </section>

            <TopPriorities result={result} />

            <KeyFacts keyFacts={result?.key_facts} showCount={false} />

            <SourceHighlights
              highlights={result?.highlights}
              initialCount={2}
              title="주의해서 볼 문장"
              showCount={false}
              expandable={false}
            />
          </>
        )}

        {tab === 'qa' && (
          <DocumentQA
            documentText={documentText}
            prominent
            initialQuestion={quickAsk?.q || ''}
            initialSeq={quickAsk?.seq || 0}
          />
        )}

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
                  <div className="card-grid is-tight">
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
