const STEPS = [
  {
    n: 1,
    icon: '📂',
    title: '문서 가져오기',
    desc: '파일을 가져오거나 사진을 찍고, 직접 입력도 할 수 있어요.'
  },
  {
    n: 2,
    icon: '⭐',
    title: '요점 확인하기',
    desc: '문요가 꼭 봐야 할 내용 3가지를 먼저 보여줘요.'
  },
  {
    n: 3,
    icon: '💬',
    title: '궁금한 점 물어보기',
    desc: '환불, 비용, 개인정보처럼 궁금한 내용을 바로 물어볼 수 있어요.'
  }
];

function HowToUse({ title = '문요 사용법', dismissible = false, onDismiss }) {
  return (
    <section className="howto">
      <div className="howto-head">
        <h2 className="howto-title">{title}</h2>
        {dismissible && (
          <button type="button" className="howto-close" onClick={onDismiss} aria-label="사용법 닫기">
            ✕
          </button>
        )}
      </div>

      <ol className="howto-list">
        {STEPS.map((step) => (
          <li className="howto-step" key={step.n}>
            <span className="howto-num">{step.n}</span>
            <span className="howto-emoji" aria-hidden="true">{step.icon}</span>
            <span className="howto-text">
              <strong>{step.title}</strong>
              <small>{step.desc}</small>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default HowToUse;
