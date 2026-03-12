import { useState, useEffect } from 'react'
import { useToast }    from './hooks/useToast'
import { Toasts }      from './components/ui/primitives'
import { setToken, clearToken, getToken, auth as authApi } from './services/api'
import Login               from './components/auth/Login'
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard'
import MerchantDashboard   from './components/merchant/MerchantDashboard'
import CustomerPortal      from './components/customer/CustomerPortal'

export default function App() {
  const { toasts, toast }     = useToast()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    const saved = localStorage.getItem('zella_session')
    if (token && saved) {
      try { setSession(JSON.parse(saved)) }
      catch { clearToken(); localStorage.removeItem('zella_session') }
    }
    setLoading(false)
  }, [])

  const handleLogin = async (credentials) => {
    let result
    if (credentials.type === 'merchant') {
      result = await authApi.login({ email: credentials.email, password: credentials.password })
      const sess = { role: result.role, data: result.merchant }
      setToken(result.token)
      localStorage.setItem('zella_session', JSON.stringify(sess))
      if (result.merchant) {
        document.documentElement.style.setProperty('--p', result.merchant.brandPrimary)
        document.documentElement.style.setProperty('--s', result.merchant.brandSecondary)
      }
      setSession(sess)
    } else if (credentials.type === 'customer') {
      result = await authApi.customerLogin({ dni: credentials.dni, pin: credentials.pin })
      const sess = { role: 'customer', data: result.customer }
      setToken(result.token)
      localStorage.setItem('zella_session', JSON.stringify(sess))
      setSession(sess)
    } else if (credentials.type === 'register') {
      result = await authApi.register(credentials)
      const sess = { role: 'customer', data: result.customer }
      setToken(result.token)
      localStorage.setItem('zella_session', JSON.stringify(sess))
      setSession(sess)
    }
  }

  const handleLogout = () => {
    clearToken()
    localStorage.removeItem('zella_session')
    document.documentElement.style.setProperty('--p', '#E85D26')
    document.documentElement.style.setProperty('--s', '#2D6A4F')
    setSession(null)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg,var(--p),var(--s))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 26, color: '#fff' }}>Z</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--mut)' }}>Cargando…</p>
      </div>
    </div>
  )

  return (
    <>
      {!session && <Login onLogin={handleLogin} />}
      {session?.role === 'superadmin' && <SuperAdminDashboard toast={toast} onLogout={handleLogout} />}
      {session?.role === 'merchant'   && <MerchantDashboard merchant={session.data} toast={toast} onLogout={handleLogout} />}
      {session?.role === 'customer'   && <CustomerPortal customer={session.data} toast={toast} onLogout={handleLogout} />}
      <Toasts toasts={toasts} />
    </>
  )
}
