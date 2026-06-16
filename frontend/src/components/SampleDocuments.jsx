import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { MODE_LABEL } from '../utils/modes';

function SampleDocuments({ onTry }) {
  return (
    <section className="home-section sample-section">
      <h2 className="home-section-title">샘플로 체험하기</h2>
      <p className="sample-intro">파일이 없어도 바로 분석을 체험해 볼 수 있어요.</p>

      <div className="sample-list">
        {SAMPLE_DOCUMENTS.map((sample) => (
          <article className="sample-card" key={sample.id}>
            <div className="sample-card-head">
              <span className="sample-emoji" aria-hidden="true">{sample.emoji}</span>
              <span className="sample-title">{sample.title}</span>
            </div>
            <p className="sample-desc">{sample.desc}</p>
            <div className="sample-card-foot">
              <span className="sample-mode">추천 모드 · {MODE_LABEL[sample.mode]}</span>
              <button type="button" className="sample-try" onClick={() => onTry(sample)}>
                체험 분석
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SampleDocuments;
