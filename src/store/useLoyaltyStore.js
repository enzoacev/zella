import { useState, useCallback } from 'react'
import {
  PLANS,
  INITIAL_MERCHANTS, INITIAL_CUSTOMERS, INITIAL_CARDS,
  INITIAL_COUPONS, INITIAL_TRANSACTIONS, INITIAL_BILLING,
  INITIAL_GLOBAL_BRAND,
} from '../data/initialData'

export function useLoyaltyStore() {
  const [merchants,     setMerchants]    = useState(INITIAL_MERCHANTS)
  const [customers,     setCustomers]    = useState(INITIAL_CUSTOMERS)
  const [cards,         setCards]        = useState(INITIAL_CARDS)
  const [coupons,       setCoupons]      = useState(INITIAL_COUPONS)
  const [transactions,  setTransactions] = useState(INITIAL_TRANSACTIONS)
  const [billing,       setBilling]      = useState(INITIAL_BILLING)
  const [plans]                          = useState(PLANS)
  const [globalBrand,   setGlobalBrand]  = useState(INITIAL_GLOBAL_BRAND)

  // ── STAMPS ────────────────────────────────────────────────────────────────
  const addStamp = useCallback((merchantId, customerId, count = 1) => {
    const merch = merchants.find(m => m.id === merchantId)
    if (!merch) return { newCoupons: 0 }
    const goal = merch.rules.stampsGoal
    let newCouponsCount = 0

    setCards(prev => {
      const idx = prev.findIndex(c => c.merchantId === merchantId && c.customerId === customerId)
      const arr = [...prev]
      const card = idx === -1
        ? { id: `lc${Date.now()}`, merchantId, customerId, stamps: 0, totalStamps: 0, createdAt: new Date().toISOString() }
        : { ...arr[idx] }
      const raw = card.stamps + count
      newCouponsCount = Math.floor(raw / goal)
      card.stamps = raw % goal
      card.totalStamps = (card.totalStamps || 0) + count
      if (idx === -1) arr.push(card); else arr[idx] = card
      return arr
    })

    if (newCouponsCount > 0) {
      setCoupons(prev => {
        const arr = [...prev]
        for (let k = 0; k < newCouponsCount; k++) {
          const exp = new Date()
          exp.setDate(exp.getDate() + merch.rules.couponValidity)
          arr.push({
            id: `cp${Date.now()}_${k}`, merchantId, customerId,
            type: 'standard', status: 'pending',
            rewardName: merch.rules.rewardName,
            createdAt: new Date().toISOString(),
            expiresAt: exp.toISOString(),
          })
        }
        return arr
      })
    }

    setTransactions(prev => [...prev, {
      id: `t${Date.now()}`, merchantId, customerId,
      type: 'stamp', count, date: new Date().toISOString(),
    }])

    return { newCoupons: newCouponsCount }
  }, [merchants])

  // ── REDEEM COUPON ─────────────────────────────────────────────────────────
  const redeemCoupon = useCallback((couponId, pin, customerId) => {
    return new Promise((resolve, reject) => {
      const customer = customers.find(c => c.id === customerId)
      if (!customer || customer.pin !== pin) { reject('PIN incorrecto'); return }
      const coupon = coupons.find(c => c.id === couponId)
      if (!coupon)                            { reject('Cupón no encontrado'); return }
      if (coupon.status !== 'pending')        { reject('Cupón ya utilizado'); return }

      setCoupons(prev => prev.map(c =>
        c.id === couponId ? { ...c, status: 'redeemed', redeemedAt: new Date().toISOString() } : c
      ))
      setTransactions(prev => [...prev, {
        id: `t${Date.now()}`, merchantId: coupon.merchantId, customerId,
        type: 'redeem', couponId, date: new Date().toISOString(),
      }])
      resolve(coupon)
    })
  }, [customers, coupons])

  // ── MERCHANTS CRUD ────────────────────────────────────────────────────────
  const addMerchant = useCallback(m => setMerchants(prev => [...prev, {
    ...m,
    id: `m${Date.now()}`,
    customers: 0,
    active: true,
    joinDate: new Date().toISOString().split('T')[0],
  }]), [])

  const updateMerchant = useCallback((id, updates) =>
    setMerchants(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
  , [])

  const deleteMerchant = useCallback(id => {
    setMerchants(prev => prev.filter(m => m.id !== id))
    setCards(prev => prev.filter(c => c.merchantId !== id))
    setCoupons(prev => prev.filter(c => c.merchantId !== id))
    setTransactions(prev => prev.filter(t => t.merchantId !== id))
    setBilling(prev => prev.filter(b => b.merchantId !== id))
  }, [])

  const toggleMerchantActive = useCallback(id =>
    setMerchants(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m))
  , [])

  // ── CUSTOMERS CRUD ────────────────────────────────────────────────────────
  const addCustomer = useCallback(c => setCustomers(prev => [...prev, {
    ...c,
    id: `c${Date.now()}`,
    joinDate: new Date().toISOString().split('T')[0],
  }]), [])

  const updateCustomer = useCallback((id, updates) =>
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  , [])

  const deleteCustomer = useCallback(id => {
    setCustomers(prev => prev.filter(c => c.id !== id))
    setCards(prev => prev.filter(c => c.customerId !== id))
    setCoupons(prev => prev.filter(c => c.customerId !== id))
    setTransactions(prev => prev.filter(t => t.customerId !== id))
  }, [])

  // ── CARDS CRUD ────────────────────────────────────────────────────────────
  const updateCard = useCallback((id, updates) =>
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  , [])

  const deleteCard = useCallback(id => setCards(prev => prev.filter(c => c.id !== id)), [])

  // ── COUPONS CRUD ──────────────────────────────────────────────────────────
  const updateCoupon = useCallback((id, updates) =>
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  , [])

  const deleteCoupon = useCallback(id => setCoupons(prev => prev.filter(c => c.id !== id)), [])

  const issueCoupon = useCallback((merchantId, customerId) => {
    const merch = merchants.find(m => m.id === merchantId)
    if (!merch) return
    const exp = new Date()
    exp.setDate(exp.getDate() + merch.rules.couponValidity)
    setCoupons(prev => [...prev, {
      id: `cp${Date.now()}`, merchantId, customerId,
      type: 'manual', status: 'pending',
      rewardName: merch.rules.rewardName,
      createdAt: new Date().toISOString(),
      expiresAt: exp.toISOString(),
    }])
  }, [merchants])

  // ── GLOBAL BRAND ──────────────────────────────────────────────────────────
  const updateGlobalBrand = useCallback(updates =>
    setGlobalBrand(prev => ({ ...prev, ...updates }))
  , [])

  return {
    // state
    merchants, customers, cards, coupons, transactions, billing, plans, globalBrand,
    // actions
    addStamp, redeemCoupon,
    addMerchant, updateMerchant, deleteMerchant, toggleMerchantActive,
    addCustomer, updateCustomer, deleteCustomer,
    updateCard, deleteCard,
    updateCoupon, deleteCoupon, issueCoupon,
    updateGlobalBrand,
  }
}
