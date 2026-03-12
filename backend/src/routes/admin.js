const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { auth } = require('../middleware/auth')

const prisma = new PrismaClient()
const guard  = auth('superadmin')

const PLANS = {
  basic:      { id: 'basic',      name: 'Básico',     price: 1900, color: '#6B7280' },
  pro:        { id: 'pro',        name: 'Pro',         price: 4900, color: '#3B82F6' },
  enterprise: { id: 'enterprise', name: 'Enterprise',  price: 9900, color: '#8B5CF6' },
}

// ── GET /api/admin/overview ───────────────────────────────────────────────
router.get('/overview', guard, async (req, res) => {
  const [merchants, customers, cards, coupons, transactions, billing] = await Promise.all([
    prisma.merchant.findMany(),
    prisma.customer.findMany(),
    prisma.card.findMany(),
    prisma.coupon.findMany(),
    prisma.transaction.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.billing.findMany({ where: { status: 'paid' } }),
  ])

  const mrr = billing
    .filter(b => b.createdAt.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, b) => s + b.amount, 0)

  res.json({
    merchants, customers, cards, coupons, transactions, billing,
    stats: {
      totalMerchants:  merchants.length,
      activeMerchants: merchants.filter(m => m.active).length,
      totalCustomers:  customers.length,
      totalStamps:     cards.reduce((s, c) => s + c.totalStamps, 0),
      mrr,
    },
    plans: Object.values(PLANS).map(p => ({
      ...p,
      merchantCount: merchants.filter(m => m.planId === p.id).length,
    })),
  })
})

// ── MERCHANTS ─────────────────────────────────────────────────────────────

router.get('/merchants', guard, async (req, res) => {
  const merchants = await prisma.merchant.findMany({ orderBy: { joinDate: 'desc' } })
  res.json(merchants.map(sanitize))
})

router.post('/merchants', guard, async (req, res) => {
  const { email, password, name, category, address, phone, planId,
          brandPrimary, brandSecondary, stampIcon,
          stampsGoal, rewardName, couponValidity } = req.body
  if (!email || !password || !name) return res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' })

  const exists = await prisma.merchant.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'Ya existe un comercio con ese email' })

  const merchant = await prisma.merchant.create({
    data: {
      email, name,
      password:       await bcrypt.hash(password, 10),
      category:       category  || '',
      address:        address   || '',
      phone:          phone     || '',
      planId:         planId    || 'basic',
      brandPrimary:   brandPrimary   || '#E85D26',
      brandSecondary: brandSecondary || '#2D6A4F',
      stampIcon:      stampIcon || '⭐',
      stampsGoal:     stampsGoal || 10,
      rewardName:     rewardName || 'Premio',
      couponValidity: couponValidity || 30,
      joinDate:       new Date().toISOString().split('T')[0],
    },
  })
  res.status(201).json(sanitize(merchant))
})

router.put('/merchants/:id', guard, async (req, res) => {
  const { password, ...data } = req.body
  const update = { ...data }
  if (password) update.password = await bcrypt.hash(password, 10)

  const merchant = await prisma.merchant.update({
    where: { id: req.params.id },
    data:  update,
  })
  res.json(sanitize(merchant))
})

router.delete('/merchants/:id', guard, async (req, res) => {
  await prisma.merchant.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

// ── CUSTOMERS ─────────────────────────────────────────────────────────────

router.get('/customers', guard, async (req, res) => {
  const customers = await prisma.customer.findMany({
    orderBy: { joinDate: 'desc' },
    include: { cards: true, coupons: true, transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
  })
  res.json(customers.map(sanitizeCust))
})

router.post('/customers', guard, async (req, res) => {
  const { name, dni, email, pin, birthDate } = req.body
  if (!name || !dni || !pin) return res.status(400).json({ error: 'Nombre, DNI y PIN son requeridos' })

  const exists = await prisma.customer.findUnique({ where: { dni } })
  if (exists) return res.status(409).json({ error: 'Ya existe un socio con ese DNI' })

  const customer = await prisma.customer.create({
    data: {
      name, dni,
      email:     email || '',
      pin:       await bcrypt.hash(pin, 10),
      birthDate: birthDate || '',
      joinDate:  new Date().toISOString().split('T')[0],
    },
    include: { cards: true, coupons: true, transactions: true },
  })
  res.status(201).json(sanitizeCust(customer))
})

router.put('/customers/:id', guard, async (req, res) => {
  const { pin, ...data } = req.body
  const update = { ...data }
  if (pin) update.pin = await bcrypt.hash(pin, 10)

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data:  update,
    include: { cards: true, coupons: true, transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
  })
  res.json(sanitizeCust(customer))
})

router.delete('/customers/:id', guard, async (req, res) => {
  await prisma.customer.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

// Manual stamp for a customer (from admin)
router.post('/customers/:id/stamp', guard, async (req, res) => {
  const { merchantId, count = 1 } = req.body
  const customerId = req.params.id

  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } })
  if (!merchant) return res.status(404).json({ error: 'Comercio no encontrado' })

  let card = await prisma.card.findUnique({ where: { merchantId_customerId: { merchantId, customerId } } })
  if (!card) {
    card = await prisma.card.create({
      data: { merchantId, customerId, stamps: 0, totalStamps: 0, createdAt: new Date().toISOString().split('T')[0] },
    })
  }

  const newStamps = card.stamps + count
  const goal      = merchant.stampsGoal
  const completed = Math.floor(newStamps / goal) - Math.floor(card.stamps / goal)

  await prisma.card.update({
    where: { id: card.id },
    data:  { stamps: newStamps % goal, totalStamps: card.totalStamps + count },
  })

  for (let i = 0; i < completed; i++) {
    const exp = new Date()
    exp.setDate(exp.getDate() + merchant.couponValidity)
    await prisma.coupon.create({
      data: {
        merchantId, customerId, rewardName: merchant.rewardName, type: 'stamp',
        createdAt: new Date().toISOString().split('T')[0],
        expiresAt: exp.toISOString().split('T')[0],
      },
    })
  }

  await prisma.transaction.create({
    data: { merchantId, customerId, type: 'stamp', count, createdAt: new Date().toISOString().split('T')[0] },
  })

  res.json({ ok: true, couponsGenerated: completed })
})

// Issue manual coupon
router.post('/customers/:id/coupon', guard, async (req, res) => {
  const { merchantId } = req.body
  const customerId = req.params.id

  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } })
  if (!merchant) return res.status(404).json({ error: 'Comercio no encontrado' })

  const exp = new Date()
  exp.setDate(exp.getDate() + merchant.couponValidity)

  const coupon = await prisma.coupon.create({
    data: {
      merchantId, customerId, rewardName: merchant.rewardName, type: 'manual',
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: exp.toISOString().split('T')[0],
    },
  })
  res.status(201).json(coupon)
})

// Delete individual card
router.delete('/cards/:id', guard, async (req, res) => {
  await prisma.card.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

// Delete individual coupon
router.delete('/coupons/:id', guard, async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

// ── BRAND ─────────────────────────────────────────────────────────────────

router.get('/brand', guard, async (req, res) => {
  let brand = await prisma.globalBrand.findUnique({ where: { id: 'global' } })
  if (!brand) brand = await prisma.globalBrand.create({ data: {} })
  res.json(brand)
})

router.put('/brand', guard, async (req, res) => {
  const brand = await prisma.globalBrand.upsert({
    where:  { id: 'global' },
    update: req.body,
    create: { id: 'global', ...req.body },
  })
  res.json(brand)
})

// ── BILLING ───────────────────────────────────────────────────────────────

router.get('/billing', guard, async (req, res) => {
  const billing = await prisma.billing.findMany({
    orderBy: { createdAt: 'desc' },
    include: { merchant: { select: { name: true } } },
  })
  res.json(billing)
})

// ── PLANS ─────────────────────────────────────────────────────────────────

router.get('/plans', guard, async (req, res) => {
  const merchants = await prisma.merchant.findMany({ select: { planId: true } })
  res.json(Object.values(PLANS).map(p => ({
    ...p,
    merchantCount: merchants.filter(m => m.planId === p.id).length,
  })))
})

// ── Helpers ───────────────────────────────────────────────────────────────
function sanitize(m) {
  const { password, ...rest } = m
  return rest
}

function sanitizeCust(c) {
  const { pin, ...rest } = c
  return rest
}

module.exports = router
