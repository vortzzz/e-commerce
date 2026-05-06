// ─────────────────────────────────────────────────────────────────────────────
//  src/routes/orders.js
// ─────────────────────────────────────────────────────────────────────────────

const { Router } = require('express');
const { body }   = require('express-validator');
const { checkout, getOrders, getOrderById } = require('../controllers/orderController');
const { requireAuth } = require('../middlewares/auth');
const { validate }    = require('../middlewares/errorHandler');

const router = Router();

router.use(requireAuth);

/**
 * POST /api/checkout
 * Body: { paymentMethod: 'card'|'transfer'|'crypto', holderName: 'Juan Pérez' }
 */
router.post(
  '/checkout',
  [
    body('paymentMethod')
      .isIn(['card', 'transfer', 'crypto'])
      .withMessage('paymentMethod debe ser: card, transfer o crypto.'),
    body('holderName')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('holderName debe tener al menos 3 caracteres.'),
  ],
  validate,
  checkout,
);

/**
 * GET /api/orders
 * Historial de órdenes del usuario autenticado.
 */
router.get('/orders', getOrders);

/**
 * GET /api/orders/:orderId
 */
router.get('/orders/:orderId', getOrderById);

module.exports = router;
