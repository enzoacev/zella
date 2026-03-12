const BASE = import.meta.env.VITE_API_URL || '/api'

let _token = localStorage.getItem('zella_token') || ''

export const setToken = t  => { _token = t; localStorage.setItem('zella_token', t) }
export const clearToken = () => { _token = ''; localStorage.removeItem('zella_token') }
export const getToken  = () => _token

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...((_token) ? { Authorization: `Bearer ${_token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error desconocido')
  return data
}

const get  = path       => req('GET',    path)
const post = (path, b)  => req('POST',   path, b)
const put  = (path, b)  => req('PUT',    path, b)
const del  = path       => req('DELETE', path)

// ── Auth ──────────────────────────────────────────────────────────────────
export const auth = {
  login:          b => post('/auth/login',           b),
  customerLogin:  b => post('/auth/customer-login',  b),
  register:       b => post('/auth/register',        b),
}

// ── Admin ─────────────────────────────────────────────────────────────────
export const admin = {
  overview:       ()   => get('/admin/overview'),
  getMerchants:   ()   => get('/admin/merchants'),
  addMerchant:    b    => post('/admin/merchants',    b),
  updateMerchant: (id, b) => put(`/admin/merchants/${id}`, b),
  deleteMerchant: id   => del(`/admin/merchants/${id}`),

  getCustomers:   ()   => get('/admin/customers'),
  addCustomer:    b    => post('/admin/customers',    b),
  updateCustomer: (id, b) => put(`/admin/customers/${id}`, b),
  deleteCustomer: id   => del(`/admin/customers/${id}`),
  stampCustomer:  (id, b) => post(`/admin/customers/${id}/stamp`,  b),
  issueCoupon:    (id, b) => post(`/admin/customers/${id}/coupon`, b),
  deleteCard:     id   => del(`/admin/cards/${id}`),
  deleteCoupon:   id   => del(`/admin/coupons/${id}`),

  getBrand:       ()   => get('/admin/brand'),
  updateBrand:    b    => put('/admin/brand',    b),

  getBilling:     ()   => get('/admin/billing'),
  getPlans:       ()   => get('/admin/plans'),
}

// ── Merchant ──────────────────────────────────────────────────────────────
export const merchant = {
  me:             ()   => get('/merchant/me'),
  stats:          ()   => get('/merchant/stats'),
  stamp:          b    => post('/merchant/stamp',  b),
  findByDni:      dni  => get(`/merchant/customer-by-dni/${dni}`),
  updateBrand:    b    => put('/merchant/brand',  b),
  updateRules:    b    => put('/merchant/rules',  b),
}

// ── Customer ──────────────────────────────────────────────────────────────
export const customer = {
  me:             ()   => get('/customer/me'),
  wallet:         ()   => get('/customer/wallet'),
  explore:        ()   => get('/customer/explore'),
  redeem:         b    => post('/customer/redeem', b),
}
