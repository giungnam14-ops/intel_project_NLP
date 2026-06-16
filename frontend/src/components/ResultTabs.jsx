import { useState } from 'react';
import ConfirmChecklist from './ConfirmChecklist';
import DocumentPreview from './DocumentPreview';
import DocumentQA from './DocumentQA';
import EvidenceDocumentViewer from './EvidenceDocumentViewer';
import ImportedDocumentCard from './ImportedDocumentCard';
import ResultCard from './ResultCard';
import ResultSummary from './ResultSummary';
import SourceHighlights from './SourceHighlights';
import SummaryBrief from './SummaryBrief';
import TopPriorities from './TopPriorities';
import { isDocumentNoisy } from '../utils/evidence';

const TABS = [
  { key: 'summary', label: '요점' },
  { key: 'qa', label: '물어보기' },
  { key: 'document', label: '문서' },
  { key: 'evidence', label: '근거' },
  { key: 'check', label: '확인' }
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
  const [activeEvidence, setActiveEvidence] = useState(null);

  // Jump to the document tab and highlight the given evidence sentence.
  // Remembers the tab we came from so the user can hop straight back.
  const showInDocument = (evidence) => {
    if (evidence) {
      // Always a fresh object so the viewer re-scrolls even on repeat clicks.
      setActiveEvidence({
        title: evidence.title || '',
        text: evidence.text || evidence.source || '',
        rawTextForMatch: evidence.rawTextForMatch || evidence.text || evidence.source || '',
        source: evidence.source || evidence.text || '',
        quality: evidence.quality || 'normal',
        returnTab: tab === 'document' ? 'summary' : tab
      });
    }
    setTab('document');
  };

  const RETURN_LABELS = {
    summary: '요점으로 돌아가기',
    qa: '답변으로 돌아가기',
    evidence: '근거로 돌아가기',
    check: '확인으로 돌아가기'
  };
  const returnTab = activeEvidence?.returnTab || 'summary';
  const returnLabel = RETURN_LABELS[returnTab] || '결과로 돌아가기';

  const cards = Array.isArray(result?.cards) ? result.cards : [];
  const visibleCards = cardsExpanded ? cards : cards.slice(0, INITIAL_CARDS);

  const highlights = Array.isArray(result?.highlights) ? result.highlights : [];
  const hasSecurityNotice = Boolean(result?.security_notice)
    || highlights.some((item) => item?.label === '보안 주의');
  const isLongDocument = Boolean(result?.long_document) || Boolean(result?.processing_note);
  const noisyDocument = isDocumentNoisy(documentText);

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

      {noisyDocument && (
        <div className="noisy-banner" role="status">
          <span className="noisy-banner-icon" aria-hidden="true">⚠️</span>
          <p className="noisy-banner-text">
            PDF 텍스트가 일부 깨져 정확도가 낮을 수 있어요. 원본 문서와 함께 확인해 주세요.
          </p>
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

            {/* 핵심 요약 — 데이터가 부족해도 항상 표시 */}
            <SummaryBrief result={result} documentMeta={documentMeta} noisy={noisyDocument} />

            {/* 2. 지금 꼭 확인할 것 3개 (근거는 눌러서 펼침) */}
            <TopPriorities result={result} onShowInDocument={showInDocument} />

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
            onShowInDocument={showInDocument}
          />
        )}

        {tab === 'document' && (
          <section className="result-section">
            {activeEvidence && (
              <div className="evidence-return">
                <button
                  type="button"
                  className="evidence-return-button"
                  onClick={() => setTab(returnTab)}
                >
                  ← {returnLabel}
                </button>
                <div className="evidence-current">
                  <span className="evidence-current-label">현재 확인 중</span>
                  <span className="evidence-current-title">{activeEvidence.title || '선택한 근거'}</span>
                </div>
                <p className="evidence-current-hint">노란색으로 표시된 문장이 방금 선택한 근거예요.</p>
              </div>
            )}

            {documentMeta && <ImportedDocumentCard meta={documentMeta} readOnly />}
            {documentMeta?.previewUrl && (
              <DocumentPreview meta={documentMeta} text={documentText} readOnly />
            )}
            <EvidenceDocumentViewer
              text={documentText}
              activeEvidence={activeEvidence}
              documentMeta={documentMeta}
            />

            {activeEvidence && (
              <button
                type="button"
                className="evidence-return-button is-bottom"
                onClick={() => setTab(returnTab)}
              >
                ← {returnLabel}
              </button>
            )}
            <p className="tab-help">다시 분석하려면 분석 탭에서 문서를 수정해 주세요.</p>
          </section>
        )}

        {tab === 'evidence' && (
          <>
            <SourceHighlights
              highlights={result?.highlights}
              title="주의해서 볼 문장"
              onShowInDocument={showInDocument}
            />

            <section className="result-section">
              <div className="section-title-row">
                <h3>자세한 근거</h3>
                <span className="count-chip">{cards.length}</span>
              </div>

              {cards.length > 0 ? (
                <>
                  <div className="card-grid is-tight">
                    {visibleCards.map((card, index) => (
                      <ResultCard
                        key={`${card.category}-${index}`}
                        card={card}
                        shortSource={shortSource}
                        onShowInDocument={showInDocument}
                      />
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

        {tab === 'check' && <ConfirmChecklist result={result} onShowInDocument={showInDocument} />}
      </div>
    </div>
  );
}

export default ResultTabs;
