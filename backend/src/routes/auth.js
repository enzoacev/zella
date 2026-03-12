const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const { JWT_SECRET }   = require('../middleware/auth')

const prisma = new PrismaClient()

// ── POST /api/auth/login  (admin + merchant) ──────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' })

  // Check admin first
  const admin = await prisma.admin.findUnique({ where: { email } })
  if (admin && await bcrypt.compare(password, admin.password)) {
    const token = jwt.sign({ id: admin.id, role: 'superadmin' }, JWT_SECRET, { expiresIn: '8h' })
    return res.json({ token, role: 'superadmin' })
  }

  // Check merchant
  const merchant = await prisma.merchant.findUnique({ where: { email } })
  if (!merchant) return res.status(401).json({ error: 'Credenciales incorrectas' })
  if (!await bcrypt.compare(password, merchant.password)) return res.status(401).json({ error: 'Credenciales incorrectas' })
  if (!merchant.active) return res.status(403).json({ error: 'Cuenta suspendida' })

  const token = jwt.sign({ id: merchant.id, role: 'merchant' }, JWT_SECRET, { expiresIn: '8h' })
  res.json({ token, role: 'merchant', merchant: sanitizeMerchant(merchant) })
})

// ── POST /api/auth/customer-login ─────────────────────────────────────────
router.post('/customer-login', async (req, res) => {
  const { dni, pin } = req.body
  if (!dni || !pin) return res.status(400).json({ error: 'DNI y PIN requeridos' })

  const customer = await prisma.customer.findUnique({ where: { dni } })
  if (!customer) return res.status(401).json({ error: 'DNI o PIN incorrecto' })
  if (!await bcrypt.compare(pin, customer.pin)) return res.status(401).json({ error: 'DNI o PIN incorrecto' })

  const token = jwt.sign({ id: customer.id, role: 'customer' }, JWT_SECRET, { expiresIn: '8h' })
  res.json({ token, role: 'customer', customer: sanitizeCustomer(customer) })
})

// ── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, dni, email, pin, birthDate } = req.body
  if (!name || !dni || !pin || pin.length !== 4) {
    return res.status(400).json({ error: 'Nombre, DNI y PIN de 4 dígitos son requeridos' })
  }

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
  })

  const token = jwt.sign({ id: customer.id, role: 'customer' }, JWT_SECRET, { expiresIn: '8h' })
  res.status(201).json({ token, role: 'customer', customer: sanitizeCustomer(customer) })
})

// ── Helpers ───────────────────────────────────────────────────────────────
function sanitizeMerchant(m) {
  const { password, ...rest } = m
  return {
    ...rest,
    branding: { primary: m.brandPrimary, secondary: m.brandSecondary, stampIcon: m.stampIcon, logoText: m.logoText },
    rules:    { stampsGoal: m.stampsGoal, rewardName: m.rewardName, couponValidity: m.couponValidity },
  }
}

function sanitizeCustomer(c) {
  const { pin, ...rest } = c
  return rest
}

module.exports = router
