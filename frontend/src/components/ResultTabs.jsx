import { useState } from 'react';
import ConfirmChecklist from './ConfirmChecklist';
import DocumentPreview from './DocumentPreview';
import DocumentQA from './DocumentQA';
import ImportedDocumentCard from './ImportedDocumentCard';
import ResultCard from './ResultCard';
import ResultSummary from './ResultSummary';
import SourceHighlights from './SourceHighlights';
import TopPriorities from './TopPriorities';

const TABS = [
  { key: 'summary', label: '요점' },
  { key: 'qa', label: '물어보기' },
  { key: 'document', label: '문서' },
  { key: 'evidence', label: '근거' },
  { key: 'check', label: '체크' }
];

const INITIAL_CARDS = 3;

// Friendly badge per document type. "기타"/blocked are intentionally hidden.
const TYPE_BADGE = {
  contract: '계약서',
  terms: '약관',
  notice: '공지문',
  paper: '논문'
};

const QUICK_QUESTIONS = [
  '돈 내야 하는 부분 알려줘',
  '내가 해야 할 일 알려줘',
  '불리한 조건 있어?',
  '근거 문장 보여줘'
];

function ResultTabs({ result, shortSource, documentText, documentMeta }) {
  const [tab, setTab] = useState('summary');
  const [cardsExpanded, setCardsExpanded] = useState(false);
  const [quickAsk, setQuickAsk] = useState(null); // { q, seq }
  const [quickInput, setQuickInput] = useState('');

  const cards = Array.isArray(result?.cards) ? result.cards : [];
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

      {(documentMeta || documentText) && (
        <div className="result-docbar">
          <div className="result-docbar-info">
            <span className="result-docbar-eyebrow">분석한 문서</span>
            <span className="result-docbar-name">{documentMeta?.name || '직접 입력한 문서'}</span>
            <span className="result-docbar-tags">
              {TYPE_BADGE[result?.document_type] && (
                <span className="mini-tag type">{TYPE_BADGE[result.document_type]}</span>
              )}
              {isLongDocument && <span className="mini-tag">긴 문서</span>}
              {documentMeta?.status === 'review' && <span className="mini-tag warn">OCR 확인 필요</span>}
            </span>
          </div>
          <button type="button" className="result-docbar-button" onClick={() => setTab('document')}>
            문서 보기
          </button>
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
            <p className="tab-help">
              먼저 확인할 3가지만 보고, 더 자세한 내용은 근거·체크 탭에서 볼 수 있어요.
            </p>

            {/* 1. 한 줄 결론 */}
            <ResultSummary result={result} />

            {/* 2. 지금 꼭 확인할 것 3개 (근거는 눌러서 펼침) */}
            <TopPriorities result={result} />

            {/* 3. 궁금한 점이 있나요? */}
            <section className="quick-ask">
              <p className="quick-ask-title">궁금한 점이 있나요?</p>
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

            {/* 4. 자세히 보기 */}
            <div className="more-actions">
              <button type="button" className="more-action-button" onClick={() => setTab('evidence')}>
                근거 자세히 보기
              </button>
              <button type="button" className="more-action-button" onClick={() => setTab('check')}>
                체크리스트 보기
              </button>
            </div>
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

        {tab === 'document' && (
          <section className="result-section">
            {documentMeta ? (
              <>
                <ImportedDocumentCard meta={documentMeta} readOnly />
                <DocumentPreview meta={documentMeta} text={documentText} readOnly />
              </>
            ) : documentText ? (
              <DocumentPreview meta={null} text={documentText} readOnly />
            ) : (
              <p className="tab-empty">표시할 문서가 없습니다.</p>
            )}
            <p className="tab-help">다시 분석하려면 분석 탭에서 문서를 수정해 주세요.</p>
          </section>
        )}

        {tab === 'evidence' && (
          <>
            <SourceHighlights highlights={result?.highlights} title="주의해서 볼 문장" />

            <section className="result-section">
              <div className="section-title-row">
                <h3>자세한 근거</h3>
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
                      {cardsExpanded ? '접기' : `자세한 근거 ${cards.length - INITIAL_CARDS}개 더 보기`}
                    </button>
                  )}
                </>
              ) : (
                <p className="tab-empty">자세한 근거 항목이 없습니다.</p>
              )}
            </section>
          </>
        )}

        {tab === 'check' && <ConfirmChecklist result={result} />}
      </div>
    </div>
  );
}

export default ResultTabs;
