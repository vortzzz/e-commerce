// ─────────────────────────────────────────────────────────────────────────────
//  src/routes/auth.js
// ─────────────────────────────────────────────────────────────────────────────

const { Router } = require('express');
const { body }   = require('express-validator');
const { register, login, logout, me } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');
const { validate }    = require('../middlewares/errorHandler');

const router = Router();

/**
 * POST /api/auth/register
 * Crea un nuevo usuario.
 */
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('El username debe tener entre 3 y 30 caracteres.')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('El username solo puede contener letras, números y guiones bajos.'),
    body('email')
      .isEmail()
      .withMessage('Correo electrónico inválido.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres.'),
  ],
  validate,
  register,
);

/**
 * POST /api/auth/login
 * Inicia sesión. Acepta username o email en el campo "username".
 */
router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('El usuario o correo es requerido.'),
    body('password').notEmpty().withMessage('La contraseña es requerida.'),
  ],
  validate,
  login,
);

/**
 * POST /api/auth/logout   🔒 Requiere token
 */
router.post('/logout', requireAuth, logout);

/**
 * GET /api/auth/me        🔒 Requiere token
 * Retorna el perfil del usuario autenticado.
 */
router.get('/me', requireAuth, me);

module.exports = router;
