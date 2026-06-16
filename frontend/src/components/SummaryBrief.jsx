import { cleanEvidence } from '../utils/evidence';

// Per-document-type fallback templates (each is a 3-line guide). These are the
// safety net so the 핵심 요약 card is NEVER empty, even with no analysis data.
const TYPE_TEMPLATES = {
  contract: [
    '이 문서는 계약 조건을 정리한 문서로 보여요.',
    '금액, 기간, 해지 조건, 특약처럼 나중에 불이익이 생길 수 있는 부분을 먼저 확인하세요.',
    '원본 문서와 함께 근거를 확인하는 것이 좋아요.'
  ],
  terms: [
    '이 문서는 서비스 이용 조건을 설명하는 문서로 보여요.',
    '결제, 환불, 개인정보 제공, 책임 제한 조건을 확인해야 해요.',
    '동의하기 전에 불리한 조건이 있는지 살펴보세요.'
  ],
  notice: [
    '이 문서는 신청이나 안내 내용을 담은 문서로 보여요.',
    '신청 기한, 대상 조건, 제출 방법을 먼저 확인하세요.',
    '놓치면 불이익이 생길 수 있는 항목을 체크해 보세요.'
  ],
  paper: [
    '이 문서는 연구나 분석 내용을 정리한 문서로 보여요.',
    '연구 목적, 핵심 결과, 한계점을 먼저 확인하세요.',
    '자세한 내용은 근거 탭에서 확인할 수 있어요.'
  ],
  default: [
    '문서에서 확인할 내용을 정리했어요.',
    '중요한 조건, 해야 할 일, 불리할 수 있는 문장을 먼저 확인하세요.',
    '자세한 근거는 근거 탭에서 볼 수 있어요.'
  ]
};

function getTemplate(documentType) {
  return TYPE_TEMPLATES[documentType] || TYPE_TEMPLATES.default;
}

// Friendly checkpoint terms from whatever analysis data is present.
function checkpointTerms(result) {
  const kf = result?.key_facts || {};
  const terms = [];
  if (Array.isArray(kf.money) && kf.money.length) terms.push('비용');
  if (Array.isArray(kf.dates) && kf.dates.length) terms.push('기한');
  if (Array.isArray(kf.actions) && kf.actions.length) terms.push('해야 할 일');
  if ((Array.isArray(kf.warnings) && kf.warnings.length)
    || (Array.isArray(result?.highlights) && result.highlights.length)) {
    terms.push('주의 조건');
  }
  return terms.slice(0, 3);
}

// Build a stable 2–3 line summary by combining real data with fallbacks.
function buildLines(result, documentMeta, noisy) {
  const template = getTemplate(result?.document_type);
  const lines = [];

  // Line 1 — what this document is. Prefer the (trimmed) backend summary.
  const summary = cleanEvidence(result?.summary || '');
  lines.push(summary || template[0]);

  // Line 2 — what to check. Prefer real extracted signals.
  const terms = checkpointTerms(result);
  lines.push(terms.length ? `특히 ${terms.join(' · ')} 항목을 먼저 확인하세요.` : template[1]);

  // Line 3 — quality note if the text looks broken, else the type advice.
  if (noisy) {
    lines.push(
      documentMeta?.previewKind === 'pdf'
        ? 'PDF 텍스트가 일부 깨져 있어 원본 문서와 함께 확인하는 것이 좋아요.'
        : '추출된 문장이 일부 부정확할 수 있어 근거 탭과 원본을 함께 확인하세요.'
    );
  } else {
    lines.push(template[2]);
  }

  return lines.slice(0, 3);
}

function SummaryBrief({ result, documentMeta, noisy = false }) {
  const lines = buildLines(result, documentMeta, noisy);

  return (
    <section className="summary-brief">
      <p className="summary-brief-title">핵심 요약</p>
      <ul className="summary-brief-list">
        {lines.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

export default SummaryBrief;
