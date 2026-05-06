// ─────────────────────────────────────────────────────────────────────────────
//  src/controllers/cartController.js
//  GET    /api/cart
//  POST   /api/cart/items
//  PUT    /api/cart/items/:productId
//  DELETE /api/cart/items/:productId
//  DELETE /api/cart
// ─────────────────────────────────────────────────────────────────────────────

const { v4: uuidv4 } = require('uuid');
const { Carts, query } = require('../config/database');

/** Enriquece los items del carrito con datos del producto */
const buildCartView = async (cart) => {
  const result = await query(
    `SELECT
       ci.product_id AS "productId",
       ci.qty,
       COALESCE(p.name, 'Producto eliminado') AS name,
       COALESCE(p.emoji, '📦') AS emoji,
       COALESCE(p.price, 0) AS price,
       COALESCE(p.category, '') AS category
     FROM cart_items ci
     LEFT JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC`,
    [cart.id],
  );

  const items = result.rows.map((item) => ({
    ...item,
    subtotal: Number(item.price) * item.qty,
  }));
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    id: cart.id,
    userId: cart.userId,
    items,
    itemCount: items.reduce((sum, item) => sum + item.qty, 0),
    total,
    updatedAt: cart.updatedAt,
  };
};

/** Obtiene o crea el carrito del usuario autenticado */
const getOrCreateCart = async (userId) => {
  let cart = await Carts.findByUserId(userId);
  if (!cart) {
    cart = await Carts.create({
      id: uuidv4(),
      userId,
      updatedAt: new Date().toISOString(),
    });
  }
  return cart;
};

// ── GET /api/cart ─────────────────────────────────────────────────────────────
const getCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const cartView = await buildCartView(cart);
    res.json({ success: true, data: { cart: cartView } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/cart/items ──────────────────────────────────────────────────────
// Body: { productId: "1", qty: 2 }
const addItem = async (req, res, next) => {
  try {
    const { productId, qty = 1 } = req.body;
    const quantity = Math.max(1, parseInt(qty, 10));
    const productIdValue = String(productId);

    const productResult = await query('SELECT id, name FROM products WHERE id = $1', [productIdValue]);
    const product = productResult.rows[0];
    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }

    const cart = await getOrCreateCart(req.user.id);
    await query(
      `INSERT INTO cart_items (cart_id, product_id, qty, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty`,
      [cart.id, productIdValue, quantity],
    );
    const updatedAt = new Date().toISOString();
    await query('UPDATE carts SET updated_at = $1 WHERE id = $2', [updatedAt, cart.id]);

    console.log(`[CART] +${quantity} × ${product.name} → usuario ${req.user.username}`);
    const cartView = await buildCartView({ ...cart, updatedAt });

    res.status(200).json({
      success: true,
      message: `"${product.name}" agregado al carrito.`,
      data: { cart: cartView },
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/cart/items/:productId ────────────────────────────────────────────
// Body: { qty: 3 }
const updateItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const qty = parseInt(req.body.qty, 10);

    if (Number.isNaN(qty) || qty < 0) {
      return res.status(422).json({ success: false, error: 'qty debe ser un entero >= 0.' });
    }

    const cart = await getOrCreateCart(req.user.id);
    const existing = await query(
      `SELECT 1
       FROM cart_items
       WHERE cart_id = $1 AND product_id = $2`,
      [cart.id, productId],
    );
    if (existing.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'El producto no está en el carrito.' });
    }

    if (qty === 0) {
      await query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cart.id, productId]);
    } else {
      await query('UPDATE cart_items SET qty = $1 WHERE cart_id = $2 AND product_id = $3', [qty, cart.id, productId]);
    }

    const updatedAt = new Date().toISOString();
    await query('UPDATE carts SET updated_at = $1 WHERE id = $2', [updatedAt, cart.id]);
    const cartView = await buildCartView({ ...cart, updatedAt });

    res.json({
      success: true,
      message: qty === 0 ? 'Producto eliminado del carrito.' : 'Cantidad actualizada.',
      data: { cart: cartView },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/cart/items/:productId ─────────────────────────────────────────
const removeItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await getOrCreateCart(req.user.id);
    const removeResult = await query(
      `DELETE FROM cart_items
       WHERE cart_id = $1 AND product_id = $2
       RETURNING product_id`,
      [cart.id, productId],
    );

    if (removeResult.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'El producto no está en el carrito.' });
    }

    const updatedAt = new Date().toISOString();
    await query('UPDATE carts SET updated_at = $1 WHERE id = $2', [updatedAt, cart.id]);

    console.log(`[CART] Eliminado productId ${productId} → usuario ${req.user.username}`);
    const cartView = await buildCartView({ ...cart, updatedAt });

    res.json({
      success: true,
      message: 'Producto eliminado del carrito.',
      data: { cart: cartView },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/cart ──────────────────────────────────────────────────────────
const clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    await query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
    const updatedAt = new Date().toISOString();
    await query('UPDATE carts SET updated_at = $1 WHERE id = $2', [updatedAt, cart.id]);

    res.json({
      success: true,
      message: 'Carrito vaciado.',
      data: { cart: { id: cart.id, userId: cart.userId, items: [], itemCount: 0, total: 0, updatedAt } },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
