import SampleDocuments from './SampleDocuments';

const DOC_TYPES = [
  { emoji: '📄', title: '약관/동의서', desc: '결제, 환불, 개인정보, 해지 조건을 확인할 수 있어요.' },
  { emoji: '📑', title: '계약서/약정서', desc: '금액, 기간, 위약금, 특약, 서명 조건을 확인할 수 있어요.' },
  { emoji: '📢', title: '공지문/안내문', desc: '신청 기한, 대상 조건, 제출 방법, 장소/일시를 확인할 수 있어요.' },
  { emoji: '🔬', title: '논문/보고서', desc: '연구 목적, 핵심 결과, 한계점을 확인할 수 있어요.' }
];

function ExperienceScreen({ onTrySample }) {
  return (
    <div className="screen experience-screen">
      <header className="screen-bar">
        <div>
          <h1 className="screen-bar-title">샘플로 문요 체험하기</h1>
          <p className="screen-bar-sub">파일 없이 분석을 미리 확인</p>
        </div>
        <span className="brand-chip">문요</span>
      </header>

      <p className="experience-intro">
        파일을 올리지 않아도 문요가 어떤 문서를 어떻게 분석하는지 확인할 수 있어요.
      </p>

      <section className="home-section doctype-section">
        <h2 className="home-section-title">이런 문서를 다뤄요</h2>
        <div className="doctype-list">
          {DOC_TYPES.map((type) => (
            <article className="doctype-card" key={type.title}>
              <span className="doctype-emoji" aria-hidden="true">{type.emoji}</span>
              <div className="doctype-text">
                <h3>{type.title}</h3>
                <p>{type.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <SampleDocuments onTry={onTrySample} />
    </div>
  );
}

export default ExperienceScreen;
