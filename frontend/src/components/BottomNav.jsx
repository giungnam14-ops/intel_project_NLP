const TABS = [
  { key: 'home', label: '홈', icon: '🏠' },
  { key: 'analyze', label: '분석', icon: '📝' },
  { key: 'experience', label: '체험', icon: '✨' },
  { key: 'history', label: '기록', icon: '🕘' },
  { key: 'settings', label: '설정', icon: '⚙️' }
];

function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav" aria-label="앱 내비게이션">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`nav-item${active === tab.key ? ' is-active' : ''}`}
          onClick={() => onChange(tab.key)}
          aria-current={active === tab.key ? 'page' : undefined}
        >
          <span className="nav-icon" aria-hidden="true">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;
