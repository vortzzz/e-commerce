// ─────────────────────────────────────────────────────────────────────────────
//  src/config/database.js
//  Base de datos en memoria. En producción reemplazar con PostgreSQL/MongoDB.
// ─────────────────────────────────────────────────────────────────────────────

const db = {
  users: [],    // { id, username, email, passwordHash, createdAt }
  carts: [],    // { id, userId, items: [{ productId, qty }], updatedAt }
  orders: [],   // { id, userId, items, total, paymentMethod, status, createdAt }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const Users = {
  findById:    (id)       => db.users.find(u => u.id === id) || null,
  findByEmail: (email)    => db.users.find(u => u.email === email) || null,
  findByUsername:(name)   => db.users.find(u => u.username === name) || null,
  create:      (user)     => { db.users.push(user); return user; },
  all:         ()         => db.users,
};

const Carts = {
  findByUserId: (userId)  => db.carts.find(c => c.userId === userId) || null,
  create:       (cart)    => { db.carts.push(cart); return cart; },
  save:         (cart)    => {
    const idx = db.carts.findIndex(c => c.id === cart.id);
    if (idx >= 0) db.carts[idx] = cart;
    else db.carts.push(cart);
    return cart;
  },
  delete:       (cartId)  => {
    const idx = db.carts.findIndex(c => c.id === cartId);
    if (idx >= 0) db.carts.splice(idx, 1);
  },
};

const Orders = {
  findById:     (id)      => db.orders.find(o => o.id === id) || null,
  findByUserId: (userId)  => db.orders.filter(o => o.userId === userId),
  create:       (order)   => { db.orders.push(order); return order; },
  all:          ()        => db.orders,
};

module.exports = { Users, Carts, Orders };
