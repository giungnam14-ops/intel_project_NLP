import SampleDocuments from './SampleDocuments';

function ExperienceScreen({ onTrySample }) {
  return (
    <div className="screen experience-screen">
      <header className="screen-bar">
        <div>
          <h1 className="screen-bar-title">체험</h1>
          <p className="screen-bar-sub">샘플로 먼저 분석해 보기</p>
        </div>
        <span className="brand-chip">문요</span>
      </header>

      <SampleDocuments onTry={onTrySample} />
    </div>
  );
}

export default ExperienceScreen;
