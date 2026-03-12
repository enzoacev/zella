// ─── BUTTON ───────────────────────────────────────────────────────────────────
export function Btn({ children, v = 'p', sz = '', onClick, disabled, style = {}, full, className = '' }) {
  const vm = { p: 'btn-p', g: 'btn-g', gw: 'btn-gw', d: 'btn-d', dan: 'btn-dan', suc: 'btn-suc' }
  const sm = { sm: 'btn-sm', lg: 'btn-lg', xl: 'btn-xl' }
  return (
    <button
      className={`btn ${vm[v] || 'btn-p'} ${sm[sz] || ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      style={{ width: full ? '100%' : undefined, ...style }}
    >
      {children}
    </button>
  )
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
export function Badge({ children, color = '#E6A540' }) {
  return (
    <span className="badge" style={{ background: `color-mix(in srgb,${color} 13%,transparent)`, color }}>
      {children}
    </span>
  )
}

// ─── INPUT ────────────────────────────────────────────────────────────────────
export function Inp({ label, value, onChange, type = 'text', placeholder, req, hint, sm }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <span className="ilbl">
          {label}{req && <span style={{ color: 'var(--p)' }}> *</span>}
        </span>
      )}
      <input
        className={`ifield${sm ? ' ifield-sm' : ''}`}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <span style={{ fontSize: 11, color: 'var(--mut)' }}>{hint}</span>}
    </div>
  )
}

// ─── SELECT INPUT ─────────────────────────────────────────────────────────────
export function Sel({ label, value, onChange, options, req }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <span className="ilbl">
          {label}{req && <span style={{ color: 'var(--p)' }}> *</span>}
        </span>
      )}
      <select
        className="ifield"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ appearance: 'none' }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, sz = 'md' }) {
  const ws = { sm: 400, md: 510, lg: 670, xl: 860 }
  if (!open) return null
  return (
    <div className="ov fi" onClick={onClose}>
      <div className="mbox si" style={{ maxWidth: ws[sz] }} onClick={e => e.stopPropagation()}>
        <div className="mhd">
          <h2>{title}</h2>
          <button
            style={{ width: 34, height: 34, borderRadius: 11, border: '1.5px solid var(--brd)', background: 'transparent', cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
          >×</button>
        </div>
        <div className="mbody">{children}</div>
      </div>
    </div>
  )
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export function Stat({ label, val, sub, icon, color = 'var(--p)', delay = 0 }) {
  return (
    <div className="card scard fu" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="slbl">{label}</span>
          <p className="sval">{val}</p>
          {sub && <p className="ssub">{sub}</p>}
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: `color-mix(in srgb,${color} 12%,transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── TOAST LAYER ──────────────────────────────────────────────────────────────
export function Toasts({ toasts }) {
  const ic = { success: '✅', error: '❌', info: '💡' }
  const bg = { success: '#F0FDF4', error: '#FEF2F2', info: '#FFFBEB' }
  const bd = { success: '#86EFAC', error: '#FCA5A5', info: '#FDE68A' }
  return (
    <div className="tstr">
      {toasts.map(t => (
        <div key={t.id} className="tst" style={{ background: bg[t.type], border: `1px solid ${bd[t.type]}` }}>
          <span style={{ fontSize: 15 }}>{ic[t.type]}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1714' }}>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
export function Confirm({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title} sz="sm">
      <p style={{ fontSize: 14, color: 'var(--mut)', marginBottom: 24 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn v="g" full onClick={onClose}>Cancelar</Btn>
        <Btn v="dan" full onClick={() => { onConfirm(); onClose(); }}>Confirmar</Btn>
      </div>
    </Modal>
  )
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
      <div>
        <p className="stitle">{title}</p>
        {sub && <p className="ssect" style={{ marginBottom: 0 }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}
