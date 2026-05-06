// ─────────────────────────────────────────────────────────────────────────────
//  src/controllers/orderController.js
//  POST /api/checkout
//  GET  /api/orders
//  GET  /api/orders/:orderId
// ─────────────────────────────────────────────────────────────────────────────

const { v4: uuidv4 } = require('uuid');
const { Carts, getClient, query } = require('../config/database');
const { processPayment } = require('../utils/paymentService');

// ── POST /api/checkout ────────────────────────────────────────────────────────
// Body: { paymentMethod: 'card'|'transfer'|'crypto', holderName: 'Juan Pérez' }
const checkout = async (req, res, next) => {
  try {
    const { paymentMethod = 'card', holderName } = req.body;

    // 1. Obtener carrito
    const cart = await Carts.findByUserId(req.user.id);
    if (!cart) {
      return res.status(400).json({ success: false, error: 'El carrito está vacío.' });
    }

    const cartCountResult = await query(
      'SELECT COUNT(*)::int AS total FROM cart_items WHERE cart_id = $1',
      [cart.id],
    );
    const totalCartItems = cartCountResult.rows[0]?.total || 0;
    if (totalCartItems === 0) {
      return res.status(400).json({ success: false, error: 'El carrito está vacío.' });
    }

    const cartItemsResult = await query(
      `SELECT
         ci.product_id AS "productId",
         ci.qty,
         p.name,
         p.emoji,
         p.price,
         p.stock
       FROM cart_items ci
       INNER JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1`,
      [cart.id],
    );
    const cartItems = cartItemsResult.rows;
    if (cartItems.length !== totalCartItems) {
      return res.status(400).json({
        success: false,
        error: 'Hay productos no disponibles en el carrito. Revísalo e intenta de nuevo.',
      });
    }

    // 2. Validar stock y calcular total
    const orderItems = [];
    let total = 0;

    for (const cartItem of cartItems) {
      if (cartItem.stock < cartItem.qty) {
        return res.status(400).json({
          success: false,
          error: `Stock insuficiente para "${cartItem.name}". Disponibles: ${cartItem.stock}.`,
        });
      }

      const subtotal = Number(cartItem.price) * cartItem.qty;
      total += subtotal;

      orderItems.push({
        productId: cartItem.productId,
        name:      cartItem.name,
        emoji:     cartItem.emoji,
        price:     Number(cartItem.price),
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
    const client = await getClient();
    const orderId = `ORD-${uuidv4().split('-')[0].toUpperCase()}`;
    const createdAt = new Date().toISOString();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO orders
           (id, user_id, total, payment_method, holder_name, transaction_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          orderId,
          req.user.id,
          total,
          paymentMethod,
          holderName || req.user.username,
          paymentResult.transactionId,
          'confirmed',
          createdAt,
        ],
      );

      for (const item of orderItems) {
        await client.query(
          `INSERT INTO order_items
             (order_id, product_id, name, emoji, price, qty, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [orderId, item.productId, item.name, item.emoji, item.price, item.qty, item.subtotal],
        );
        const stockUpdate = await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1',
          [item.qty, item.productId],
        );
        if (stockUpdate.rowCount === 0) {
          throw new Error(`Stock insuficiente para ${item.name}.`);
        }
      }

      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
      await client.query('UPDATE carts SET updated_at = $1 WHERE id = $2', [new Date().toISOString(), cart.id]);
      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

    console.log(`[CHECKOUT] Orden ${orderId} confirmada. TXN: ${paymentResult.transactionId}`);

    res.status(201).json({
      success: true,
      message: 'Pago procesado y orden confirmada.',
      data: {
        order: {
          id: orderId,
          total,
          status: 'confirmed',
          transactionId: paymentResult.transactionId,
          items: orderItems,
          createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/orders ───────────────────────────────────────────────────────────
const getOrders = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         o.id,
         o.total,
         o.status,
         o.payment_method AS "paymentMethod",
         o.created_at AS "createdAt",
         COALESCE(SUM(oi.qty), 0)::int AS "itemCount"
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id],
    );

    res.json({
      success: true,
      data: {
        total: result.rows.length,
        orders: result.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/orders/:orderId ──────────────────────────────────────────────────
const getOrderById = async (req, res, next) => {
  try {
    const orderResult = await query(
      `SELECT
         id,
         user_id AS "userId",
         total,
         payment_method AS "paymentMethod",
         holder_name AS "holderName",
         transaction_id AS "transactionId",
         status,
         created_at AS "createdAt"
       FROM orders
       WHERE id = $1`,
      [req.params.orderId],
    );
    const order = orderResult.rows[0];
    if (!order) {
      return res.status(404).json({ success: false, error: 'Orden no encontrada.' });
    }
    if (order.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Acceso denegado.' });
    }

    const itemsResult = await query(
      `SELECT
         product_id AS "productId",
         name,
         emoji,
         price,
         qty,
         subtotal
       FROM order_items
       WHERE order_id = $1
       ORDER BY id ASC`,
      [order.id],
    );

    res.json({
      success: true,
      data: { order: { ...order, items: itemsResult.rows } },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { checkout, getOrders, getOrderById };
