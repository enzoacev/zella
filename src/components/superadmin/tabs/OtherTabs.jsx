import { useState } from 'react'
import { Btn, Stat } from '../../ui/primitives'
import { FEATURE_NAMES } from '../../../data/initialData'

const fmtP = n => '$' + Math.round(n / 100).toLocaleString('es-AR')
const fmtD = s => s ? new Date(s).toLocaleDateString('es-AR') : '—'

// ─── PLANS TAB ────────────────────────────────────────────────────────────────
export function PlansTab({ store }) {
  return (
    <div>
      <p className="stitle">Planes SaaS</p>
      <p className="ssect">Feature locking y configuración de niveles</p>
      <div className="g3">
        {store.plans.map((pl, i) => (
          <div key={pl.id} className="card fu" style={{ padding: 26, animationDelay: `${i * 90}ms`, borderTop: `4px solid ${pl.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 21 }}>{pl.name}</p>
                <p style={{ fontSize: 11, color: 'var(--mut)', marginTop: 2 }}>{pl.desc}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 24, color: pl.color }}>{fmtP(pl.price)}</p>
                <p style={{ fontSize: 9, color: 'var(--mut)', letterSpacing: '.08em' }}>/MES</p>
              </div>
            </div>
            <div style={{ paddingTop: 12, borderTop: '1px solid var(--brd)', marginBottom: 14 }}>
              <span className="ilbl" style={{ marginBottom: 8 }}>Incluido</span>
              {pl.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ color: pl.color, fontSize: 11, fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 12 }}>{FEATURE_NAMES[f] || f}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '11px 14px', borderRadius: 13, background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--mut)' }}>Comercios activos</span>
              <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 17, color: pl.color }}>
                {store.merchants.filter(m => m.planId === pl.id).length}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── BRANDING TAB ─────────────────────────────────────────────────────────────
export function BrandingTab({ store, toast }) {
  const [form, setForm] = useState(store.globalBrand)

  const handleSave = () => {
    store.updateGlobalBrand(form)
    document.documentElement.style.setProperty('--p', form.primary)
    document.documentElement.style.setProperty('--s', form.secondary)
    toast('Marca global actualizada', 'success')
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <p className="stitle">Marca Global</p>
      <p className="ssect">White-label de la plataforma</p>
      <div className="card fu" style={{ padding: 30 }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="g2" style={{ gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span className="ilbl">Nombre de la plataforma</span>
              <input className="ifield" value={form.logoText} onChange={e => setForm(p => ({ ...p, logoText: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span className="ilbl">Subtítulo</span>
              <input className="ifield" value={form.logoSub} onChange={e => setForm(p => ({ ...p, logoSub: e.target.value }))} />
            </div>
          </div>
          <div className="g2" style={{ gap: 12 }}>
            {[['primary', 'Color Primario'], ['secondary', 'Color Secundario']].map(([k, l]) => (
              <div key={k}>
                <span className="ilbl">{l}</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                    style={{ width: 50, height: 50, borderRadius: 13, border: '2px solid var(--brd)', cursor: 'pointer' }} />
                  <code style={{ fontSize: 11, background: 'var(--bg)', padding: '5px 9px', borderRadius: 8 }}>{form[k]}</code>
                </div>
              </div>
            ))}
          </div>
          {/* Preview */}
          <div style={{ padding: 18, borderRadius: 18, background: form.secondary, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: form.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 19, color: '#fff' }}>{form.logoText?.[0] || 'Z'}</span>
            </div>
            <div>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: '.1em', textTransform: 'uppercase' }}>{form.logoText || 'ZELLA'}</p>
              <p style={{ fontSize: 9, color: 'rgba(255,255,255,.42)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{form.logoSub || 'Loyalty Platform'}</p>
            </div>
          </div>
          <Btn full onClick={handleSave}>Guardar Cambios</Btn>
        </div>
      </div>
    </div>
  )
}

// ─── BILLING TAB ──────────────────────────────────────────────────────────────
export function BillingTab({ store }) {
  const mrr = store.merchants
    .filter(m => m.active)
    .reduce((s, m) => s + (store.plans.find(p => p.id === m.planId)?.price || 0), 0)

  return (
    <div>
      <p className="stitle">Facturación</p>
      <p className="ssect">Motor de cobro y auditoría</p>
      <div className="g3" style={{ marginBottom: 22 }}>
        <Stat label="MRR Total"    val={fmtP(mrr)}                                               icon="💰" color="#10B981" />
        <Stat label="Pagadas"      val={store.billing.filter(b => b.status === 'paid').length}    icon="✅" color="#3B82F6" />
        <Stat label="Pendientes"   val={store.billing.filter(b => b.status !== 'paid').length}    icon="⏳" color="#F59E0B" />
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '13px 22px', borderBottom: '1px solid var(--brd)', background: 'var(--bg)' }}>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13 }}>Log de Facturación</p>
        </div>
        <table className="ztable">
          <thead>
            <tr>
              <th>Comercio</th>
              <th>Plan</th>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {store.billing.map(b => {
              const m  = store.merchants.find(x => x.id === b.merchantId)
              const pl = store.plans.find(p => p.id === m?.planId)
              return (
                <tr key={b.id}>
                  <td>
                    <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${m?.branding.primary},${m?.branding.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        {m?.branding.stampIcon}
                      </div>
                      <span style={{ fontWeight: 600 }}>{m?.name || '—'}</span>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 12, color: 'var(--mut)' }}>{pl?.name}</span></td>
                  <td><span style={{ fontSize: 12, color: 'var(--mut)' }}>{fmtD(b.date)}</span></td>
                  <td><span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>{fmtP(b.amount)}</span></td>
                  <td>
                    <span className="badge" style={{ background: b.status === 'paid' ? '#F0FDF4' : '#FFFBEB', color: b.status === 'paid' ? '#16A34A' : '#D97706' }}>
                      {b.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
