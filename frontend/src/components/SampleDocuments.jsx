import { useState } from 'react';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocuments';
import { MODE_LABEL } from '../utils/modes';

const PREVIEW_LINES = 6;

function previewOf(text) {
  const lines = String(text || '').split('\n');
  const head = lines.slice(0, PREVIEW_LINES).join('\n');
  return lines.length > PREVIEW_LINES ? `${head}\n…` : head;
}

function SampleDocuments({ onTry }) {
  const [openId, setOpenId] = useState(null);

  return (
    <section className="home-section sample-section">
      <h2 className="home-section-title">샘플로 체험하기</h2>
      <p className="sample-intro">파일이 없어도 바로 분석을 체험해 볼 수 있어요.</p>

      <div className="sample-list">
        {SAMPLE_DOCUMENTS.map((sample) => {
          const open = openId === sample.id;
          return (
            <article className="sample-card" key={sample.id}>
              <div className="sample-card-head">
                <span className="sample-emoji" aria-hidden="true">{sample.emoji}</span>
                <span className="sample-title">{sample.title} 샘플</span>
              </div>
              <p className="sample-desc">{sample.desc}</p>
              <p className="sample-mode-line">추천 모드 · {MODE_LABEL[sample.mode]}</p>

              <div className="sample-card-actions">
                <button
                  type="button"
                  className="sample-preview-toggle"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : sample.id)}
                >
                  {open ? '예시 접기' : '예시 문서 보기'}
                </button>
                <button type="button" className="sample-try" onClick={() => onTry(sample)}>
                  체험 분석
                </button>
              </div>

              {open && (
                <div className="sample-preview">
                  <p className="sample-preview-label">예시 문서</p>
                  <p className="sample-preview-text">{previewOf(sample.text)}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default SampleDocuments;
