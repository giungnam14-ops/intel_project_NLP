import AdminFeedback from './AdminFeedback';
import HowToUse from './HowToUse';

function SettingToggle({ label, desc, checked, onChange }) {
  return (
    <label className="setting-row">
      <span className="setting-text">
        <span className="setting-label">{label}</span>
        {desc && <span className="setting-desc">{desc}</span>}
      </span>
      <span className={`switch${checked ? ' is-on' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="switch-knob" aria-hidden="true" />
      </span>
    </label>
  );
}

function SettingsScreen({ settings, onChange, historyCount = 0, onClearHistory, feedbackCount = 0, onClearFeedback }) {
  return (
    <div className="screen settings-screen">
      <header className="screen-bar">
        <div>
          <h1 className="screen-bar-title">설정</h1>
          <p className="screen-bar-sub">앱 환경설정 · 안내</p>
        </div>
        <span className="brand-chip">문요</span>
      </header>

      <section className="settings-group">
        <h2 className="settings-group-title">사용 방법</h2>
        <HowToUse title="문요 3단계로 쓰기" />
        <div className="card settings-card info-text">
          <ul className="howto-points">
            <li>파일/사진을 가져오면 문요가 텍스트를 추출합니다.</li>
            <li>추출된 내용은 분석 전 확인하고 수정할 수 있습니다.</li>
            <li>결과는 요점·물어보기·근거·체크 탭으로 나뉩니다.</li>
            <li>파일 원본은 서버에 저장하지 않습니다.</li>
          </ul>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group-title">분석 환경설정</h2>
        <div className="card settings-card">
          <SettingToggle
            label="분석 전 OCR 결과 확인하기"
            desc="사진에서 추출한 텍스트를 분석 전에 검토하도록 안내합니다."
            checked={settings.confirmOcr}
            onChange={(value) => onChange('confirmOcr', value)}
          />
          <SettingToggle
            label="결과 원문 짧게 보기"
            desc="핵심 카드의 원문을 더 짧게 접어 보여줍니다."
            checked={settings.shortSource}
            onChange={(value) => onChange('shortSource', value)}
          />
          <SettingToggle
            label="큰 글씨 모드"
            desc="화면 전체의 글씨 크기를 키웁니다."
            checked={settings.largeText}
            onChange={(value) => onChange('largeText', value)}
          />
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group-title">앱 정보</h2>
        <div className="card settings-card">
          <div className="info-row"><span>앱 이름</span><strong>문요</strong></div>
          <div className="info-row"><span>버전</span><strong>1.0.0</strong></div>
          <div className="info-row"><span>분석 엔진</span><strong>문서 요점 체크 AI</strong></div>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group-title">기록 관리</h2>
        <div className="card settings-card">
          <div className="info-row">
            <span>저장된 최근 분석</span>
            <strong>{historyCount}개</strong>
          </div>
          <button
            type="button"
            className="settings-danger-button"
            onClick={onClearHistory}
            disabled={historyCount === 0}
          >
            최근 분석 기록 모두 삭제
          </button>
          <p className="settings-danger-note">브라우저에 저장된 분석 기록만 삭제됩니다.</p>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group-title">피드백 기록 관리</h2>
        <div className="card settings-card">
          <div className="info-row">
            <span>저장된 피드백</span>
            <strong>{feedbackCount}개</strong>
          </div>
          <button
            type="button"
            className="settings-danger-button"
            onClick={onClearFeedback}
            disabled={feedbackCount === 0}
          >
            피드백 기록 모두 삭제
          </button>
          <p className="settings-danger-note">피드백은 이 브라우저에만 저장됩니다.</p>
        </div>
      </section>

      <AdminFeedback />

      <section className="settings-group">
        <h2 className="settings-group-title">개인정보 안내</h2>
        <div className="card settings-card info-text">
          <p>
            파일은 서버에 저장하지 않으며, 추출된 텍스트만 분석에 사용합니다.
            분석 설정과 분석 기록은 이 기기의 브라우저에만 저장되고, 원본 파일은 저장하지 않습니다.
          </p>
        </div>
      </section>

      <section className="settings-group">
        <h2 className="settings-group-title">OCR 안내</h2>
        <div className="card settings-card info-text">
          <p>
            사진 속 문서는 OCR로 텍스트를 추출합니다. 밝은 곳에서 문서가 화면에 꽉 차도록
            촬영하면 인식 품질이 좋아지며, 인식된 문장은 분석 전에 직접 수정할 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  );
}

export default SettingsScreen;
