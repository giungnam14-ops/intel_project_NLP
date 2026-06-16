import { useEffect, useRef, useState } from 'react';
import { analyzeDocument } from './api/analyze';
import BottomNav from './components/BottomNav';
import DocumentInput from './components/DocumentInput';
import HomeScreen from './components/HomeScreen';
import ModeSelector from './components/ModeSelector';
import ResultView from './components/ResultView';
import SettingsScreen from './components/SettingsScreen';
import { addHistoryRecord, clearHistory, deleteHistoryRecord, loadHistory } from './utils/history';

function makeRecordId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

const SETTINGS_KEY = 'munyo-settings';
const DEFAULT_SETTINGS = { confirmOcr: true, shortSource: false, largeText: false };

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function App() {
  const [tab, setTab] = useState('home');
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(loadSettings);
  const [autoTrigger, setAutoTrigger] = useState(null); // 'file' | 'camera' | null
  // Bumped to remount DocumentInput (reset its choose/direct/imported state).
  const [inputKey, setInputKey] = useState(0);
  // Set when the imported document came from low-quality OCR (softens security detection).
  const [ocrLowQuality, setOcrLowQuality] = useState(false);
  // Imported document metadata (incl. object-URL preview). App owns the URL so
  // it survives into the result screen; revoked on replace / reset / unmount.
  const [docMeta, setDocMeta] = useState(null);
  const previewUrlRef = useRef(null);
  // Recent analyses (localStorage only). savedView marks a restored record.
  const [history, setHistory] = useState(loadHistory);
  const [savedView, setSavedView] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('quick');

  const hasResult = Boolean(result);

  // Persist settings locally (browser only — no backend, no account).
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // localStorage may be unavailable (private mode); settings stay in-memory.
    }
  }, [settings]);

  // Large-text mode toggles a root class so rem-based sizing scales up.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('is-large-text', settings.largeText);
  }, [settings.largeText]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Revoke any object URL we currently hold for a document preview.
  const revokePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const clearDoc = () => {
    revokePreview();
    setDocMeta(null);
    setOcrLowQuality(false);
  };

  const handleExample = (type) => {
    setText(SAMPLE_DOCUMENTS[type]);
    setError('');
    setResult(null);
    setSavedView(false);
    clearDoc();
  };

  // DocumentInput reports the imported document's metadata (or null when cleared).
  const handleDocMeta = (meta) => {
    const nextUrl = meta?.previewUrl || null;
    if (previewUrlRef.current && previewUrlRef.current !== nextUrl) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = nextUrl;
    setDocMeta(meta || null);
    setOcrLowQuality(meta?.status === 'review');
  };

  // Revoke the held preview URL when the app unmounts.
  useEffect(() => revokePreview, []);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('분석할 문서를 먼저 입력해 주세요.');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await analyzeDocument(text, ocrLowQuality, docMeta?.name || '');
      setResult(data);
      setSavedView(false);
      // Auto-save to recent history (localStorage). Never blocks the result.
      try {
        const next = addHistoryRecord({
          id: makeRecordId(),
          createdAt: new Date().toISOString(),
          title: docMeta?.name || '직접 입력한 문서',
          result: data,
          extractedText: text,
          documentMeta: docMeta,
          analysisMode
        });
        setHistory(next);
      } catch (saveErr) {
        console.warn('[문요] 분석 기록 저장 중 문제가 발생했어요.', saveErr);
      }
    } catch (err) {
      setResult(null);
      setError(err.message || '분석 중 오류가 발생했습니다. FastAPI 서버가 실행 중인지 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Restore a saved record into the result view (no original file preview).
  const handleRestore = (record) => {
    if (!record?.result) return;
    revokePreview();
    setDocMeta(record.documentMeta || null);
    setOcrLowQuality(false);
    setText(record.extractedText || '');
    setResult(record.result);
    setAnalysisMode(record.analysisMode || 'quick');
    setError('');
    setSavedView(true);
    setTab('analyze');
  };

  const handleDeleteRecord = (record) => {
    if (!record?.id) return;
    if (!window.confirm(`'${record.title}' 기록을 삭제할까요?`)) return;
    setHistory(deleteHistoryRecord(record.id));
  };

  const handleClearHistory = () => {
    if (!window.confirm('최근 분석 기록을 모두 삭제할까요?')) return;
    setHistory(clearHistory());
  };

  const handleReset = () => {
    setText('');
    setResult(null);
    setError('');
    setSavedView(false);
    clearDoc();
    setInputKey((key) => key + 1);
  };

  // "새 문서 분석하기" — clear the result and return to a fresh input.
  const handleNewAnalysis = () => {
    setResult(null);
    setError('');
    setText('');
    setSavedView(false);
    clearDoc();
    setInputKey((key) => key + 1);
    setTab('analyze');
  };

  const goAnalyze = () => {
    setTab('analyze');
  };

  const startWithPicker = (which) => {
    setResult(null);
    setError('');
    setSavedView(false);
    setTab('analyze');
    setAutoTrigger(which);
  };

  return (
    <div className="app-viewport">
      <div className="app-frame">
        <main className="app-main">
          {tab === 'home' && (
            <HomeScreen
              onStart={goAnalyze}
              onImport={() => startWithPicker('file')}
              onCamera={() => startWithPicker('camera')}
              history={history}
              onRestore={handleRestore}
              onDeleteRecord={handleDeleteRecord}
            />
          )}

          {tab === 'analyze' && (
            <div className="screen analyze-screen">
              <header className="screen-bar">
                <div>
                  <h1 className="screen-bar-title">문서 분석</h1>
                  <p className="screen-bar-sub">
                    {hasResult ? '분석이 끝났어요' : '문서를 입력하고 분석하세요'}
                  </p>
                </div>
                <span className="brand-chip">문요</span>
              </header>

              {hasResult && !loading ? (
                <ResultView
                  result={result}
                  shortSource={settings.shortSource}
                  documentText={text}
                  documentMeta={docMeta}
                  savedView={savedView}
                  analysisMode={analysisMode}
                  onNew={handleNewAnalysis}
                />
              ) : (
                <>
                  {error && (
                    <div className="banner-error" role="alert">
                      <span className="banner-error-icon" aria-hidden="true">!</span>
                      <span>{error}</span>
                    </div>
                  )}
                  <ModeSelector value={analysisMode} onChange={setAnalysisMode} />
                  <DocumentInput
                    key={inputKey}
                    text={text}
                    setText={setText}
                    loading={loading}
                    onAnalyze={handleAnalyze}
                    onReset={handleReset}
                    onExample={handleExample}
                    confirmOcr={settings.confirmOcr}
                    autoTrigger={autoTrigger}
                    onAutoTriggerHandled={() => setAutoTrigger(null)}
                    onDocMeta={handleDocMeta}
                  />
                </>
              )}
            </div>
          )}

          {tab === 'settings' && (
            <SettingsScreen
              settings={settings}
              onChange={updateSetting}
              historyCount={history.length}
              onClearHistory={handleClearHistory}
            />
          )}
        </main>

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  );
}

export default App;
