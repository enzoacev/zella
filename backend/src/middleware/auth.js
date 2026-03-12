const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'zella_secret_dev'

function auth(requiredRole) {
  return (req, res, next) => {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' })

    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET)
      if (requiredRole && payload.role !== requiredRole && payload.role !== 'superadmin') {
        return res.status(403).json({ error: 'Acceso denegado' })
      }
      req.user = payload
      next()
    } catch {
      res.status(401).json({ error: 'Token inválido' })
    }
  }
}

module.exports = { auth, JWT_SECRET }
