// ─────────────────────────────────────────────────────────────────────────────
//  src/routes/cart.js
// ─────────────────────────────────────────────────────────────────────────────

const { Router }      = require('express');
const { body, param } = require('express-validator');
const { getCart, addItem, updateItem, removeItem, clearCart } = require('../controllers/cartController');
const { requireAuth } = require('../middlewares/auth');
const { validate }    = require('../middlewares/errorHandler');

const router = Router();

// Todas las rutas del carrito requieren autenticación
router.use(requireAuth);

/**
 * GET /api/cart
 */
router.get('/', getCart);

/**
 * POST /api/cart/items
 * Body: { productId: "1", qty: 2 }
 */
router.post(
  '/items',
  [
    body('productId').notEmpty().withMessage('productId es requerido.'),
    body('qty').optional().isInt({ min: 1 }).withMessage('qty debe ser un entero >= 1.'),
  ],
  validate,
  addItem,
);

/**
 * PUT /api/cart/items/:productId
 * Body: { qty: 3 }  — qty: 0 elimina el producto
 */
router.put(
  '/items/:productId',
  [
    param('productId').notEmpty().withMessage('productId inválido.'),
    body('qty').isInt({ min: 0 }).withMessage('qty debe ser un entero >= 0.'),
  ],
  validate,
  updateItem,
);

/**
 * DELETE /api/cart/items/:productId
 */
router.delete('/items/:productId', removeItem);

/**
 * DELETE /api/cart
 */
router.delete('/', clearCart);

module.exports = router;
