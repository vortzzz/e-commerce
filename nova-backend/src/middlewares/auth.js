// ─────────────────────────────────────────────────────────────────────────────
//  src/middlewares/auth.js
//  Verifica el JWT enviado en el header Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const { Users } = require('../config/database');

/**
 * Middleware: requiere token válido. Adjunta req.user = { id, username, email }
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token requerido. Incluye Authorization: Bearer <token>',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = Users.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Usuario no encontrado.' });
    }
    req.user = { id: user.id, username: user.username, email: user.email };
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expirado.' : 'Token inválido.';
    return res.status(401).json({ success: false, error: msg });
  }
};

/**
 * Middleware opcional: si hay token lo procesa, si no, continúa sin usuario.
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = Users.findById(payload.sub);
  } catch (_) { /* continúa sin usuario */ }
  next();
};

module.exports = { requireAuth, optionalAuth };
