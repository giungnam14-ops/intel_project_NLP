// Plain-language explanations for common contract/terms vocabulary.
// Longer terms first so the more specific one matches before a substring.
export const GLOSSARY = [
  { term: '위약벌', desc: '계약을 어겼을 때 벌금처럼 무는 돈이에요. 위약금과 별도로 더 물 수도 있어요.' },
  { term: '지체상금', desc: '약속한 기한보다 늦어졌을 때 하루씩 무는 돈이에요.' },
  { term: '청약철회', desc: '계약을 무르고 취소할 수 있는 권리예요.' },
  { term: '손해배상', desc: '상대방에게 끼친 손해만큼 물어주는 거예요.' },
  { term: '귀책사유', desc: '잘못의 책임이 누구에게 있는지를 뜻해요.' },
  { term: '자동결제', desc: '따로 결제하지 않아도 정해진 날에 자동으로 돈이 빠져나가요.' },
  { term: '제3자', desc: '나와 계약 상대(회사)가 아닌 다른 사람·회사예요.' },
  { term: '위약금', desc: '약속을 어겼을 때 무는 돈이에요.' },
  { term: '면책', desc: '문제가 생겨도 책임을 지지 않는다는 뜻이에요.' },
  { term: '보증금', desc: '계약을 보장하려고 미리 맡기는 돈이에요. 보통 끝나면 돌려받아요.' },
  { term: '중도금', desc: '계약금과 잔금 사이에 내는 중간 금액이에요.' },
  { term: '잔금', desc: '마지막에 치르는 나머지 금액이에요.' },
  { term: '특약', desc: '일반 조건과 별개로 따로 정한 약속이에요.' },
  { term: '갱신', desc: '계약 기간을 다시 연장하는 거예요.' },
  { term: '연체', desc: '정해진 날짜보다 늦게 내는 거예요.' },
  { term: '해지', desc: '계약을 중간에 끝내는 거예요.' },
  { term: '과실', desc: '부주의로 인한 잘못이에요.' },
  { term: '약관', desc: '서비스 이용 조건을 미리 정해 둔 규칙이에요.' }
];

// Return the glossary entries whose term actually appears in the text.
export function findTerms(text) {
  const value = String(text || '');
  if (!value) return [];
  const found = [];
  const seen = new Set();
  for (const entry of GLOSSARY) {
    if (!seen.has(entry.term) && value.includes(entry.term)) {
      seen.add(entry.term);
      found.push(entry);
    }
  }
  return found;
}
