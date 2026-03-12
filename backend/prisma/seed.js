const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const today = () => new Date().toISOString().split('T')[0]
const addDays = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

async function main() {
  console.log('🌱 Seeding database...')

  // Clean slate
  await prisma.transaction.deleteMany()
  await prisma.billing.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.card.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.merchant.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.globalBrand.deleteMany()

  // ── Admin ──────────────────────────────────────────────────────────────────
  await prisma.admin.create({
    data: {
      email:    'admin@zella.app',
      password: await bcrypt.hash('admin123', 10),
    },
  })

  // ── Global Brand ───────────────────────────────────────────────────────────
  await prisma.globalBrand.create({
    data: { id: 'global', name: 'ZELLA', subtitle: 'Loyalty Platform', primary: '#E85D26', secondary: '#2D6A4F' },
  })

  // ── Merchants ──────────────────────────────────────────────────────────────
  const merchants = await Promise.all([
    prisma.merchant.create({ data: {
      id: 'm1', email: 'cafe@zella.app', password: await bcrypt.hash('cafe123', 10),
      name: 'Café Selva', category: 'Cafetería', address: 'Av. Santa Fe 1234', phone: '11-4444-1234',
      planId: 'pro', joinDate: '2024-01-15',
      brandPrimary: '#6B4226', brandSecondary: '#2D6A4F', stampIcon: '☕', logoText: '',
      stampsGoal: 10, rewardName: 'Café Gratis', couponValidity: 30,
    }}),
    prisma.merchant.create({ data: {
      id: 'm2', email: 'pizza@zella.app', password: await bcrypt.hash('pizza123', 10),
      name: 'Pizza Napoli', category: 'Restaurante', address: 'Corrientes 5678', phone: '11-5555-5678',
      planId: 'basic', joinDate: '2024-02-20',
      brandPrimary: '#C0392B', brandSecondary: '#E67E22', stampIcon: '🍕', logoText: '',
      stampsGoal: 8, rewardName: 'Pizza Gratis', couponValidity: 15,
    }}),
    prisma.merchant.create({ data: {
      id: 'm3', email: 'sushi@zella.app', password: await bcrypt.hash('sushi123', 10),
      name: 'Sushi Zen', category: 'Restaurante', address: 'Recoleta 910', phone: '11-6666-9101',
      planId: 'enterprise', joinDate: '2024-03-10',
      brandPrimary: '#1A1A2E', brandSecondary: '#E94560', stampIcon: '🍣', logoText: '',
      stampsGoal: 12, rewardName: '20% Descuento', couponValidity: 60,
    }}),
    prisma.merchant.create({ data: {
      id: 'm4', email: 'burgers@zella.app', password: await bcrypt.hash('burgers123', 10),
      name: 'The Burger Lab', category: 'Fast Food', address: 'Palermo 321', phone: '11-7777-3210',
      planId: 'pro', joinDate: '2024-04-05',
      brandPrimary: '#FF6B35', brandSecondary: '#1B1B1B', stampIcon: '🍔', logoText: '',
      stampsGoal: 5, rewardName: 'Burger + Papas', couponValidity: 7,
    }}),
  ])

  // ── Customers ──────────────────────────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.create({ data: {
      id: 'cu1', dni: '30123456', name: 'Ana García',
      email: 'ana@email.com', pin: await bcrypt.hash('1234', 10),
      birthDate: '1990-03-15', joinDate: '2024-01-20',
    }}),
    prisma.customer.create({ data: {
      id: 'cu2', dni: '25678901', name: 'Carlos López',
      email: 'carlos@email.com', pin: await bcrypt.hash('5678', 10),
      birthDate: '1985-07-22', joinDate: '2024-02-10',
    }}),
    prisma.customer.create({ data: {
      id: 'cu3', dni: '33445566', name: 'María Rodríguez',
      email: 'maria@email.com', pin: await bcrypt.hash('9012', 10),
      birthDate: '1995-11-08', joinDate: '2024-03-01',
    }}),
  ])

  const [ana, carlos, maria] = customers

  // ── Cards ──────────────────────────────────────────────────────────────────
  const cards = await Promise.all([
    prisma.card.create({ data: { id: 'ca1', merchantId: 'm1', customerId: ana.id,   stamps: 7, totalStamps: 17, createdAt: '2024-01-20' }}),
    prisma.card.create({ data: { id: 'ca2', merchantId: 'm2', customerId: ana.id,   stamps: 3, totalStamps: 11, createdAt: '2024-01-25' }}),
    prisma.card.create({ data: { id: 'ca3', merchantId: 'm3', customerId: ana.id,   stamps: 5, totalStamps:  5, createdAt: '2024-02-01' }}),
    prisma.card.create({ data: { id: 'ca4', merchantId: 'm1', customerId: carlos.id, stamps: 4, totalStamps: 24, createdAt: '2024-02-10' }}),
    prisma.card.create({ data: { id: 'ca5', merchantId: 'm4', customerId: carlos.id, stamps: 2, totalStamps:  7, createdAt: '2024-03-05' }}),
    prisma.card.create({ data: { id: 'ca6', merchantId: 'm2', customerId: maria.id,  stamps: 6, totalStamps:  6, createdAt: '2024-03-01' }}),
  ])

  // ── Coupons ────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.coupon.create({ data: {
      id: 'cp1', merchantId: 'm1', customerId: ana.id, status: 'pending',
      rewardName: 'Café Gratis', type: 'stamp',
      createdAt: today(), expiresAt: addDays(30),
    }}),
    prisma.coupon.create({ data: {
      id: 'cp2', merchantId: 'm2', customerId: ana.id, status: 'redeemed',
      rewardName: 'Pizza Gratis', type: 'stamp',
      createdAt: '2024-02-10', expiresAt: '2024-02-25', redeemedAt: '2024-02-18',
    }}),
    prisma.coupon.create({ data: {
      id: 'cp3', merchantId: 'm4', customerId: carlos.id, status: 'pending',
      rewardName: 'Burger + Papas', type: 'stamp',
      createdAt: today(), expiresAt: addDays(7),
    }}),
  ])

  // ── Transactions ───────────────────────────────────────────────────────────
  const txData = [
    { merchantId: 'm1', customerId: ana.id,    type: 'stamp',  count: 3, createdAt: '2024-06-10' },
    { merchantId: 'm2', customerId: ana.id,    type: 'stamp',  count: 2, createdAt: '2024-06-12' },
    { merchantId: 'm1', customerId: carlos.id, type: 'stamp',  count: 1, createdAt: '2024-06-14' },
    { merchantId: 'm1', customerId: ana.id,    type: 'redeem', count: 1, createdAt: '2024-06-15' },
    { merchantId: 'm4', customerId: carlos.id, type: 'stamp',  count: 2, createdAt: '2024-06-16' },
    { merchantId: 'm3', customerId: ana.id,    type: 'stamp',  count: 5, createdAt: '2024-06-17' },
    { merchantId: 'm2', customerId: maria.id,  type: 'stamp',  count: 3, createdAt: '2024-06-18' },
  ]
  for (const tx of txData) {
    await prisma.transaction.create({ data: { ...tx, id: `tx_${Math.random().toString(36).slice(2)}` } })
  }

  // ── Billing ────────────────────────────────────────────────────────────────
  const billingData = [
    { merchantId: 'm1', plan: 'Pro',        amount: 4900, status: 'paid',   createdAt: '2024-06-01' },
    { merchantId: 'm2', plan: 'Básico',     amount: 1900, status: 'paid',   createdAt: '2024-06-01' },
    { merchantId: 'm3', plan: 'Enterprise', amount: 9900, status: 'paid',   createdAt: '2024-06-01' },
    { merchantId: 'm4', plan: 'Pro',        amount: 4900, status: 'paid',   createdAt: '2024-06-01' },
    { merchantId: 'm1', plan: 'Pro',        amount: 4900, status: 'paid',   createdAt: '2024-05-01' },
    { merchantId: 'm2', plan: 'Básico',     amount: 1900, status: 'overdue', createdAt: '2024-05-01' },
  ]
  for (const b of billingData) {
    await prisma.billing.create({ data: { ...b, id: `b_${Math.random().toString(36).slice(2)}` } })
  }

  console.log('✅ Seed complete!')
  console.log('   Super Admin: admin@zella.app / admin123')
  console.log('   Café Selva:  cafe@zella.app  / cafe123')
  console.log('   Socio Ana:   DNI 30123456    / PIN 1234')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
