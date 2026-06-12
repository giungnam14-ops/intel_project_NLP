import { useMemo, useState } from 'react';
import { analyzeDocument } from './api/analyze';
import Checklist from './components/Checklist';
import DocumentInput from './components/DocumentInput';
import ResultCard from './components/ResultCard';
import ResultSummary from './components/ResultSummary';

const SAMPLE_DOCUMENTS = {
  terms: `이용 약관에 따라 회원은 서비스 이용을 시작한 날로부터 자동결제가 이루어집니다.
본 서비스는 환불이 제한될 수 있으며, 가입 후 해지 신청을 해야 합니다.
또한 개인정보는 서비스 제공 목적을 위해 제3자에게 제공될 수 있습니다.
이용자는 자동결제 시작일과 해지 조건을 반드시 확인해야 합니다.`,
  notice: `공지사항: 7월 20일 오후 2시, 본관 3층 회의실에서 직원 워크숍이 진행됩니다.
참석자는 신분증, 노트북, 필기구를 지참해야 하며, 사전 등록은 7월 18일까지 완료해야 합니다.
현장 제출 서류는 담당자에게 직접 제출해 주세요.`,
  paper: `본 연구는 사용자의 문서 분석 정확도를 높이기 위한 AI 모델을 제안한다.
방법론으로는 문장 단위 요약과 위험 문장 분류를 결합한 구조를 사용하였다.
실험 결과, 핵심 문장 추출 성능이 기존 대비 향상되었으나, 매우 긴 문서에서는 문맥 손실이 발생할 수 있다.
이 연구의 한계점은 도메인별 어휘 차이에 대한 일반화 성능이 제한적이라는 점이다.`
};

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasResult = Boolean(result);

  const summaryLabel = useMemo(() => {
    if (!result) return '분석 결과가 여기에 표시됩니다.';
    return `${result.document_type_label || result.document_type} · ${result.risk_level}`;
  }, [result]);

  const handleExample = (type) => {
    setText(SAMPLE_DOCUMENTS[type]);
    setError('');
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('분석할 문서를 먼저 입력해 주세요.');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await analyzeDocument(text);
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err.message || '분석 중 오류가 발생했습니다. FastAPI 서버가 실행 중인지 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setResult(null);
    setError('');
  };

  return (
    <main className="app-shell">
      <section className="hero-card panel">
        <p className="eyebrow">AI 문서 요점 체크</p>
        <h1>문요</h1>
        <p className="lead">긴 문서 속 꼭 확인해야 할 요점을 AI가 콕 집어드립니다.</p>
        <p className="description">
          약관, 공지문, 논문을 입력하면 핵심 요점과 체크리스트를 빠르게 확인할 수 있습니다.
        </p>
      </section>

      <section className="content-grid">
        <DocumentInput
          text={text}
          setText={setText}
          loading={loading}
          onAnalyze={handleAnalyze}
          onReset={handleReset}
          onExample={handleExample}
        />

        <article className="panel result-panel">
          <div className="section-header">
            <div>
              <p className="eyebrow">분석 결과</p>
              <h2>빠르게 확인할 핵심 포인트</h2>
            </div>
            <span className="sub-badge">5초 안에 핵심 확인</span>
          </div>

          {error ? (
            <div className="message error">{error}</div>
          ) : (
            <div className="message neutral">{summaryLabel}</div>
          )}

          {loading && <div className="message loading">분석 중입니다...</div>}

          {!loading && !error && !hasResult && (
            <div className="empty-state">
              <p>문서를 입력하고 분석하기 버튼을 누르면 결과가 표시됩니다.</p>
              <span>예시 버튼으로 바로 테스트해 보세요.</span>
            </div>
          )}

          {hasResult && (
            <>
              <ResultSummary result={result} />

              <section className="result-section">
                <div className="section-title-row">
                  <h3>핵심 카드</h3>
                  <span>{result.cards?.length || 0}개</span>
                </div>
                <div className="card-grid">
                  {result.cards?.map((card, index) => (
                    <ResultCard key={`${card.category}-${index}`} card={card} />
                  ))}
                </div>
              </section>

              <section className="result-section">
                <div className="section-title-row">
                  <h3>체크리스트</h3>
                  <span>{result.checklist?.length || 0}개</span>
                </div>
                <Checklist items={result.checklist || []} />
              </section>
            </>
          )}
        </article>
      </section>
    </main>
  );
}

export default App;
