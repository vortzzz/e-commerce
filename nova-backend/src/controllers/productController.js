// ─────────────────────────────────────────────────────────────────────────────
//  src/controllers/productController.js
//  GET /api/products
//  GET /api/products/:id
// ─────────────────────────────────────────────────────────────────────────────

const { findAll, findById } = require('../config/products');

// ── GET /api/products ─────────────────────────────────────────────────────────
// Query params opcionales: ?category=tech&search=teclado
const getProducts = (req, res) => {
  const { category, search } = req.query;
  const list = findAll({ category, search });

  res.json({
    success: true,
    data: {
      total:    list.length,
      products: list,
    },
  });
};

// ── GET /api/products/:id ─────────────────────────────────────────────────────
const getProductById = (req, res) => {
  const product = findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
  }
  res.json({ success: true, data: { product } });
};

module.exports = { getProducts, getProductById };
