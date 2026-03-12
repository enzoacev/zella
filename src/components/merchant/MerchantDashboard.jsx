import { useState, useEffect, useCallback } from 'react'
import { TopBar }    from '../ui/TopBar'
import { Btn, Badge, Inp, Stat } from '../ui/primitives'
import { QRCode, LoyaltyCard } from '../ui/widgets'
import { merchant as merchantApi } from '../../services/api'

const fmtP = n => '$' + Math.round(n / 100).toLocaleString('es-AR')
const fmtD = s => s ? new Date(s).toLocaleDateString('es-AR') : '—'
const STAMP_ICONS = ['☕','🍕','🍣','🍔','🧁','🍦','🎯','⭐','💎','🌟','🔥','✨','🍩','🎪','🏆']
const PLANS = {
  basic:      { id: 'basic',      name: 'Básico',    price: 1900, color: '#6B7280', features: [] },
  pro:        { id: 'pro',        name: 'Pro',        price: 4900, color: '#3B82F6', features: ['custom_branding','push_notifications','analytics','birthday_coupons'] },
  enterprise: { id: 'enterprise', name: 'Enterprise', price: 9900, color: '#8B5CF6', features: ['custom_branding','push_notifications','analytics','birthday_coupons','white_label','api_access'] },
}

// Shape raw DB merchant into the branding/rules structure components expect
function shapeMerchant(m) {
  if (m.branding) return m // already shaped
  return {
    ...m,
    branding: { primary: m.brandPrimary, secondary: m.brandSecondary, stampIcon: m.stampIcon, logoText: m.logoText },
    rules:    { stampsGoal: m.stampsGoal, rewardName: m.rewardName, couponValidity: m.couponValidity },
  }
}

export default function MerchantDashboard({ merchant: initM, toast, onLogout }) {
  const [merchant, setMerchant] = useState(shapeMerchant(initM))
  const [stats,    setStats]    = useState({ cards: [], coupons: [], transactions: [] })
  const [tab,      setTab]      = useState('terminal')

  // Inject brand CSS vars
  useEffect(() => {
    document.documentElement.style.setProperty('--p', merchant.branding.primary)
    document.documentElement.style.setProperty('--s', merchant.branding.secondary)
  }, [merchant.branding])

  const reload = useCallback(async () => {
    try {
      const s = await merchantApi.stats()
      setStats(s)
    } catch (e) {
      toast(e.message, 'error')
    }
  }, [toast])

  useEffect(() => { reload() }, [reload])

  const plan    = PLANS[merchant.planId] || PLANS.basic
  const hasFeat = f => plan.features.includes(f)
  const mCards  = stats.cards
  const mCps    = stats.coupons
  const mTx     = stats.transactions

  const TABS = [
    { id: 'terminal',  icon: '📡', label: 'Terminal'     },
    { id: 'stats',     icon: '📊', label: 'Stats'        },
    { id: 'customers', icon: '👥', label: 'Socios'       },
    { id: 'coupons',   icon: '🎟️', label: 'Cupones'      },
    ...(hasFeat('custom_branding')    ? [{ id: 'brand', icon: '🎨', label: 'Marca' }]      : []),
    { id: 'rules',     icon: '⚙️', label: 'Reglas'       },
    ...(hasFeat('push_notifications') ? [{ id: 'mkt',   icon: '📣', label: 'Marketing' }]  : []),
    { id: 'sub',       icon: '💳', label: 'Suscripción'  },
  ]

  const syncBrand = async (branding) => {
    try {
      const updated = await merchantApi.updateBrand({
        brandPrimary: branding.primary, brandSecondary: branding.secondary,
        stampIcon: branding.stampIcon, logoText: branding.logoText || '',
      })
      setMerchant(shapeMerchant(updated))
      toast('Marca actualizada', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  const syncRules = async (rules) => {
    try {
      const updated = await merchantApi.updateRules(rules)
      setMerchant(shapeMerchant(updated))
      toast('Reglas actualizadas', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  const doStamp = async (customerId, count) => {
    try {
      const r = await merchantApi.stamp({ customerId, count })
      await reload()
      return r
    } catch (e) { toast(e.message, 'error'); throw e }
  }

  const findByDni = async (dni) => {
    try { return await merchantApi.findByDni(dni) }
    catch (e) { toast(e.message, 'error'); return null }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <TopBar
        logo={{ icon: merchant.branding.stampIcon, name: merchant.name, sub: merchant.category }}
        tabs={TABS} activeTab={tab} onTabChange={setTab}
        right={<Btn v="gw" sz="sm" onClick={onLogout}>Salir</Btn>}
      />
      <div style={{ padding: '22px 26px', maxWidth: 1080, margin: '0 auto' }}>
        {tab === 'terminal'  && <TerminalTab  merchant={merchant} mTx={mTx} toast={toast} findByDni={findByDni} doStamp={doStamp} />}
        {tab === 'stats'     && <StatsTab     merchant={merchant} mCards={mCards} mCps={mCps} mTx={mTx} />}
        {tab === 'customers' && <CTab         merchant={merchant} mCards={mCards} toast={toast} doStamp={doStamp} />}
        {tab === 'coupons'   && <CouponsTab   merchant={merchant} mCps={mCps} />}
        {tab === 'brand'     && <BrandTab     merchant={merchant} onSave={syncBrand} />}
        {tab === 'rules'     && <RulesTab     merchant={merchant} onSave={syncRules} />}
        {tab === 'mkt'       && <MktTab       merchant={merchant} mCards={mCards} toast={toast} />}
        {tab === 'sub'       && <SubTab       merchant={merchant} plan={plan} />}
      </div>
    </div>
  )
}

// ── TERMINAL ──────────────────────────────────────────────────────────────────
function TerminalTab({ merchant, mTx, toast, findByDni, doStamp }) {
  const [sDni,  setSDni]   = useState('')
  const [found, setFound]  = useState(null)
  const [card,  setCard]   = useState(null)
  const [sc,    setSc]     = useState(1)
  const [anim,  setAnim]   = useState(false)
  const [busy,  setBusy]   = useState(false)

  const doSearch = async () => {
    const res = await findByDni(sDni.trim())
    if (res) { setFound(res.customer); setCard(res.card) }
    else     { setFound(null); setCard(null) }
  }

  const handleStamp = async () => {
    if (!found || busy) return
    setBusy(true)
    try {
      const r = await doStamp(found.id, sc)
      setAnim(true); setTimeout(() => setAnim(false), 900)
      // Refresh card data
      const res = await findByDni(found.dni)
      if (res) { setFound(res.customer); setCard(res.card) }
      toast(`${sc} sello${sc > 1 ? 's' : ''} acreditado${sc > 1 ? 's' : ''} a ${found.name}`, 'success')
      if (r?.couponsGenerated > 0) setTimeout(() => toast(`🎉 ¡${found.name} ganó un premio!`, 'success'), 900)
    } finally { setBusy(false) }
  }

  return (
    <div>
      <p className="stitle">Terminal</p>
      <div className="g2" style={{ gap: 18, marginTop: 4 }}>
        <div className="card fu" style={{ padding: 26 }}>
          <span className="ilbl" style={{ marginBottom: 12 }}>Buscar socio por DNI</span>
          <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
            <input className="ifield" value={sDni} placeholder="Ej: 30123456"
              onChange={e => setSDni(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} style={{ flex: 1 }} />
            <Btn onClick={doSearch}>Buscar</Btn>
          </div>
          {found ? (
            <div className="si">
              <div style={{ padding: '14px 16px', borderRadius: 16, background: `color-mix(in srgb,${merchant.branding.primary} 8%,transparent)`, border: `1.5px solid ${merchant.branding.primary}`, marginBottom: 18 }}>
                <div style={{ display: 'flex', gap: 11, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg,${merchant.branding.primary},${merchant.branding.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 18, color: '#fff', flexShrink: 0 }}>{found.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{found.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--mut)' }}>DNI {found.dni}</p>
                  </div>
                  <Badge color="#10B981">Verificado ✓</Badge>
                </div>
                {card ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
                    {[['Sellos', card.stamps], ['Para premio', merchant.rules.stampsGoal - card.stamps], ['Histórico', card.totalStamps || 0]].map(([l, v]) => (
                      <div key={l} style={{ textAlign: 'center', padding: '9px 5px', borderRadius: 11, background: 'rgba(255,255,255,.7)' }}>
                        <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20 }}>{v}</p>
                        <p style={{ fontSize: 9, color: 'var(--mut)' }}>{l}</p>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ fontSize: 11, color: 'var(--mut)', textAlign: 'center', padding: 6 }}>Primera visita — tarjeta nueva</p>}
              </div>
              <span className="ilbl" style={{ marginBottom: 9 }}>Cantidad de sellos</span>
              <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
                {[1, 2, 3, 5].map(n => (
                  <button key={n} onClick={() => setSc(n)} style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: `2px solid ${sc === n ? 'var(--p)' : 'var(--brd)'}`, background: sc === n ? 'var(--p)' : 'transparent', color: sc === n ? '#fff' : 'var(--txt)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all .16s' }}>
                    ×{n}
                  </button>
                ))}
              </div>
              <Btn full sz="lg" onClick={handleStamp} disabled={busy} style={{ background: anim ? '#10B981' : undefined, transition: 'background .28s' }}>
                {anim ? '✓ ¡Sellado!' : busy ? 'Acreditando…' : `Acreditar ${sc} Sello${sc > 1 ? 's' : ''} ${merchant.branding.stampIcon}`}
              </Btn>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <div style={{ fontSize: 42, marginBottom: 10 }}>📡</div>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 5 }}>Listo para acreditar</p>
              <p style={{ fontSize: 12, color: 'var(--mut)' }}>Ingresá el DNI para comenzar</p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card fu" style={{ padding: 24, textAlign: 'center', animationDelay: '90ms' }}>
            <span className="ilbl" style={{ marginBottom: 14 }}>QR del Local</span>
            <div style={{ display: 'inline-block', padding: 18, background: '#fff', borderRadius: 18, boxShadow: '0 4px 22px rgba(0,0,0,.08)', marginBottom: 12 }}>
              <QRCode value={`zella://scan/${merchant.id}`} size={140} color={merchant.branding.secondary} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 8 }}>Los socios escanean este código</p>
            <code style={{ fontSize: 10, background: 'var(--bg)', padding: '7px 11px', borderRadius: 9, display: 'block', wordBreak: 'break-all', color: 'var(--mut)' }}>zella://scan/{merchant.id}</code>
          </div>
          <div className="card fu" style={{ padding: 18, animationDelay: '180ms' }}>
            <span className="ilbl" style={{ marginBottom: 12 }}>Actividad Reciente</span>
            {mTx.slice(0, 5).map(tx => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--brd)' }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600 }}>{tx.customer?.name || '?'}</p>
                  <p style={{ fontSize: 10, color: 'var(--mut)' }}>{fmtD(tx.createdAt)}</p>
                </div>
                <Badge color="var(--p)">{tx.type === 'stamp' ? `+${tx.count} ${merchant.branding.stampIcon}` : 'Canje'}</Badge>
              </div>
            ))}
            {mTx.length === 0 && <p style={{ fontSize: 12, color: 'var(--mut)', textAlign: 'center', padding: 14 }}>Sin actividad aún</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── STATS ─────────────────────────────────────────────────────────────────────
function StatsTab({ merchant, mCards, mCps, mTx }) {
  return (
    <div>
      <p className="stitle">Estadísticas</p>
      <div className="g4" style={{ marginBottom: 22 }}>
        <Stat label="Socios"          val={mCards.length}                                                      icon="👥"                      color="var(--p)"  delay={0}   />
        <Stat label="Sellos Emitidos" val={mTx.filter(t => t.type === 'stamp').reduce((s,t) => s+t.count, 0)} icon={merchant.branding.stampIcon} color="#3B82F6" delay={70}  />
        <Stat label="Cupones Activos" val={mCps.filter(c => c.status === 'pending').length}                   icon="🎟️"                     color="#10B981"  delay={140} />
        <Stat label="Canjes"          val={mCps.filter(c => c.status === 'redeemed').length}                  icon="✅"                      color="#8B5CF6"  delay={210} />
      </div>
      <div className="card fu" style={{ padding: 22, animationDelay: '280ms' }}>
        <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Top Socios</p>
        {[...mCards].sort((a, b) => (b.totalStamps||0) - (a.totalStamps||0)).slice(0, 6).map((card, i) => {
          const pct = card.stamps / merchant.rules.stampsGoal * 100
          return (
            <div key={card.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid var(--brd)' }}>
              <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                <span style={{ width: 22, fontFamily: 'Syne,sans-serif', fontWeight: 800, color: 'var(--mut)', fontSize: 12 }}>#{i+1}</span>
                <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg,var(--p),var(--s))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 14, color: '#fff' }}>{card.customer?.name?.[0] || '?'}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>{card.customer?.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
                    <div style={{ height: 4, width: 70, borderRadius: 99, background: 'var(--brd)' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: 'var(--p)', width: `${Math.min(pct,100)}%` }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--mut)' }}>{card.stamps}/{merchant.rules.stampsGoal}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14 }}>{card.totalStamps||0}</p>
                <p style={{ fontSize: 9, color: 'var(--mut)' }}>total</p>
              </div>
            </div>
          )
        })}
        {mCards.length === 0 && <p style={{ color: 'var(--mut)', textAlign: 'center', padding: 22 }}>Sin socios aún</p>}
      </div>
    </div>
  )
}

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
function CTab({ merchant, mCards, toast, doStamp }) {
  return (
    <div>
      <p className="stitle">Socios <span style={{ fontWeight: 400, fontSize: 18, color: 'var(--mut)' }}>{mCards.length}</span></p>
      <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
        {mCards.map((card, i) => {
          const c = card.customer
          if (!c) return null
          const pct = card.stamps / merchant.rules.stampsGoal * 100
          return (
            <div key={card.id} className="card fu" style={{ padding: '15px 20px', animationDelay: `${i*40}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: `linear-gradient(135deg,${merchant.branding.primary},${merchant.branding.secondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 17, color: '#fff', flexShrink: 0 }}>{c.name[0]}</div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--mut)' }}>{c.dni} · {c.email}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 3 }}>
                      <div style={{ height: 4, width: 80, borderRadius: 99, background: 'var(--brd)' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: 'var(--p)', width: `${Math.min(pct,100)}%` }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--mut)' }}>{card.stamps}/{merchant.rules.stampsGoal}</span>
                    </div>
                  </div>
                </div>
                <Btn sz="sm" onClick={async () => { await doStamp(c.id, 1); toast(`+1 sello a ${c.name}`, 'success') }}>+1 Sello</Btn>
              </div>
            </div>
          )
        })}
        {mCards.length === 0 && <div className="card" style={{ padding: 44, textAlign: 'center' }}><p style={{ color: 'var(--mut)' }}>Sin socios aún</p></div>}
      </div>
    </div>
  )
}

// ── COUPONS ───────────────────────────────────────────────────────────────────
function CouponsTab({ merchant, mCps }) {
  return (
    <div>
      <p className="stitle">Cupones</p>
      <div style={{ display: 'grid', gap: 9, marginTop: 16 }}>
        {mCps.length === 0 && <div className="card" style={{ padding: 44, textAlign: 'center' }}><p style={{ color: 'var(--mut)' }}>Sin cupones aún</p></div>}
        {mCps.map((cp, i) => {
          const sColor = { pending: '#10B981', redeemed: '#6B7280', expired: '#EF4444' }[cp.status]
          return (
            <div key={cp.id} className="card fu" style={{ padding: '15px 20px', animationDelay: `${i*40}ms`, opacity: cp.status === 'redeemed' ? .62 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>{cp.status === 'redeemed' ? '✅' : '🎟️'}</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{cp.rewardName}</p>
                    <p style={{ fontSize: 11, color: 'var(--mut)' }}>{cp.customer?.name} · Vence {fmtD(cp.expiresAt)}</p>
                  </div>
                </div>
                <Badge color={sColor}>{{ pending: 'Activo', redeemed: 'Canjeado', expired: 'Expirado' }[cp.status]}</Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── BRAND ─────────────────────────────────────────────────────────────────────
function BrandTab({ merchant, onSave }) {
  const [bf, setBf] = useState({ ...merchant.branding })
  return (
    <div style={{ maxWidth: 600 }}>
      <p className="stitle">Personalización</p>
      <div className="card fu" style={{ padding: 26 }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div className="g2">
            {[['primary', 'Color Principal'], ['secondary', 'Color Secundario']].map(([k, l]) => (
              <div key={k}>
                <span className="ilbl">{l}</span>
                <input type="color" value={bf[k]} onChange={e => setBf(p => ({ ...p, [k]: e.target.value }))}
                  style={{ width: '100%', height: 50, borderRadius: 11, border: '2px solid var(--brd)', cursor: 'pointer' }} />
              </div>
            ))}
          </div>
          <div>
            <span className="ilbl" style={{ marginBottom: 9 }}>Ícono del Sello</span>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {STAMP_ICONS.map(ic => (
                <button key={ic} onClick={() => setBf(p => ({ ...p, stampIcon: ic }))}
                  style={{ width: 38, height: 38, borderRadius: 10, border: `2px solid ${bf.stampIcon === ic ? 'var(--p)' : 'var(--brd)'}`, background: bf.stampIcon === ic ? `color-mix(in srgb,${bf.primary} 11%,transparent)` : 'transparent', fontSize: 16, cursor: 'pointer' }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 18, overflow: 'hidden' }}>
            <LoyaltyCard merchant={{ ...merchant, branding: bf }} card={{ stamps: Math.floor(merchant.rules.stampsGoal / 2) }} />
          </div>
          <Btn full onClick={() => onSave(bf)}>Guardar Cambios</Btn>
        </div>
      </div>
    </div>
  )
}

// ── RULES ─────────────────────────────────────────────────────────────────────
function RulesTab({ merchant, onSave }) {
  const [rf, setRf] = useState({ ...merchant.rules })
  return (
    <div style={{ maxWidth: 560 }}>
      <p className="stitle">Reglas de Negocio</p>
      <div className="card fu" style={{ padding: 26 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <span className="ilbl" style={{ marginBottom: 9 }}>Sellos para completar</span>
            <div style={{ display: 'flex', gap: 7 }}>
              {[5, 8, 10, 12, 15, 20].map(n => (
                <button key={n} onClick={() => setRf(p => ({ ...p, stampsGoal: n }))}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: `2px solid ${rf.stampsGoal === n ? 'var(--p)' : 'var(--brd)'}`, background: rf.stampsGoal === n ? 'var(--p)' : 'transparent', color: rf.stampsGoal === n ? '#fff' : 'var(--txt)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <Inp label="Nombre del Premio" value={rf.rewardName} onChange={v => setRf(p => ({ ...p, rewardName: v }))} placeholder="Ej: Café Grande Gratis" />
          <div>
            <span className="ilbl" style={{ marginBottom: 9 }}>Validez del cupón (días)</span>
            <div style={{ display: 'flex', gap: 7 }}>
              {[7, 15, 30, 60, 90].map(n => (
                <button key={n} onClick={() => setRf(p => ({ ...p, couponValidity: n }))}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 11, border: `2px solid ${rf.couponValidity === n ? 'var(--p)' : 'var(--brd)'}`, background: rf.couponValidity === n ? 'var(--p)' : 'transparent', color: rf.couponValidity === n ? '#fff' : 'var(--txt)', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                  {n}d
                </button>
              ))}
            </div>
          </div>
          <Btn full onClick={() => onSave(rf)}>Guardar Reglas</Btn>
        </div>
      </div>
    </div>
  )
}

// ── MARKETING ─────────────────────────────────────────────────────────────────
function MktTab({ merchant, mCards, toast }) {
  const [msg, setMsg] = useState('')
  return (
    <div>
      <p className="stitle">Marketing</p>
      <div className="g2" style={{ marginTop: 16 }}>
        <div className="card fu" style={{ padding: 24 }}>
          <div style={{ fontSize: 34, marginBottom: 11 }}>🎂</div>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 7 }}>Premios de Cumpleaños</p>
          <p style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 18 }}>Cupones automáticos para socios que cumplan años este mes</p>
          <Btn full onClick={() => toast('🎂 Cupones de cumpleaños enviados', 'success')}>Enviar Cupones 🎂</Btn>
        </div>
        <div className="card fu" style={{ padding: 24, animationDelay: '90ms' }}>
          <div style={{ fontSize: 34, marginBottom: 11 }}>📣</div>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 7 }}>Notificación Masiva</p>
          <p style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 18 }}>Mensaje instantáneo a todos tus socios</p>
          <Inp label="Mensaje" value={msg} onChange={setMsg} placeholder="Ej: ¡Doble sellos este finde!" />
          <div style={{ marginTop: 12 }}>
            <Btn full onClick={() => { if (!msg.trim()) { toast('Escribí un mensaje primero', 'error'); return } toast(`📣 Enviado a ${mCards.length} socios`, 'success'); setMsg('') }}>
              Enviar a {mCards.length} socios
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── SUBSCRIPTION ──────────────────────────────────────────────────────────────
function SubTab({ merchant, plan }) {
  return (
    <div style={{ maxWidth: 680 }}>
      <p className="stitle">Suscripción</p>
      <div className="card fu" style={{ padding: 24, marginBottom: 18, background: `color-mix(in srgb,${merchant.branding.primary} 10%,transparent)`, border: `1.5px solid color-mix(in srgb,${merchant.branding.primary} 28%,transparent)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="slbl">Plan Actual</span>
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 28, marginTop: 3 }}>{plan?.name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 32, color: 'var(--p)' }}>${((plan?.price||0)/100).toLocaleString('es-AR')}</p>
            <p style={{ fontSize: 11, color: 'var(--mut)' }}>/ mes</p>
          </div>
        </div>
      </div>
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 42, height: 27, borderRadius: 7, background: '#009EE3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 9, letterSpacing: '.05em' }}>MP</span>
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 13 }}>Mercado Pago</p>
            <p style={{ fontSize: 11, color: 'var(--mut)' }}>Visa •••• 4242 · Activo</p>
          </div>
          <Btn v="g" sz="sm" style={{ marginLeft: 'auto' }}>Actualizar</Btn>
        </div>
      </div>
    </div>
  )
}
