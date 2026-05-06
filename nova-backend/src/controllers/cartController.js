// ─────────────────────────────────────────────────────────────────────────────
//  src/controllers/cartController.js
//  GET    /api/cart
//  POST   /api/cart/items
//  PUT    /api/cart/items/:productId
//  DELETE /api/cart/items/:productId
//  DELETE /api/cart
// ─────────────────────────────────────────────────────────────────────────────

const { v4: uuidv4 } = require('uuid');
const { Carts }      = require('../config/database');
const { findById: findProduct } = require('../config/products');

/** Enriquece los items del carrito con datos del producto */
const enrichCart = (cart) => {
  const enrichedItems = cart.items.map(item => {
    const product = findProduct(item.productId);
    return {
      productId:   item.productId,
      qty:         item.qty,
      name:        product?.name        || 'Producto eliminado',
      emoji:       product?.emoji       || '📦',
      price:       product?.price       || 0,
      category:    product?.category    || '',
      subtotal:    (product?.price || 0) * item.qty,
    };
  });

  const total = enrichedItems.reduce((sum, i) => sum + i.subtotal, 0);

  return {
    id:        cart.id,
    userId:    cart.userId,
    items:     enrichedItems,
    itemCount: enrichedItems.reduce((s, i) => s + i.qty, 0),
    total,
    updatedAt: cart.updatedAt,
  };
};

/** Obtiene o crea el carrito del usuario autenticado */
const getOrCreateCart = (userId) => {
  let cart = Carts.findByUserId(userId);
  if (!cart) {
    cart = Carts.create({ id: uuidv4(), userId, items: [], updatedAt: new Date().toISOString() });
  }
  return cart;
};

// ── GET /api/cart ─────────────────────────────────────────────────────────────
const getCart = (req, res) => {
  const cart = getOrCreateCart(req.user.id);
  res.json({ success: true, data: { cart: enrichCart(cart) } });
};

// ── POST /api/cart/items ──────────────────────────────────────────────────────
// Body: { productId: "1", qty: 2 }
const addItem = (req, res) => {
  const { productId, qty = 1 } = req.body;
  const quantity = Math.max(1, parseInt(qty));

  const product = findProduct(String(productId));
  if (!product) {
    return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
  }

  const cart     = getOrCreateCart(req.user.id);
  const existing = cart.items.find(i => i.productId === String(productId));

  if (existing) {
    existing.qty += quantity;
  } else {
    cart.items.push({ productId: String(productId), qty: quantity });
  }

  cart.updatedAt = new Date().toISOString();
  Carts.save(cart);

  console.log(`[CART] +${quantity} × ${product.name} → usuario ${req.user.username}`);

  res.status(200).json({
    success: true,
    message: `"${product.name}" agregado al carrito.`,
    data: { cart: enrichCart(cart) },
  });
};

// ── PUT /api/cart/items/:productId ────────────────────────────────────────────
// Body: { qty: 3 }
const updateItem = (req, res) => {
  const { productId } = req.params;
  const qty           = parseInt(req.body.qty);

  if (isNaN(qty) || qty < 0) {
    return res.status(422).json({ success: false, error: 'qty debe ser un entero >= 0.' });
  }

  const cart = getOrCreateCart(req.user.id);
  const idx  = cart.items.findIndex(i => i.productId === productId);

  if (idx < 0) {
    return res.status(404).json({ success: false, error: 'El producto no está en el carrito.' });
  }

  if (qty === 0) {
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx].qty = qty;
  }

  cart.updatedAt = new Date().toISOString();
  Carts.save(cart);

  res.json({
    success: true,
    message: qty === 0 ? 'Producto eliminado del carrito.' : 'Cantidad actualizada.',
    data: { cart: enrichCart(cart) },
  });
};

// ── DELETE /api/cart/items/:productId ─────────────────────────────────────────
const removeItem = (req, res) => {
  const { productId } = req.params;
  const cart          = getOrCreateCart(req.user.id);
  const idx           = cart.items.findIndex(i => i.productId === productId);

  if (idx < 0) {
    return res.status(404).json({ success: false, error: 'El producto no está en el carrito.' });
  }

  const [removed] = cart.items.splice(idx, 1);
  cart.updatedAt  = new Date().toISOString();
  Carts.save(cart);

  console.log(`[CART] Eliminado productId ${removed.productId} → usuario ${req.user.username}`);

  res.json({
    success: true,
    message: 'Producto eliminado del carrito.',
    data: { cart: enrichCart(cart) },
  });
};

// ── DELETE /api/cart ──────────────────────────────────────────────────────────
const clearCart = (req, res) => {
  const cart    = getOrCreateCart(req.user.id);
  cart.items    = [];
  cart.updatedAt = new Date().toISOString();
  Carts.save(cart);

  res.json({ success: true, message: 'Carrito vaciado.', data: { cart: enrichCart(cart) } });
};

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
