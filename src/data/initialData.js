export const PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    price: 4990,
    color: '#6B7280',
    features: ['punch_cards', 'qr_scan', 'customer_portal'],
    desc: 'Para empezar',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 14990,
    color: '#E6A540',
    features: ['punch_cards', 'qr_scan', 'customer_portal', 'custom_branding', 'push_notifications', 'birthday_rewards', 'analytics'],
    desc: 'El más popular',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 39990,
    color: '#8B5CF6',
    features: ['punch_cards', 'qr_scan', 'customer_portal', 'custom_branding', 'push_notifications', 'birthday_rewards', 'analytics', 'white_label', 'api_access', 'priority_support'],
    desc: 'Sin límites',
  },
]

export const FEATURE_NAMES = {
  punch_cards:        'Tarjetas de sellos',
  qr_scan:            'Escaneo QR',
  customer_portal:    'Portal del socio',
  custom_branding:    'Marca personalizada',
  push_notifications: 'Notificaciones push',
  birthday_rewards:   'Premios cumpleaños',
  analytics:          'Analíticas avanzadas',
  white_label:        'White-label completo',
  api_access:         'Acceso API',
  priority_support:   'Soporte prioritario',
}

export const INITIAL_MERCHANTS = [
  {
    id: 'm1', email: 'cafe@zella.app', password: 'cafe123',
    name: 'Café Selva', category: 'Cafetería', address: 'Av. Corrientes 1234, CABA', phone: '+54 11 4567-8901',
    planId: 'pro',
    branding: { primary: '#2D6A4F', secondary: '#1B4332', stampIcon: '☕', logoText: 'CS' },
    rules: { stampsGoal: 10, rewardName: 'Café Grande Gratis', couponValidity: 30 },
    customers: 847, active: true, joinDate: '2024-01-15',
  },
  {
    id: 'm2', email: 'pizza@zella.app', password: 'pizza123',
    name: 'Pizza Napoli', category: 'Restaurante', address: 'Belgrano 567, Rosario', phone: '+54 341 234-5678',
    planId: 'basic',
    branding: { primary: '#C62828', secondary: '#7F0000', stampIcon: '🍕', logoText: 'PN' },
    rules: { stampsGoal: 8, rewardName: 'Pizza Mediana Gratis', couponValidity: 15 },
    customers: 234, active: true, joinDate: '2024-03-02',
  },
  {
    id: 'm3', email: 'sushi@zella.app', password: 'sushi123',
    name: 'Sushi Zen', category: 'Restaurante', address: 'Palermo 890, CABA', phone: '+54 11 9876-5432',
    planId: 'enterprise',
    branding: { primary: '#1565C0', secondary: '#0D47A1', stampIcon: '🍣', logoText: 'SZ' },
    rules: { stampsGoal: 12, rewardName: 'Combo para 2 Gratis', couponValidity: 45 },
    customers: 1203, active: true, joinDate: '2023-11-20',
  },
  {
    id: 'm4', email: 'burgers@zella.app', password: 'burgers123',
    name: 'The Burger Lab', category: 'Hamburguesería', address: 'San Telmo 321, CABA', phone: '+54 11 5555-1234',
    planId: 'pro',
    branding: { primary: '#B45309', secondary: '#78350F', stampIcon: '🍔', logoText: 'BL' },
    rules: { stampsGoal: 8, rewardName: 'Burger + Papas Gratis', couponValidity: 21 },
    customers: 512, active: true, joinDate: '2024-02-01',
  },
]

export const INITIAL_CUSTOMERS = [
  { id: 'c1', dni: '30123456', name: 'Ana García',         email: 'ana@email.com',    pin: '1234', birthDate: '1990-03-15', joinDate: '2024-01-20' },
  { id: 'c2', dni: '25678901', name: 'Carlos López',       email: 'carlos@email.com', pin: '5678', birthDate: '1985-07-22', joinDate: '2024-02-10' },
  { id: 'c3', dni: '33445566', name: 'María Rodríguez',    email: 'maria@email.com',  pin: '9012', birthDate: '1995-11-08', joinDate: '2024-03-05' },
]

export const INITIAL_CARDS = [
  { id: 'lc1', merchantId: 'm1', customerId: 'c1', stamps: 7,  totalStamps: 17, createdAt: '2024-01-20' },
  { id: 'lc2', merchantId: 'm2', customerId: 'c1', stamps: 3,  totalStamps: 3,  createdAt: '2024-02-15' },
  { id: 'lc3', merchantId: 'm3', customerId: 'c1', stamps: 11, totalStamps: 23, createdAt: '2024-01-20' },
  { id: 'lc4', merchantId: 'm1', customerId: 'c2', stamps: 5,  totalStamps: 5,  createdAt: '2024-02-10' },
  { id: 'lc5', merchantId: 'm3', customerId: 'c3', stamps: 9,  totalStamps: 9,  createdAt: '2024-03-05' },
  { id: 'lc6', merchantId: 'm4', customerId: 'c1', stamps: 4,  totalStamps: 12, createdAt: '2024-03-10' },
]

export const INITIAL_COUPONS = [
  { id: 'cp1', merchantId: 'm1', customerId: 'c1', type: 'standard', status: 'pending',  rewardName: 'Café Grande Gratis',   createdAt: '2024-05-01', expiresAt: '2026-09-01' },
  { id: 'cp2', merchantId: 'm3', customerId: 'c1', type: 'standard', status: 'redeemed', rewardName: 'Combo para 2 Gratis',  createdAt: '2024-04-15', expiresAt: '2026-08-30', redeemedAt: '2024-04-20' },
  { id: 'cp3', merchantId: 'm3', customerId: 'c1', type: 'standard', status: 'pending',  rewardName: 'Combo para 2 Gratis',  createdAt: '2024-05-10', expiresAt: '2026-09-24' },
]

export const INITIAL_TRANSACTIONS = [
  { id: 't1', merchantId: 'm1', customerId: 'c1', type: 'stamp',  count: 3, date: '2024-05-20T10:30:00' },
  { id: 't2', merchantId: 'm1', customerId: 'c2', type: 'stamp',  count: 2, date: '2024-05-20T11:45:00' },
  { id: 't3', merchantId: 'm3', customerId: 'c1', type: 'redeem', couponId: 'cp2', date: '2024-04-20T14:00:00' },
  { id: 't4', merchantId: 'm4', customerId: 'c1', type: 'stamp',  count: 4, date: '2024-05-21T16:00:00' },
]

export const INITIAL_BILLING = [
  { id: 'b1', merchantId: 'm1', amount: 14990, status: 'paid', date: '2024-05-01' },
  { id: 'b2', merchantId: 'm2', amount:  4990, status: 'paid', date: '2024-05-01' },
  { id: 'b3', merchantId: 'm3', amount: 39990, status: 'paid', date: '2024-05-01' },
  { id: 'b4', merchantId: 'm4', amount: 14990, status: 'paid', date: '2024-05-01' },
]

export const INITIAL_GLOBAL_BRAND = {
  primary: '#E6A540',
  secondary: '#1E1B18',
  logoText: 'ZELLA',
  logoSub: 'Loyalty Platform',
}

export const STAMP_ICONS = ['☕','🍕','🍣','🍔','🧁','🍦','🎯','⭐','💎','🌟','🔥','✨','🍩','🎪','🏆','🥐','🍰','🧋']
export const CATEGORIES  = ['Cafetería','Restaurante','Hamburguesería','Panadería','Heladería','Bar','Pizzería','Sushi','Otro']
