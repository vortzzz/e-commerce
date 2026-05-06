// ─────────────────────────────────────────────────────────────────────────────
//  src/routes/products.js
// ─────────────────────────────────────────────────────────────────────────────

const { Router } = require('express');
const { getProducts, getProductById } = require('../controllers/productController');

const router = Router();

/**
 * GET /api/products
 * Query params: ?category=tech&search=teclado
 */
router.get('/', getProducts);

/**
 * GET /api/products/:id
 */
router.get('/:id', getProductById);

module.exports = router;
