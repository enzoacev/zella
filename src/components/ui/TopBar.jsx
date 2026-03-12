import { Btn, Badge } from './primitives'

export function TopBar({ logo, tabs, activeTab, onTabChange, right }) {
  return (
    <div className="tbar">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, marginRight: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9, background: 'var(--p)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 13, color: '#fff' }}>
            {logo.icon}
          </span>
        </div>
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, color: '#fff', letterSpacing: '.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {logo.name}
          </p>
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {logo.sub}
          </p>
        </div>
      </div>

      {/* Tabs */}
      {tabs.map(t => (
        <button
          key={t.id}
          className={`ttab ${activeTab === t.id ? 'on' : ''}`}
          onClick={() => onTabChange(t.id)}
        >
          {t.icon} {t.label}
        </button>
      ))}

      {/* Right slot */}
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        {right}
      </div>
    </div>
  )
}
