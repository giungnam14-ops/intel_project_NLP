// Toxic-clause detection + a 0–100 risk score, computed on the frontend from the
// analysis result (no backend). Each pattern carries a weight and a plain-language
// reason; the score is the capped sum of matched weights.

const TOXIC_CLAUSES = [
  { key: 'norefund', weight: 20, label: '환불 제한', why: '환불이 안 되거나 크게 제한될 수 있어요.', re: /환불(?:이|은|되지|\s*불가|\s*제한|\s*어려)/ },
  { key: 'autopay', weight: 18, label: '자동결제', why: '해지하기 전까지 매달 자동으로 결제될 수 있어요.', re: /자동\s*결제|정기\s*결제/ },
  { key: 'unilateral', weight: 16, label: '일방적 변경', why: '사전 안내 없이 조건이 바뀌거나 중단될 수 있어요.', re: /(?:임의로|일방적|사전\s*(?:고지|통지|동의)?\s*없이|별도\s*고지\s*없이)/ },
  { key: 'liability', weight: 16, label: '책임 제한·면책', why: '문제가 생겨도 상대방이 책임을 지지 않을 수 있어요.', re: /면책|책임(?:을|이)?\s*(?:지지\s*않|제한|면제)/ },
  { key: 'penalty', weight: 16, label: '위약금', why: '중도 해지 시 위약금을 물 수 있어요.', re: /위약금|위약벌/ },
  { key: 'thirdparty', weight: 14, label: '제3자 정보 제공', why: '내 개인정보가 제3자에게 넘어갈 수 있어요.', re: /제\s*3\s*자.*제공|제3자.*제공/ },
  { key: 'consent', weight: 12, label: '동의 간주', why: '명시적으로 거부하지 않으면 동의한 것으로 볼 수 있어요.', re: /동의(?:한\s*것으로\s*간주|\s*간주)|묵시적\s*동의/ },
  { key: 'damages', weight: 10, label: '손해배상', why: '손해배상 책임이 부과될 수 있어요.', re: /손해\s*배상/ },
  { key: 'autorenew', weight: 10, label: '자동 갱신', why: '별도 조치가 없으면 자동으로 갱신돼요.', re: /자동\s*(?:연장|갱신)/ },
  { key: 'fee', weight: 8, label: '수수료', why: '별도의 수수료가 부과될 수 있어요.', re: /수수료/ }
];

function gatherTexts(result) {
  const kf = result?.key_facts || {};
  const texts = [];
  if (result?.summary) texts.push(result.summary);
  (Array.isArray(result?.highlights) ? result.highlights : []).forEach((h) => h?.source_text && texts.push(h.source_text));
  (Array.isArray(result?.cards) ? result.cards : []).forEach((c) => c?.original_sentence && texts.push(c.original_sentence));
  ['money', 'dates', 'actions', 'warnings'].forEach((groupKey) =>
    (Array.isArray(kf[groupKey]) ? kf[groupKey] : []).forEach((fact) => fact?.source_text && texts.push(fact.source_text)));
  return texts;
}

export function computeRisk(result) {
  const texts = gatherTexts(result);
  const corpus = texts.join('  ');

  let score = 0;
  const clauses = [];
  for (const clause of TOXIC_CLAUSES) {
    if (clause.re.test(corpus)) {
      score += clause.weight;
      const evidence = texts.find((t) => clause.re.test(t)) || '';
      clauses.push({ key: clause.key, label: clause.label, why: clause.why, evidence });
    }
  }

  score = Math.min(100, score);
  const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : score > 0 ? 'low' : 'none';
  return { score, level, clauses };
}

export const RISK_LEVEL_TEXT = {
  high: '불리할 수 있는 조건이 여러 개 있어요. 꼭 확인하세요.',
  medium: '주의할 조건이 일부 있어요.',
  low: '큰 독소조항은 적지만 확인은 필요해요.',
  none: '특별히 불리한 독소조항은 발견되지 않았어요. 그래도 원문은 확인해 주세요.'
};
