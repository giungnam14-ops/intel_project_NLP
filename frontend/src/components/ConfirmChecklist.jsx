import { useState } from 'react';

// Simple, action-oriented "confirm before you agree/proceed" lists by doc type.
const TYPE_ITEMS = {
  terms: [
    { label: '비용 조건 확인', keywords: ['비용', '결제', '자동결제', '금액', '요금', '환불', '위약금', '수수료', '원'] },
    { label: '해지/탈회 조건 확인', keywords: ['해지', '탈회', '탈퇴', '취소', '종료'] },
    { label: '개인정보 제공 확인', keywords: ['개인정보', '제3자', '제공', '위탁', '동의'] },
    { label: '책임 제한 확인', keywords: ['책임', '면책', '손해', '배상'] }
  ],
  notice: [
    { label: '신청 기한 확인', keywords: ['신청', '기한', '마감', '이내', '까지', '등록'] },
    { label: '대상 조건 확인', keywords: ['대상', '자격', '조건'] },
    { label: '제출 방법 확인', keywords: ['제출', '접수', '방법'] },
    { label: '장소/일시 확인', keywords: ['장소', '위치', '일시', '날짜', '시간'] }
  ],
  paper: [
    { label: '연구 목적 확인', keywords: ['목적', '연구', '제안'] },
    { label: '핵심 결과 확인', keywords: ['결과', '성능', '향상', '효과'] },
    { label: '한계점 확인', keywords: ['한계', '제한', '부족'] },
    { label: '활용 가능성 확인', keywords: ['활용', '적용', '제안'] }
  ],
  default: [
    { label: '핵심 내용 확인', keywords: [] },
    { label: '주의 조건 확인', keywords: ['주의', '제한', '위험', '불가'] },
    { label: '해야 할 일 확인', keywords: ['해야', '신청', '제출', '확인', '동의'] }
  ]
};

function collectSentences(result) {
  const out = [];
  (result?.cards || []).forEach((card) => card?.original_sentence && out.push(card.original_sentence));
  const kf = result?.key_facts || {};
  ['money', 'dates', 'actions', 'warnings'].forEach((key) => {
    (kf[key] || []).forEach((item) => item?.source_text && out.push(item.source_text));
  });
  (result?.highlights || []).forEach((h) => h?.source_text && out.push(h.source_text));
  (result?.checklist || []).forEach((text) => typeof text === 'string' && out.push(text));
  return out;
}

function findEvidence(sentences, keywords) {
  if (!keywords.length) return sentences[0] || '';
  for (const sentence of sentences) {
    if (keywords.some((keyword) => sentence.includes(keyword))) return sentence;
  }
  return '';
}

function ConfirmChecklist({ result }) {
  const [checked, setChecked] = useState({});
  const [open, setOpen] = useState(null);

  const items = TYPE_ITEMS[result?.document_type] || TYPE_ITEMS.default;
  const sentences = collectSentences(result);
  const rows = items.map((item) => ({ ...item, evidence: findEvidence(sentences, item.keywords) }));
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <section className="result-section">
      <div className="section-title-row">
        <h3>동의/진행 전 확인</h3>
        <span className="count-chip">{doneCount}/{rows.length}</span>
      </div>

      <ul className="confirm-list">
        {rows.map((row, index) => {
          const isOpen = open === index;
          return (
            <li key={row.label} className={`confirm-item${checked[index] ? ' is-done' : ''}`}>
              <div className="confirm-row">
                <label className="confirm-check">
                  <input
                    type="checkbox"
                    checked={Boolean(checked[index])}
                    onChange={() => setChecked((prev) => ({ ...prev, [index]: !prev[index] }))}
                  />
                  <span>{row.label}</span>
                </label>
                <button
                  type="button"
                  className="confirm-toggle"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : index)}
                >
                  {isOpen ? '접기' : '설명'}
                </button>
              </div>
              {isOpen && (
                <p className="confirm-detail">
                  {row.evidence
                    ? `“${row.evidence}”`
                    : '관련 내용을 근거 탭에서 확인해 보세요.'}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ConfirmChecklist;
