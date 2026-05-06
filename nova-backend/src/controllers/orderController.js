// ─────────────────────────────────────────────────────────────────────────────
//  src/controllers/orderController.js
//  POST /api/checkout
//  GET  /api/orders
//  GET  /api/orders/:orderId
// ─────────────────────────────────────────────────────────────────────────────

const { v4: uuidv4 }           = require('uuid');
const { Carts, Orders }        = require('../config/database');
const { findById: findProduct } = require('../config/products');
const { processPayment }        = require('../utils/paymentService');

// ── POST /api/checkout ────────────────────────────────────────────────────────
// Body: { paymentMethod: 'card'|'transfer'|'crypto', holderName: 'Juan Pérez' }
const checkout = async (req, res, next) => {
  try {
    const { paymentMethod = 'card', holderName } = req.body;

    // 1. Obtener carrito
    const cart = Carts.findByUserId(req.user.id);
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: 'El carrito está vacío.' });
    }

    // 2. Validar stock y calcular total
    const orderItems = [];
    let total = 0;

    for (const cartItem of cart.items) {
      const product = findProduct(cartItem.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Producto con id "${cartItem.productId}" ya no está disponible.`,
        });
      }
      if (product.stock < cartItem.qty) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para "${product.name}". Disponibles: ${product.stock}.`,
        });
      }

      const subtotal = product.price * cartItem.qty;
      total += subtotal;

      orderItems.push({
        productId: product.id,
        name:      product.name,
        emoji:     product.emoji,
        price:     product.price,
        qty:       cartItem.qty,
        subtotal,
      });
    }

    // 3. Llamar al servicio de pago ficticio
    console.log(`[CHECKOUT] Procesando pago de $${total.toLocaleString('es-CO')} → ${req.user.username}`);
    const paymentResult = await processPayment({
      amount:        total,
      paymentMethod,
      holderName:    holderName || req.user.username,
    });

    if (!paymentResult.success) {
      return res.status(402).json({
        success: false,
        error:   paymentResult.message,
        code:    paymentResult.code,
      });
    }

    // 4. Crear orden
    const order = Orders.create({
      id:            `ORD-${uuidv4().split('-')[0].toUpperCase()}`,
      userId:        req.user.id,
      items:         orderItems,
      total,
      paymentMethod,
      holderName:    holderName || req.user.username,
      transactionId: paymentResult.transactionId,
      status:        'confirmed',
      createdAt:     new Date().toISOString(),
    });

    // 5. Vaciar carrito
    cart.items     = [];
    cart.updatedAt = new Date().toISOString();
    const { Carts: CartsDb } = require('../config/database');
    CartsDb.save(cart);

    console.log(`[CHECKOUT] Orden ${order.id} confirmada. TXN: ${paymentResult.transactionId}`);

    res.status(201).json({
      success: true,
      message: 'Pago procesado y orden confirmada.',
      data: {
        order: {
          id:            order.id,
          total:         order.total,
          status:        order.status,
          transactionId: order.transactionId,
          items:         order.items,
          createdAt:     order.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/orders ───────────────────────────────────────────────────────────
const getOrders = (req, res) => {
  const orders = Orders.findByUserId(req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    data: {
      total: orders.length,
      orders: orders.map(o => ({
        id:            o.id,
        total:         o.total,
        status:        o.status,
        paymentMethod: o.paymentMethod,
        itemCount:     o.items.reduce((s, i) => s + i.qty, 0),
        createdAt:     o.createdAt,
      })),
    },
  });
};

// ── GET /api/orders/:orderId ──────────────────────────────────────────────────
const getOrderById = (req, res) => {
  const order = Orders.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({ success: false, error: 'Orden no encontrada.' });
  }
  // El usuario solo puede ver sus propias órdenes
  if (order.userId !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Acceso denegado.' });
  }

  res.json({ success: true, data: { order } });
};

module.exports = { checkout, getOrders, getOrderById };
