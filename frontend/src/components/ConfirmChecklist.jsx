import { useState } from 'react';
import { buildEvidence } from '../utils/evidence';
import { MODE_ITEM_KEYWORDS } from '../utils/modes';

// "최종 확인 목록" item sets per document type. Each item explains WHY it
// matters and which keywords locate its evidence in the document.
const TYPE_ITEMS = {
  terms: [
    { label: '비용/결제 조건 확인', why: '결제 금액과 시점, 자동결제 여부를 확인하세요.', keywords: ['결제', '자동결제', '비용', '금액', '요금', '원'] },
    { label: '환불 조건 확인', why: '환불이 되는지, 조건과 기간을 확인하세요.', keywords: ['환불'] },
    { label: '개인정보 제공 범위 확인', why: '내 정보가 누구에게, 어떤 목적으로 제공되는지 확인하세요.', keywords: ['개인정보', '제3자', '제공', '위탁'] },
    { label: '책임 제한 조항 확인', why: '문제 발생 시 회사의 책임이 제한될 수 있어요.', keywords: ['책임', '면책', '손해', '배상'] },
    { label: '해지/탈퇴 조건 확인', why: '그만두거나 해지할 때 불이익이 있는지 확인하세요.', keywords: ['해지', '탈퇴', '탈회', '취소', '종료'] },
    { label: '이용 제한 조건 확인', why: '특정 조건에서 이용이 제한될 수 있어요.', keywords: ['제한', '금지', '정지'] }
  ],
  contract: [
    { label: '금액 조건 확인', why: '계약금, 중도금, 잔금, 보증금 등 금액을 확인하세요.', keywords: ['계약금', '중도금', '잔금', '보증금', '월세', '대금', '금액', '수수료'] },
    { label: '계약 기간 확인', why: '시작일, 종료일, 갱신 조건을 확인하세요.', keywords: ['계약기간', '계약 기간', '임대차', '시작', '종료', '갱신', '기간'] },
    { label: '해지/위약 조건 확인', why: '해지할 때 위약금이나 불이익이 있는지 확인하세요.', keywords: ['해지', '해제', '위약금', '손해배상', '중도해지'] },
    { label: '특약 사항 확인', why: '일반 조건과 다른 특별한 약속이 있는지 확인하세요.', keywords: ['특약', '별도 약정', '단서'] },
    { label: '서명/날인 확인', why: '계약 효력을 위한 서명·날인 항목을 확인하세요.', keywords: ['서명', '날인', '인감', '기명'] }
  ],
  notice: [
    { label: '신청 기한 확인', why: '언제까지 신청·제출해야 하는지 확인하세요.', keywords: ['신청', '기한', '마감', '이내', '까지', '등록', '접수'] },
    { label: '대상 조건 확인', why: '참여·신청 대상과 자격 조건을 확인하세요.', keywords: ['대상', '자격', '조건'] },
    { label: '제출 방법 확인', why: '어디에 어떻게 제출·접수하는지 확인하세요.', keywords: ['제출', '접수', '방법', '제출처'] },
    { label: '준비물/서류 확인', why: '필요한 준비물이나 서류를 확인하세요.', keywords: ['준비물', '지참', '서류', '구비'] },
    { label: '장소/일시 확인', why: '행사·방문 장소와 일시를 확인하세요.', keywords: ['장소', '위치', '주소', '일시', '날짜', '시간'] }
  ],
  paper: [
    { label: '연구 목적 확인', why: '이 연구가 무엇을 하려는지 확인하세요.', keywords: ['목적', '연구', '제안'] },
    { label: '핵심 결과 확인', why: '주요 결과와 성능을 확인하세요.', keywords: ['결과', '성능', '향상', '효과'] },
    { label: '한계점 확인', why: '연구의 한계나 제약을 확인하세요.', keywords: ['한계', '제한', '부족'] },
    { label: '활용 가능성 확인', why: '어디에 활용·적용할 수 있는지 확인하세요.', keywords: ['활용', '적용', '제안'] }
  ],
  default: [
    { label: '중요한 조건 확인', why: '비용·기간·제한처럼 중요한 조건을 확인하세요.', keywords: ['조건', '제한', '비용', '기간', '금액', '원'] },
    { label: '해야 할 일 확인', why: '신청·제출·서명처럼 직접 해야 할 일을 확인하세요.', keywords: ['해야', '신청', '제출', '서명', '동의', '확인', '취소'] },
    { label: '불리한 조건 확인', why: '불리하거나 주의가 필요한 조건을 확인하세요.', keywords: ['불리', '위험', '주의', '제한', '불가', '위약금', '책임'] },
    { label: '원문 근거 확인', why: '근거 탭에서 원문을 함께 확인하세요.', keywords: [] }
  ]
};

// Content signals used to correct a misclassified document type (e.g. a 회원약관
// PDF that the backend labeled as 공지문). Picks the set that matches the text.
const TYPE_SIGNALS = {
  terms: ['환불', '개인정보', '제3자', '책임', '해지', '자동결제', '결제', '이용약관', '동의', '면책'],
  contract: ['계약', '약정', '보증금', '계약금', '중도금', '잔금', '위약금', '특약', '임대차', '손해배상', '날인', '임대인', '임차인'],
  notice: ['신청', '접수', '대상', '자격', '제출', '마감', '장소', '일시', '준비물', '지참', '등록'],
  paper: ['연구', '실험', '결과', '성능', '한계', '방법', '데이터', '논문', '보고서']
};

function collectSentences(result) {
  const out = [];
  (result?.cards || []).forEach((card) => card?.original_sentence && out.push(card.original_sentence));
  const kf = result?.key_facts || {};
  ['money', 'dates', 'actions', 'warnings'].forEach((key) => {
    (kf[key] || []).forEach((item) => item?.source_text && out.push(item.source_text));
  });
  (result?.highlights || []).forEach((h) => h?.source_text && out.push(h.source_text));
  return out;
}

function findEvidence(sentences, keywords) {
  if (!keywords.length) return '';
  for (const sentence of sentences) {
    if (keywords.some((keyword) => sentence.includes(keyword))) return sentence;
  }
  return '';
}

// Decide which item set fits best — content signals override a wrong type.
function chooseType(result, sentences) {
  const joined = sentences.join(' ');
  const scores = {};
  for (const type of Object.keys(TYPE_SIGNALS)) {
    scores[type] = TYPE_SIGNALS[type].filter((kw) => joined.includes(kw)).length;
  }

  const max = Math.max(...Object.values(scores));
  if (max === 0) {
    return TYPE_ITEMS[result?.document_type] ? result.document_type : 'default';
  }

  let best = 'default';
  let bestScore = -1;
  for (const type of ['terms', 'contract', 'notice', 'paper']) {
    if (scores[type] > bestScore) {
      bestScore = scores[type];
      best = type;
    }
  }
  // Keep the backend type when it ties the best content score.
  const dt = result?.document_type;
  if (dt && scores[dt] === bestScore) best = dt;
  return best;
}

function ConfirmChecklist({ result, analysisMode = 'quick', onShowInDocument }) {
  const [checked, setChecked] = useState({});

  const sentences = collectSentences(result);
  const effectiveType = chooseType(result, sentences);
  const baseItems = TYPE_ITEMS[effectiveType] || TYPE_ITEMS.default;
  const isUnknown = effectiveType === 'default';

  // Reorder items so the selected mode's relevant items come first.
  const modeKeywords = MODE_ITEM_KEYWORDS[analysisMode] || [];
  const items = modeKeywords.length
    ? [...baseItems].sort(
        (a, b) =>
          (modeKeywords.some((kw) => b.label.includes(kw)) ? 1 : 0)
          - (modeKeywords.some((kw) => a.label.includes(kw)) ? 1 : 0)
      )
    : baseItems;

  const rows = items.map((item) => {
    const evidence = buildEvidence(findEvidence(sentences, item.keywords));
    return { ...item, evidence };
  });

  const doneCount = Object.values(checked).filter(Boolean).length;
  const allDone = doneCount >= rows.length && rows.length > 0;

  const TITLES = {
    terms: '동의 전 확인할 것',
    contract: '계약 전 확인할 것',
    notice: '신청 전 확인할 것',
    paper: '읽기 전 확인할 것',
    default: '확인할 것'
  };
  const title = TITLES[effectiveType] || TITLES.default;

  return (
    <section className="result-section">
      <div className="section-title-row">
        <h3>{title}</h3>
        <span className="count-chip">확인 완료 {doneCount}/{rows.length}</span>
      </div>

      <p className="confirm-intro">
        문서에서 놓치면 안 되는 항목이에요. 확인한 항목은 체크해 둘 수 있어요.
      </p>
      {isUnknown && (
        <p className="confirm-intro confirm-intro-note">
          문서 유형을 확실히 판단하기 어려워 공통 확인 항목을 보여드려요.
        </p>
      )}

      <ul className="confirm-list">
        {rows.map((row, index) => {
          const hasEvidence = row.evidence.quality === 'good' && Boolean(row.evidence.cleaned);
          return (
            <li key={row.label} className={`confirm-item${checked[index] ? ' is-done' : ''}`}>
              <label className="confirm-check">
                <input
                  type="checkbox"
                  checked={Boolean(checked[index])}
                  onChange={() => setChecked((prev) => ({ ...prev, [index]: !prev[index] }))}
                />
                <span className="confirm-label">{row.label}</span>
              </label>

              <p className="confirm-why">{row.why}</p>

              {hasEvidence ? (
                onShowInDocument && (
                  <button
                    type="button"
                    className="evidence-link"
                    onClick={() => onShowInDocument({
                      title: row.label,
                      text: row.evidence.cleaned,
                      rawTextForMatch: row.evidence.raw,
                      source: row.evidence.cleaned,
                      quality: 'good'
                    })}
                  >
                    문서에서 보기
                  </button>
                )
              ) : row.evidence.raw ? (
                <div className="confirm-needsource">
                  {onShowInDocument && (
                    <button
                      type="button"
                      className="evidence-link is-muted"
                      onClick={() => onShowInDocument({
                        title: row.label,
                        text: '',
                        rawTextForMatch: row.evidence.raw,
                        source: row.evidence.raw,
                        quality: 'low'
                      })}
                    >
                      원본 확인 필요
                    </button>
                  )}
                  <span className="confirm-needsource-desc">추출 텍스트가 깨져 정확한 위치 표시가 어려워요.</span>
                </div>
              ) : (
                <p className="confirm-noevidence">
                  관련 근거를 정확히 찾지 못했어요. 근거 탭에서 원문을 함께 확인해 주세요.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {allDone && (
        <p className="confirm-done">
          필수 확인 항목을 모두 확인했어요. 그래도 원문은 함께 확인해 주세요.
        </p>
      )}

      <p className="confirm-foot">체크박스는 내가 직접 확인했다는 표시예요. 서버에 저장되지 않아요.</p>
    </section>
  );
}

export default ConfirmChecklist;
