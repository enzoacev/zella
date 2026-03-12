import { useState } from 'react'
import { Btn, Inp } from '../ui/primitives'
import { PinInput } from '../ui/widgets'

export default function Login({ onLogin }) {
  const [mode,  setMode]  = useState('select')
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [dni,   setDni]   = useState('')
  const [pin,   setPin]   = useState('')
  const [reg,   setReg]   = useState({ name: '', dni: '', email: '', pin: '', birthDate: '' })
  const [err,   setErr]   = useState('')
  const [busy,  setBusy]  = useState(false)

  const wrap = async (fn) => {
    setBusy(true); setErr('')
    try { await fn() }
    catch (e) { setErr(e.message || 'Error desconocido') }
    finally { setBusy(false) }
  }

  const doMerchant = () => wrap(() => onLogin({ type: 'merchant', email, password: pass }))
  const doCustomer = () => wrap(() => onLogin({ type: 'customer', dni, pin }))
  const doRegister = () => {
    if (!reg.name || !reg.dni || reg.pin.length !== 4) { setErr('Nombre, DNI y PIN de 4 dígitos son requeridos'); return }
    wrap(() => onLogin({ type: 'register', ...reg }))
  }

  const reset = () => { setErr(''); setEmail(''); setPass(''); setDni(''); setPin('') }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'fixed', top: -90, right: -90, width: 380, height: 380, borderRadius: '50%', background: 'color-mix(in srgb,var(--p) 7%,transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -70, left: -70, width: 280, height: 280, borderRadius: '50%', background: 'color-mix(in srgb,var(--s) 4%,transparent)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 430, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 34 }} className="fu">
          <div style={{ width: 72, height: 72, borderRadius: 24, background: 'linear-gradient(135deg,var(--p),var(--s))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 12px 36px color-mix(in srgb,var(--p) 32%,transparent)' }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 32, color: '#fff' }}>Z</span>
          </div>
          <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 38, letterSpacing: '.12em', textTransform: 'uppercase' }}>ZELLA</h1>
          <p style={{ fontSize: 12, color: 'var(--mut)', letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 500, marginTop: 3 }}>Loyalty Platform</p>
        </div>

        {mode === 'select' && (
          <div style={{ display: 'grid', gap: 11 }} className="si">
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--mut)', marginBottom: 2 }}>¿Cómo querés ingresar?</p>
            {[{ r: 'merchant', i: '🏪', t: 'Soy Comercio', s: 'Accedé al panel de gestión' },
              { r: 'customer', i: '👤', t: 'Soy Socio',    s: 'Accedé a tu billetera' }].map(opt => (
              <div key={opt.r} className="card card-hov" style={{ padding: 20, display: 'flex', gap: 12, alignItems: 'center' }} onClick={() => { setMode(opt.r); reset() }}>
                <div style={{ width: 50, height: 50, borderRadius: 15, background: 'color-mix(in srgb,var(--p) 9%,transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{opt.i}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 16 }}>{opt.t}</p>
                  <p style={{ fontSize: 12, color: 'var(--mut)', marginTop: 1 }}>{opt.s}</p>
                </div>
                <span style={{ color: 'var(--mut)', fontSize: 18 }}>→</span>
              </div>
            ))}
            <div style={{ marginTop: 8, padding: '14px 16px', borderRadius: 18, background: 'color-mix(in srgb,var(--p) 5%,transparent)', border: '1px dashed color-mix(in srgb,var(--p) 25%,transparent)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--mut)', marginBottom: 7, letterSpacing: '.05em', textTransform: 'uppercase', fontFamily: 'Syne,sans-serif' }}>🎯 Accesos de prueba</p>
              <div style={{ fontSize: 10, color: 'var(--mut)', lineHeight: 1.9, fontFamily: 'monospace' }}>
                <div>Super Admin → admin@zella.app / admin123</div>
                <div>Café Selva  → cafe@zella.app  / cafe123</div>
                <div>Socio Ana   → DNI 30123456    / PIN 1234</div>
              </div>
            </div>
          </div>
        )}

        {mode === 'merchant' && (
          <div className="card si" style={{ padding: 30 }}>
            <BackBtn onClick={() => { setMode('select'); reset() }} />
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 21, marginBottom: 22 }}>Acceso Comercio</p>
            <div style={{ display: 'grid', gap: 14 }}>
              <Inp label="Email" type="email" value={email} onChange={v => { setEmail(v); setErr('') }} placeholder="tu@comercio.com" />
              <Inp label="Contraseña" type="password" value={pass} onChange={v => { setPass(v); setErr('') }} placeholder="••••••••" />
              {err && <ErrMsg msg={err} />}
              <Btn full sz="lg" onClick={doMerchant} disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</Btn>
            </div>
          </div>
        )}

        {mode === 'customer' && (
          <div className="card si" style={{ padding: 30 }}>
            <BackBtn onClick={() => { setMode('select'); reset() }} />
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 21, marginBottom: 22 }}>Acceso Socio</p>
            <div style={{ display: 'grid', gap: 20 }}>
              <Inp label="DNI" value={dni} onChange={v => { setDni(v); setErr('') }} placeholder="Ej: 30123456" />
              <PinInput value={pin} onChange={v => { setPin(v); setErr('') }} label="PIN de 4 dígitos" />
              {err && <ErrMsg msg={err} />}
              <Btn full sz="lg" onClick={doCustomer} disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</Btn>
              <button onClick={() => { setMode('register'); reset() }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--p)', fontSize: 12, fontWeight: 600, textAlign: 'center', padding: 3 }}>
                ¿Primera vez? Crear cuenta →
              </button>
            </div>
          </div>
        )}

        {mode === 'register' && (
          <div className="card si" style={{ padding: 30 }}>
            <BackBtn onClick={() => { setMode('customer'); reset() }} />
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 21, marginBottom: 22 }}>Crear Cuenta</p>
            <div style={{ display: 'grid', gap: 14 }}>
              <Inp label="Nombre completo" value={reg.name}      onChange={v => setReg(p => ({ ...p, name: v }))}      placeholder="Ana García" />
              <Inp label="DNI"             value={reg.dni}       onChange={v => setReg(p => ({ ...p, dni: v }))}       placeholder="30123456" />
              <Inp label="Email"    type="email" value={reg.email} onChange={v => setReg(p => ({ ...p, email: v }))} placeholder="ana@email.com" />
              <Inp label="Fecha de nacimiento" type="date" value={reg.birthDate} onChange={v => setReg(p => ({ ...p, birthDate: v }))} />
              <PinInput value={reg.pin} onChange={v => setReg(p => ({ ...p, pin: v }))} label="Elegí un PIN de 4 dígitos *" />
              {err && <ErrMsg msg={err} />}
              <Btn full sz="lg" onClick={doRegister} disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear Cuenta'}</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const BackBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mut)', fontSize: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 3 }}>← Volver</button>
)
const ErrMsg = ({ msg }) => (
  <p style={{ color: '#DC2626', fontSize: 12, textAlign: 'center', padding: '8px 12px', background: '#FEF2F2', borderRadius: 10 }}>{msg}</p>
)
