import { Stat } from '../../ui/primitives'
import { Badge } from '../../ui/primitives'

const fmtP = n => '$' + Math.round(n / 100).toLocaleString('es-AR')
const fmtD = s => s ? new Date(s).toLocaleDateString('es-AR') : '—'

export default function OverviewTab({ store }) {
  const mrr = store.merchants
    .filter(m => m.active)
    .reduce((s, m) => s + (store.plans.find(p => p.id === m.planId)?.price || 0), 0)

  return (
    <div>
      <p className="stitle">Dashboard Global</p>
      <p className="ssect">Métricas de la plataforma en tiempo real</p>

      <div className="g4" style={{ marginBottom: 22 }}>
        <Stat label="MRR"          val={fmtP(mrr)}                             sub="+12% vs anterior"              icon="💰" color="#10B981" delay={0} />
        <Stat label="Comercios"    val={store.merchants.filter(m => m.active).length} sub={`${store.merchants.length} total`} icon="🏪" color="#3B82F6" delay={70} />
        <Stat label="Socios"       val={store.customers.length}                sub="En la plataforma"              icon="👥" color="#8B5CF6" delay={140} />
        <Stat label="Transacciones" val={store.transactions.length}            sub="Registradas"                   icon="⚡" color="var(--p)"  delay={210} />
      </div>

      <div className="g2">
        {/* Plan distribution */}
        <div className="card fu" style={{ padding: 22, animationDelay: '280ms' }}>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 18 }}>
            Distribución de Planes
          </p>
          {store.plans.map(pl => {
            const cnt = store.merchants.filter(m => m.planId === pl.id).length
            const pct = (cnt / Math.max(store.merchants.length, 1)) * 100
            return (
              <div key={pl.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{pl.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--mut)' }}>{cnt} comercios · {fmtP(pl.price)}/mes</span>
                </div>
                <div style={{ height: 7, borderRadius: 99, background: 'var(--brd)' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: pl.color, width: `${pct}%`, transition: 'width 1s' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent transactions */}
        <div className="card fu" style={{ padding: 22, animationDelay: '340ms' }}>
          <p style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 18 }}>
            Últimas Transacciones
          </p>
          {store.transactions.slice(-7).reverse().map(tx => {
            const m = store.merchants.find(x => x.id === tx.merchantId)
            const c = store.customers.find(x => x.id === tx.customerId)
            return (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--brd)' }}>
                <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `color-mix(in srgb,${m?.branding.primary} 14%,transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                    {m?.branding.stampIcon}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{c?.name || '?'}</p>
                    <p style={{ fontSize: 10, color: 'var(--mut)' }}>{m?.name} · {fmtD(tx.date)}</p>
                  </div>
                </div>
                <Badge color={tx.type === 'stamp' ? '#3B82F6' : '#10B981'}>
                  {tx.type === 'stamp' ? `+${tx.count} sellos` : 'Canje'}
                </Badge>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
