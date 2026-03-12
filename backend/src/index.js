require('dotenv').config()
const express = require('express')
const cors    = require('cors')

const authRoutes     = require('./routes/auth')
const adminRoutes    = require('./routes/admin')
const merchantRoutes = require('./routes/merchant')
const customerRoutes = require('./routes/customer')

const app  = express()
const PORT = process.env.PORT || 3001

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

// Request logger in dev
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
  })
}

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/admin',    adminRoutes)
app.use('/api/merchant', merchantRoutes)
app.use('/api/customer', customerRoutes)

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

// ── 404 / Error handlers ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
})

app.listen(PORT, () => {
  console.log(`🚀 Zella API running on http://localhost:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
})
