// Analysis "lens" modes. These reorder how results are presented on the
// frontend — no backend change. Default is "빠른 요약" (quick).

export const ANALYSIS_MODES = [
  { key: 'quick', label: '전체 분석', desc: '문서 전체를 한눈에 요약해요' },
  { key: 'money', label: '돈/환불 중심', desc: '결제·수수료·환불·위약금·보증금' },
  { key: 'privacy', label: '개인정보 중심', desc: '수집·제3자 제공·보관·동의' },
  { key: 'contract', label: '계약 조건 중심', desc: '기간·해지·특약·책임·서명' },
  { key: 'deadline', label: '마감/제출 중심', desc: '기한·제출·준비물·장소' },
  { key: 'paper', label: '논문 핵심 중심', desc: '목적·방법·결과·한계' }
];

export const MODE_LABEL = Object.fromEntries(ANALYSIS_MODES.map((m) => [m.key, m.label]));

export function modeLabel(key) {
  return MODE_LABEL[key] || MODE_LABEL.quick;
}

// TopPriorities theme ordering per mode (themes earlier = higher priority).
// Empty array = keep the natural/default order (quick).
export const MODE_THEME_PRIORITY = {
  quick: [],
  money: ['money', 'refund', 'cancel', 'restriction'],
  privacy: ['privacy', 'restriction', 'action'],
  contract: ['money', 'date', 'cancel', 'special', 'action', 'liability'],
  deadline: ['date', 'action', 'restriction'],
  paper: ['default', 'restriction', 'action']
};

// SummaryBrief focus phrase per mode (used in line 2 when not quick).
export const MODE_FOCUS = {
  money: '비용·환불·위약금',
  privacy: '개인정보 제공·보관·동의',
  contract: '금액·기간·해지·특약·서명',
  deadline: '기한·대상·제출·준비물',
  paper: '연구 목적·결과·한계'
};

// ConfirmChecklist item ordering keywords per mode (labels matching come first).
export const MODE_ITEM_KEYWORDS = {
  money: ['비용', '결제', '금액', '환불', '위약', '수수료', '보증금'],
  privacy: ['개인정보', '제공', '책임'],
  contract: ['금액', '기간', '해지', '특약', '서명', '위약'],
  deadline: ['기한', '신청', '제출', '대상', '장소', '준비물', '일시'],
  paper: ['연구', '결과', '한계', '목적']
};

// Recommended question chips per mode.
export const MODE_QUESTIONS = {
  quick: ['돈 내야 하는 부분 알려줘', '내가 해야 할 일 알려줘', '불리한 조건 있어?', '근거 문장 보여줘'],
  money: ['돈 내야 하는 부분 알려줘', '환불 조건 알려줘', '위약금 있어?'],
  privacy: ['내 정보가 어디에 제공돼?', '보관 기간 있어?', '동의해야 하는 항목 알려줘'],
  contract: ['금액 조건 알려줘', '계약 기간이 어떻게 돼?', '해지하면 불이익 있어?'],
  deadline: ['마감일이 있어?', '어떻게 제출해?', '준비물이 뭐야?'],
  paper: ['연구 목적이 뭐야?', '핵심 결과 알려줘', '한계점이 있어?']
};

export function modeQuestions(key) {
  return MODE_QUESTIONS[key] || MODE_QUESTIONS.quick;
}
