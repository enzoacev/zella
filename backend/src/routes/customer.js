const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { auth } = require('../middleware/auth')

const prisma = new PrismaClient()
const guard  = auth('customer')

// ── GET /api/customer/me ──────────────────────────────────────────────────
router.get('/me', guard, async (req, res) => {
  const customer = await prisma.customer.findUnique({ where: { id: req.user.id } })
  if (!customer) return res.status(404).json({ error: 'No encontrado' })
  const { pin, ...rest } = customer
  res.json(rest)
})

// ── GET /api/customer/wallet ──────────────────────────────────────────────
// Returns cards + coupons + merchants needed
router.get('/wallet', guard, async (req, res) => {
  const id = req.user.id

  const [cards, coupons, merchantIds] = await Promise.all([
    prisma.card.findMany({ where: { customerId: id } }),
    prisma.coupon.findMany({ where: { customerId: id }, orderBy: { createdAt: 'desc' } }),
    prisma.card.findMany({ where: { customerId: id }, select: { merchantId: true } }),
  ])

  const uniqueMerchantIds = [...new Set(merchantIds.map(c => c.merchantId))]
  const merchants = await prisma.merchant.findMany({
    where: { id: { in: uniqueMerchantIds } },
  })

  res.json({
    cards,
    coupons,
    merchants: merchants.map(({ password, ...m }) => m),
  })
})

// ── GET /api/customer/explore ─────────────────────────────────────────────
router.get('/explore', guard, async (req, res) => {
  const merchants = await prisma.merchant.findMany({ where: { active: true } })
  const cards     = await prisma.card.findMany({ where: { customerId: req.user.id } })
  res.json({
    merchants: merchants.map(({ password, ...m }) => m),
    cards,
  })
})

// ── POST /api/customer/redeem ─────────────────────────────────────────────
router.post('/redeem', guard, async (req, res) => {
  const { couponId, pin } = req.body
  const customerId = req.user.id

  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } })
  if (!coupon)                          return res.status(404).json({ error: 'Cupón no encontrado' })
  if (coupon.customerId !== customerId) return res.status(403).json({ error: 'No autorizado' })
  if (coupon.status !== 'pending')      return res.status(400).json({ error: 'Cupón ya usado o expirado' })

  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!await bcrypt.compare(pin, customer.pin)) return res.status(401).json({ error: 'PIN incorrecto' })

  const updated = await prisma.coupon.update({
    where: { id: couponId },
    data:  { status: 'redeemed', redeemedAt: new Date().toISOString().split('T')[0] },
  })

  await prisma.transaction.create({
    data: {
      merchantId: coupon.merchantId,
      customerId,
      type: 'redeem',
      count: 1,
      createdAt: new Date().toISOString().split('T')[0],
    },
  })

  res.json({ coupon: updated })
})

module.exports = router
