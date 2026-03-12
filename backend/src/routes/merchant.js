const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const { auth } = require('../middleware/auth')

const prisma = new PrismaClient()
const guard  = auth('merchant')

// ── GET /api/merchant/me ──────────────────────────────────────────────────
router.get('/me', guard, async (req, res) => {
  const merchant = await prisma.merchant.findUnique({ where: { id: req.user.id } })
  if (!merchant) return res.status(404).json({ error: 'No encontrado' })
  const { password, ...rest } = merchant
  res.json(rest)
})

// ── GET /api/merchant/stats ───────────────────────────────────────────────
router.get('/stats', guard, async (req, res) => {
  const id = req.user.id
  const [cards, coupons, transactions] = await Promise.all([
    prisma.card.findMany({ where: { merchantId: id }, include: { customer: true } }),
    prisma.coupon.findMany({ where: { merchantId: id } }),
    prisma.transaction.findMany({ where: { merchantId: id }, orderBy: { createdAt: 'desc' }, take: 30 }),
  ])
  res.json({ cards, coupons, transactions })
})

// ── POST /api/merchant/stamp ──────────────────────────────────────────────
router.post('/stamp', guard, async (req, res) => {
  const { customerId, count = 1 } = req.body
  const merchantId = req.user.id

  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } })
  if (!merchant) return res.status(404).json({ error: 'Comercio no encontrado' })

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer) return res.status(404).json({ error: 'Socio no encontrado' })

  let card = await prisma.card.findUnique({ where: { merchantId_customerId: { merchantId, customerId } } })
  if (!card) {
    card = await prisma.card.create({
      data: { merchantId, customerId, stamps: 0, totalStamps: 0, createdAt: new Date().toISOString().split('T')[0] },
    })
  }

  const goal      = merchant.stampsGoal
  const newStamps = card.stamps + count
  const completed = Math.floor(newStamps / goal) - Math.floor(card.stamps / goal)

  const updatedCard = await prisma.card.update({
    where: { id: card.id },
    data:  { stamps: newStamps % goal, totalStamps: card.totalStamps + count },
  })

  const newCoupons = []
  for (let i = 0; i < completed; i++) {
    const exp = new Date()
    exp.setDate(exp.getDate() + merchant.couponValidity)
    const cp = await prisma.coupon.create({
      data: {
        merchantId, customerId, rewardName: merchant.rewardName, type: 'stamp',
        createdAt: new Date().toISOString().split('T')[0],
        expiresAt: exp.toISOString().split('T')[0],
      },
    })
    newCoupons.push(cp)
  }

  await prisma.transaction.create({
    data: { merchantId, customerId, type: 'stamp', count, createdAt: new Date().toISOString().split('T')[0] },
  })

  res.json({ card: updatedCard, customer, couponsGenerated: completed, newCoupons })
})

// ── GET /api/merchant/customer-by-dni/:dni ────────────────────────────────
router.get('/customer-by-dni/:dni', guard, async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { dni: req.params.dni } })
  if (!customer) return res.status(404).json({ error: 'Socio no encontrado' })

  const card = await prisma.card.findUnique({
    where: { merchantId_customerId: { merchantId: req.user.id, customerId: customer.id } },
  })

  const { pin, ...safeCustomer } = customer
  res.json({ customer: safeCustomer, card })
})

// ── PUT /api/merchant/brand ───────────────────────────────────────────────
router.put('/brand', guard, async (req, res) => {
  const { brandPrimary, brandSecondary, stampIcon, logoText } = req.body
  const merchant = await prisma.merchant.update({
    where: { id: req.user.id },
    data:  { brandPrimary, brandSecondary, stampIcon, logoText },
  })
  const { password, ...rest } = merchant
  res.json(rest)
})

// ── PUT /api/merchant/rules ───────────────────────────────────────────────
router.put('/rules', guard, async (req, res) => {
  const { stampsGoal, rewardName, couponValidity } = req.body
  const merchant = await prisma.merchant.update({
    where: { id: req.user.id },
    data:  { stampsGoal, rewardName, couponValidity },
  })
  const { password, ...rest } = merchant
  res.json(rest)
})

module.exports = router
