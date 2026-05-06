// ─────────────────────────────────────────────────────────────────────────────
//  src/controllers/productController.js
//  GET /api/products
//  GET /api/products/:id
// ─────────────────────────────────────────────────────────────────────────────

const { query } = require('../config/database');

// ── GET /api/products ─────────────────────────────────────────────────────────
// Query params opcionales: ?category=tech&search=teclado
const getProducts = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filters = [];
    const params = [];

    if (category) {
      params.push(category);
      filters.push(`category = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      filters.push(`name ILIKE $${params.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const result = await query(
      `SELECT id, name, category, emoji, description, price, stock
       FROM products
       ${whereClause}
       ORDER BY created_at ASC, id ASC`,
      params,
    );

    res.json({
      success: true,
      data: {
        total: result.rows.length,
        products: result.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/products/:id ─────────────────────────────────────────────────────
const getProductById = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, category, emoji, description, price, stock
       FROM products
       WHERE id = $1`,
      [req.params.id],
    );

    const product = result.rows[0];
    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }

    res.json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProductById };
