import { useState, useEffect, useCallback } from 'react'
import { Btn, Badge, Modal } from '../ui/primitives'
import { QRCode, LoyaltyCard, PinInput } from '../ui/widgets'
import { customer as customerApi } from '../../services/api'

const fmtD = s => s ? new Date(s).toLocaleDateString('es-AR') : '—'

const TABS = [
  { id: 'wallet',  icon: '💳', label: 'Billetera' },
  { id: 'coupons', icon: '🎟️', label: 'Cupones'  },
  { id: 'explore', icon: '🔍', label: 'Explorar' },
  { id: 'profile', icon: '👤', label: 'Perfil'   },
]

export default function CustomerPortal({ customer, toast, onLogout }) {
  const [tab,      setTab]      = useState('wallet')
  const [wallet,   setWallet]   = useState({ cards: [], coupons: [], merchants: [] })
  const [explore,  setExplore]  = useState({ merchants: [], cards: [] })
  const [selCp,    setSelCp]    = useState(null)
  const [redModal, setRedModal] = useState(false)
  const [pin,      setPin]      = useState('')

  const loadWallet = useCallback(async () => {
    try { setWallet(await customerApi.wallet()) } catch (e) { toast(e.message, 'error') }
  }, [toast])

  const loadExplore = useCallback(async () => {
    try { setExplore(await customerApi.explore()) } catch (e) { toast(e.message, 'error') }
  }, [toast])

  useEffect(() => { loadWallet() }, [loadWallet])
  useEffect(() => { if (tab === 'explore') loadExplore() }, [tab, loadExplore])

  const { cards, coupons, merchants } = wallet
  const pending  = coupons.filter(c => c.status === 'pending')
  const redeemed = coupons.filter(c => c.status === 'redeemed')

  const doRedeem = async () => {
    if (!selCp) return
    try {
      await customerApi.redeem({ couponId: selCp.id, pin })
      await loadWallet()
      toast('¡Premio canjeado! 🎉', 'success')
      setRedModal(false); setPin(''); setSelCp(null)
    } catch (e) { toast(e.message, 'error'); setPin('') }
  }

  // Find merchant helper
  const getMerch = (merchantId) =>
    merchants.find(m => m.id === merchantId) ||
    explore.merchants.find(m => m.id === merchantId)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 78 }}>
      {/* Header */}
      <div style={{ background: 'var(--s)', padding: '17px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.14em', textTransform: 'uppercase' }}>ZELLA LOYALTY</p>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', marginTop: 1 }}>Hola, {customer.name.split(' ')[0]} 👋</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {pending.length > 0 && (
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--p)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 13, color: '#fff' }}>{pending.length}</div>
          )}
          <Btn v="gw" sz="sm" onClick={onLogout}>Salir</Btn>
        </div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 540, margin: '0 auto' }}>

        {/* WALLET */}
        {tab === 'wallet' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 21 }}>Mi Billetera</p>
              <Badge color="var(--p)">{cards.length} tarjetas</Badge>
            </div>
            {cards.length === 0 ? (
              <div className="card" style={{ padding: 50, textAlign: 'center' }}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>💳</div>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 7 }}>Sin tarjetas aún</p>
                <p style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 20 }}>Visitá un comercio y acumulá tus primeros sellos</p>
                <Btn onClick={() => setTab('explore')}>Explorar Comercios</Btn>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                {cards.map((card, i) => {
                  const merch = getMerch(card.merchantId)
                  if (!merch) return null
                  const shaped = { ...merch, branding: { primary: merch.brandPrimary, secondary: merch.brandSecondary, stampIcon: merch.stampIcon, logoText: merch.logoText }, rules: { stampsGoal: merch.stampsGoal } }
                  return (
                    <div key={card.id} className="fu" style={{ animationDelay: `${i*70}ms` }}>
                      <LoyaltyCard merchant={shaped} card={card} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* COUPONS */}
        {tab === 'coupons' && (
          <div>
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 21, marginBottom: 18 }}>Mis Cupones</p>
            {pending.length > 0 && (
              <>
                <span className="ilbl" style={{ marginBottom: 10 }}>Disponibles para canjear</span>
                {pending.map((cp, i) => {
                  const merch = getMerch(cp.merchantId)
                  return (
                    <div key={cp.id} className="card fu" style={{ overflow: 'hidden', marginBottom: 11, animationDelay: `${i*55}ms` }}>
                      <div style={{ background: `linear-gradient(135deg,${merch?.brandPrimary || '#E85D26'},${merch?.brandSecondary || '#2D6A4F'})`, padding: '15px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: '#fff' }}>{cp.rewardName}</p>
                          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.68)', marginTop: 2 }}>{merch?.name}</p>
                        </div>
                        <span style={{ fontSize: 30 }}>🎟️</span>
                      </div>
                      <div style={{ padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 11, color: 'var(--mut)' }}>Vence {fmtD(cp.expiresAt)}</p>
                        <Btn sz="sm" onClick={() => { setSelCp(cp); setRedModal(true) }}>Canjear</Btn>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
            {redeemed.length > 0 && (
              <>
                <span className="ilbl" style={{ marginTop: 20, marginBottom: 10, display: 'block' }}>Historial</span>
                {redeemed.map(cp => {
                  const merch = getMerch(cp.merchantId)
                  return (
                    <div key={cp.id} className="card" style={{ padding: '13px 18px', marginBottom: 8, opacity: .58 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 13 }}>{cp.rewardName}</p>
                          <p style={{ fontSize: 10, color: 'var(--mut)' }}>{merch?.name} · {fmtD(cp.redeemedAt)}</p>
                        </div>
                        <Badge color="#6B7280">Canjeado</Badge>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
            {coupons.length === 0 && (
              <div className="card" style={{ padding: 44, textAlign: 'center' }}>
                <div style={{ fontSize: 38, marginBottom: 11 }}>🎟️</div>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15 }}>Sin cupones aún</p>
                <p style={{ fontSize: 12, color: 'var(--mut)', marginTop: 3 }}>Completá tarjetas para ganar premios</p>
              </div>
            )}
          </div>
        )}

        {/* EXPLORE */}
        {tab === 'explore' && (
          <div>
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 21, marginBottom: 18 }}>Explorar</p>
            <div style={{ display: 'grid', gap: 11 }}>
              {explore.merchants.map((merch, i) => {
                const mc = explore.cards.find(c => c.merchantId === merch.id)
                return (
                  <div key={merch.id} className="card fu" style={{ overflow: 'hidden', animationDelay: `${i*55}ms` }}>
                    <div style={{ height: 4, background: `linear-gradient(90deg,${merch.brandPrimary},${merch.brandSecondary})` }} />
                    <div style={{ padding: '15px 18px' }}>
                      <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 15, background: `linear-gradient(135deg,${merch.brandPrimary},${merch.brandSecondary})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, flexShrink: 0 }}>{merch.stampIcon}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15 }}>{merch.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 6 }}>{merch.category} · {merch.address}</p>
                          {mc ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                              <div style={{ height: 4, flex: 1, borderRadius: 99, background: 'var(--brd)' }}>
                                <div style={{ height: '100%', borderRadius: 99, background: merch.brandPrimary, width: `${(mc.stamps / merch.stampsGoal) * 100}%` }} />
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--mut)', whiteSpace: 'nowrap' }}>{mc.stamps}/{merch.stampsGoal}</span>
                            </div>
                          ) : <Badge color={merch.brandPrimary}>¡Empezá a acumular!</Badge>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, maxWidth: 90 }}>
                          <p style={{ fontSize: 9, color: 'var(--mut)' }}>Premio</p>
                          <p style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.3, marginTop: 2 }}>{merch.rewardName}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <div>
            <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 21, marginBottom: 18 }}>Mi Perfil</p>
            <div className="card fu" style={{ padding: 24, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: 19, background: 'linear-gradient(135deg,var(--p),var(--s))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 26, color: '#fff', flexShrink: 0 }}>{customer.name[0]}</div>
                <div>
                  <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 19 }}>{customer.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--mut)' }}>{customer.email}</p>
                  <p style={{ fontSize: 11, color: 'var(--mut)' }}>DNI {customer.dni}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
                {[['Tarjetas', cards.length, 'var(--p)'], ['Cupones', pending.length, '#10B981'], ['Canjes', redeemed.length, '#8B5CF6']].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: 'center', padding: '13px 6px', borderRadius: 14, background: 'var(--bg)' }}>
                    <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 21, color: c }}>{v}</p>
                    <p style={{ fontSize: 10, color: 'var(--mut)' }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="card fu" style={{ padding: 22, animationDelay: '90ms' }}>
              <span className="ilbl" style={{ marginBottom: 14 }}>Mi Código QR</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ padding: 18, background: '#fff', borderRadius: 18, boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>
                  <QRCode value={`zella://customer/${customer.id}/${customer.dni}`} size={140} color="#1A1714" />
                </div>
                <div style={{ padding: '9px 18px', borderRadius: 11, background: 'var(--bg)', fontFamily: 'monospace', fontSize: 15, letterSpacing: '.16em', fontWeight: 700 }}>{customer.dni}</div>
                <p style={{ fontSize: 11, color: 'var(--mut)', textAlign: 'center' }}>Presentá tu QR o DNI en cualquier comercio Zella</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="nb">
        {TABS.map(t => (
          <button key={t.id} className={`ntab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            <span className="ico">{t.icon}</span>
            <span className="lbl">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Redeem Modal */}
      <Modal open={redModal} onClose={() => { setRedModal(false); setPin(''); setSelCp(null) }} title="Canjear Premio" sz="sm">
        {selCp && (() => {
          const merch = getMerch(selCp.merchantId)
          return (
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ background: `linear-gradient(135deg,${merch?.brandPrimary||'var(--p)'},${merch?.brandSecondary||'var(--s)'})`, borderRadius: 18, padding: 20, textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 38, marginBottom: 9 }}>🎉</div>
                <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 18 }}>{selCp.rewardName}</p>
                <p style={{ fontSize: 12, opacity: .72, marginTop: 3 }}>{merch?.name}</p>
              </div>
              <PinInput value={pin} onChange={setPin} label="Ingresá tu PIN de 4 dígitos" />
              <Btn full sz="lg" onClick={doRedeem} disabled={pin.length !== 4}>Confirmar Canje</Btn>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
