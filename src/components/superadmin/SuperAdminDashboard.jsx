import { useState, useEffect, useCallback } from 'react'
import { TopBar }    from '../ui/TopBar'
import { Btn, Badge } from '../ui/primitives'
import OverviewTab    from './tabs/OverviewTab'
import MerchantsTab   from './tabs/MerchantsTab'
import CustomersTab   from './tabs/CustomersTab'
import { PlansTab, BrandingTab, BillingTab } from './tabs/OtherTabs'
import { admin as adminApi } from '../../services/api'

const TABS = [
  { id: 'overview',   icon: '📊', label: 'Overview'    },
  { id: 'merchants',  icon: '🏪', label: 'Comercios'   },
  { id: 'customers',  icon: '👥', label: 'Socios'      },
  { id: 'plans',      icon: '📦', label: 'Planes'      },
  { id: 'branding',   icon: '🎨', label: 'Marca'       },
  { id: 'billing',    icon: '💳', label: 'Facturación' },
]

export default function SuperAdminDashboard({ toast, onLogout }) {
  const [tab,   setTab]   = useState('overview')
  const [data,  setData]  = useState(null)
  const [brand, setBrand] = useState({ name: 'ZELLA', primary: '#E85D26', secondary: '#2D6A4F' })

  const reload = useCallback(async () => {
    try {
      const overview = await adminApi.overview()
      setData(overview)
    } catch (e) {
      toast(e.message, 'error')
    }
  }, [toast])

  useEffect(() => { reload() }, [reload])
  useEffect(() => {
    adminApi.getBrand().then(b => setBrand(b)).catch(() => {})
  }, [])

  // Build a store-like object so tabs don't need full rewrite
  const store = data ? {
    merchants:   data.merchants,
    customers:   data.customers,
    cards:       data.cards,
    coupons:     data.coupons,
    transactions: data.transactions,
    billing:     data.billing,
    plans:       data.plans,
    stats:       data.stats,
    globalBrand: brand,
    // Actions proxied to API
    addMerchant:    async (b)    => { await adminApi.addMerchant(b);             await reload() },
    updateMerchant: async (id,b) => { await adminApi.updateMerchant(id,b);      await reload() },
    deleteMerchant: async (id)   => { await adminApi.deleteMerchant(id);        await reload() },
    addCustomer:    async (b)    => { await adminApi.addCustomer(b);             await reload() },
    updateCustomer: async (id,b) => { await adminApi.updateCustomer(id,b);      await reload() },
    deleteCustomer: async (id)   => { await adminApi.deleteCustomer(id);        await reload() },
    stampCustomer:  async (id,b) => { await adminApi.stampCustomer(id,b);       await reload() },
    issueCoupon:    async (id,b) => { await adminApi.issueCoupon(id,b);         await reload() },
    deleteCard:     async (id)   => { await adminApi.deleteCard(id);            await reload() },
    deleteCoupon:   async (id)   => { await adminApi.deleteCoupon(id);          await reload() },
    updateGlobalBrand: async (b) => { const nb = await adminApi.updateBrand(b); setBrand(nb); await reload() },
  } : null

  if (!store) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <p style={{ color: 'var(--mut)' }}>Cargando datos…</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <TopBar
        logo={{ icon: brand.name?.[0] || 'Z', name: brand.name, sub: 'Super Admin' }}
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Badge color="#E6A540">Super Admin</Badge>
            <Btn v="gw" sz="sm" onClick={onLogout}>Salir</Btn>
          </div>
        }
      />

      <div style={{ padding: '26px 28px', maxWidth: 1200, margin: '0 auto' }}>
        {tab === 'overview'  && <OverviewTab  store={store} />}
        {tab === 'merchants' && <MerchantsTab store={store} toast={toast} />}
        {tab === 'customers' && <CustomersTab store={store} toast={toast} />}
        {tab === 'plans'     && <PlansTab     store={store} />}
        {tab === 'branding'  && <BrandingTab  store={store} toast={toast} />}
        {tab === 'billing'   && <BillingTab   store={store} />}
      </div>
    </div>
  )
}
