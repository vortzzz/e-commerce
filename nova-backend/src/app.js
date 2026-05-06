// ─────────────────────────────────────────────────────────────────────────────
//  src/app.js  —  Punto de entrada del servidor NOVA API
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes    = require('./routes/cart');
const orderRoutes   = require('./routes/orders');
const { query, pool } = require('./config/database');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;
const ENV_NAME = process.env.NODE_ENV || 'development';

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Permite cualquier origen en desarrollo, o los configurados en producción
    if (!origin || ENV_NAME === 'development' || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── PARSERS ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── LOGGER (simple) ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const ts = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${ts}] ${req.method.padEnd(7)} ${req.path}`);
  next();
});

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  let db = 'disconnected';
  try {
    await query('SELECT 1');
    db = 'connected';
  } catch (_err) {
    db = 'error';
  }

  res.json({
    status: 'ok',
    service: 'NOVA API',
    version: '1.0.0',
    env: ENV_NAME,
    db,
    timestamp: new Date().toISOString(),
  });
});

// ── RUTAS API ─────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api',          orderRoutes);   // /api/checkout y /api/orders

// ── DOCUMENTACIÓN rápida ──────────────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    service: 'NOVA E-commerce API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Registrar usuario',
        'POST /api/auth/login':    'Iniciar sesión → token JWT',
        'POST /api/auth/logout':   '🔒 Cerrar sesión',
        'GET  /api/auth/me':       '🔒 Perfil del usuario',
      },
      products: {
        'GET /api/products':     'Listar productos (?category=&search=)',
        'GET /api/products/:id': 'Detalle de un producto',
      },
      cart: {
        'GET    /api/cart':                 '🔒 Ver carrito',
        'POST   /api/cart/items':           '🔒 Agregar producto',
        'PUT    /api/cart/items/:productId':'🔒 Actualizar cantidad',
        'DELETE /api/cart/items/:productId':'🔒 Quitar producto',
        'DELETE /api/cart':                 '🔒 Vaciar carrito',
      },
      orders: {
        'POST /api/checkout':          '🔒 Procesar pago',
        'GET  /api/orders':            '🔒 Historial de órdenes',
        'GET  /api/orders/:orderId':   '🔒 Detalle de una orden',
      },
    },
    note: '🔒 = Requiere header Authorization: Bearer <token>',
  });
});

// ── 404 / ERROR GLOBAL ────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── INICIO ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log(`  ║   NOVA API  →  http://localhost:${PORT}   ║`);
  console.log(`  ║   Entorno: ${ENV_NAME.padEnd(26)}║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log('  Endpoints disponibles en GET /api');
  console.log('  Health check en GET /health');
  console.log('');
});

process.on('SIGINT', async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
});

module.exports = app;
