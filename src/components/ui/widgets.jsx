import { useRef } from 'react'

// ─── QR CODE (SVG) ────────────────────────────────────────────────────────────
export function QRCode({ value, size = 120, color = '#1A1714' }) {
  const h = value.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)
  const cells = Array.from({ length: 49 }, (_, i) => {
    const x = i % 7, y = Math.floor(i / 7)
    const corner = (x < 2 && y < 2) || (x > 4 && y < 2) || (x < 2 && y > 4)
    return corner || ((Math.abs(h * (i + 13)) % 3) !== 0)
  })
  const c = size / 7
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {cells.map((on, i) => on && (
        <rect key={i} x={(i % 7) * c + .5} y={Math.floor(i / 7) * c + .5} width={c - 2} height={c - 2} rx={2} fill={color} />
      ))}
      <rect x={1} y={1} width={c * 2.5} height={c * 2.5} rx={4} fill="none" stroke={color} strokeWidth={2} />
      <rect x={size - c * 2.5 - 1} y={1} width={c * 2.5} height={c * 2.5} rx={4} fill="none" stroke={color} strokeWidth={2} />
      <rect x={1} y={size - c * 2.5 - 1} width={c * 2.5} height={c * 2.5} rx={4} fill="none" stroke={color} strokeWidth={2} />
      <rect x={c * .7} y={c * .7} width={c * 1.55} height={c * 1.55} rx={2} fill={color} />
      <rect x={size - c * 2.2} y={c * .7} width={c * 1.45} height={c * 1.45} rx={2} fill={color} />
      <rect x={c * .7} y={size - c * 2.2} width={c * 1.45} height={c * 1.45} rx={2} fill={color} />
    </svg>
  )
}

// ─── PIN INPUT ────────────────────────────────────────────────────────────────
export function PinInput({ value, onChange, label }) {
  const refs = [useRef(), useRef(), useRef(), useRef()]

  const handle = (i, e) => {
    const k = e.key
    if (k === 'Backspace') {
      const arr = [...value.padEnd(4, ' ')]
      arr[i] = ' '
      onChange(arr.join('').trimEnd())
      if (i > 0 && !value[i]) refs[i - 1].current?.focus()
    } else if (/^\d$/.test(k)) {
      const arr = [...value.padEnd(4, ' ')]
      arr[i] = k
      onChange(arr.join('').trimEnd())
      if (i < 3) setTimeout(() => refs[i + 1].current?.focus(), 8)
    }
    e.preventDefault()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {label && <p style={{ fontSize: 13, color: 'var(--mut)', fontWeight: 500 }}>{label}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        {[0, 1, 2, 3].map(i => (
          <input
            key={i}
            ref={refs[i]}
            type="password"
            maxLength={1}
            readOnly
            value={value[i] || ''}
            className={`pin-box ${value[i] ? 'pf' : ''}`}
            onKeyDown={e => handle(i, e)}
            onClick={() => refs[i].current?.focus()}
            onChange={() => {}}
          />
        ))}
      </div>
    </div>
  )
}

// ─── LOYALTY CARD ─────────────────────────────────────────────────────────────
export function LoyaltyCard({ merchant, card }) {
  const goal   = merchant.rules.stampsGoal
  const stamps = card ? card.stamps : 0
  const cols   = Math.min(goal, 5)
  const pct    = (stamps / goal) * 100

  return (
    <div
      className="lcard"
      style={{ background: `linear-gradient(140deg,${merchant.branding.primary},${merchant.branding.secondary})` }}
    >
      {/* decorative circles */}
      <div style={{ position: 'absolute', top: -28, right: -28, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
      <div style={{ position: 'absolute', bottom: -18, left: -8, width: 75, height: 75, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 7 }}>
              {merchant.branding.stampIcon}
            </div>
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>{merchant.name}</p>
            <p style={{ fontSize: 10, opacity: .7, marginTop: 2, letterSpacing: '.04em' }}>{merchant.category}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 9, opacity: .6, letterSpacing: '.07em', fontFamily: 'Syne,sans-serif', fontWeight: 700, textTransform: 'uppercase' }}>Premio</p>
            <p style={{ fontSize: 11, fontWeight: 700, maxWidth: 105, textAlign: 'right', lineHeight: 1.3, marginTop: 2 }}>
              {merchant.rules.rewardName}
            </p>
          </div>
        </div>

        {/* stamps grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 5, marginBottom: 13 }}>
          {Array.from({ length: goal }, (_, i) => (
            <div
              key={i}
              className={`scell${i < stamps ? ' on' : ''}`}
              style={{
                aspectRatio: '1',
                fontSize: Math.min(21, 30 / cols),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < stamps ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.11)',
              }}
            >
              {i < stamps ? merchant.branding.stampIcon : null}
            </div>
          ))}
        </div>

        {/* progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 10, opacity: .65, whiteSpace: 'nowrap' }}>{stamps}/{goal}</span>
          <div className="pbar" style={{ flex: 1 }}>
            <div className="pfill" style={{ width: `${pct}%` }} />
          </div>
          <span style={{ fontSize: 10, opacity: .65, whiteSpace: 'nowrap' }}>{goal - stamps} para premio</span>
        </div>
      </div>
    </div>
  )
}
