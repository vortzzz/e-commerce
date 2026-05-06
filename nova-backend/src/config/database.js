// ─────────────────────────────────────────────────────────────────────────────
//  src/config/database.js
//  Conexión PostgreSQL (incluye compatibilidad con AWS RDS).
// ─────────────────────────────────────────────────────────────────────────────

const { Pool } = require('pg');

const normalizeSslConfig = () => {
  const sslFlag = String(process.env.DB_SSL || '').toLowerCase().trim();
  if (!sslFlag || sslFlag === 'false' || sslFlag === '0') return false;
  return { rejectUnauthorized: false };
};

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: normalizeSslConfig(),
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
});

const query = (text, params = []) => pool.query(text, params);
const getClient = () => pool.connect();

const mapUser = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
};

const Users = {
  async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return mapUser(result.rows[0]);
  },
  async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return mapUser(result.rows[0]);
  },
  async findByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return mapUser(result.rows[0]);
  },
  async create(user) {
    const result = await query(
      `INSERT INTO users (id, username, email, password_hash, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user.id, user.username, user.email.toLowerCase(), user.passwordHash, user.createdAt],
    );
    return mapUser(result.rows[0]);
  },
};

const Carts = {
  async findByUserId(userId) {
    const result = await query('SELECT * FROM carts WHERE user_id = $1', [userId]);
    const row = result.rows[0];
    if (!row) return null;
    return { id: row.id, userId: row.user_id, updatedAt: row.updated_at };
  },
  async create(cart) {
    const result = await query(
      `INSERT INTO carts (id, user_id, updated_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [cart.id, cart.userId, cart.updatedAt],
    );
    const row = result.rows[0];
    return { id: row.id, userId: row.user_id, updatedAt: row.updated_at };
  },
};

module.exports = { pool, query, getClient, Users, Carts };
