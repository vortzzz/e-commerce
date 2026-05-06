-- Inicialización de esquema PostgreSQL para NOVA backend
-- Ejecutar en AWS RDS o cualquier instancia PostgreSQL.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL,
  emoji VARCHAR(16),
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  payment_method VARCHAR(20) NOT NULL,
  holder_name VARCHAR(120),
  transaction_id VARCHAR(120) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name VARCHAR(120) NOT NULL,
  emoji VARCHAR(16),
  price NUMERIC(12,2) NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created_at ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

INSERT INTO products (id, name, category, emoji, description, price, stock) VALUES
  ('1',  'AirPods Pro',        'tech',    '🎧', 'Audio envolvente con cancelación de ruido activa.', 299000, 50),
  ('2',  'MacBook Stand',      'tech',    '💻', 'Soporte de aluminio ergonómico para portátiles.', 89000, 30),
  ('3',  'Teclado Mecánico',   'tech',    '⌨️', 'Switches táctiles con retroiluminación RGB.', 175000, 20),
  ('4',  'Mouse Inalámbrico',  'tech',    '🖱️', 'Conexión Bluetooth hasta 3 dispositivos.', 95000, 40),
  ('5',  'Lámpara Nórdica',    'hogar',   '🪔', 'Luz cálida regulable. Diseño escandinavo.', 145000, 15),
  ('6',  'Cafetera Italiana',  'hogar',   '☕', 'Moka pot de acero inoxidable 6 tazas.', 78000, 25),
  ('7',  'Veladora Aromática', 'hogar',   '🕯️', 'Cera de soya con notas de sándalo y cedro.', 38000, 60),
  ('8',  'Cuadro Minimalista', 'hogar',   '🖼️', 'Impresión en lienzo 50x70 cm, lista para colgar.', 120000, 12),
  ('9',  'Sudadera Oversize',  'moda',    '👕', '100% algodón orgánico. Fit relajado unisex.', 115000, 35),
  ('10', 'Gorra 5-Panel',      'moda',    '🧢', 'Tela ripstop. Ajuste con cierre metálico.', 65000, 40),
  ('11', 'Mochila Urbana',     'moda',    '🎒', '15L, bolsillo para laptop, impermeable.', 198000, 18),
  ('12', 'Tenis Running',      'deporte', '👟', 'Amortiguación reactiva para entrenamiento diario.', 245000, 22),
  ('13', 'Mat de Yoga',        'deporte', '🧘', '6mm de grosor, antideslizante, con correa.', 72000, 28),
  ('14', 'Termo 750ml',        'deporte', '🧴', 'Acero inoxidable. Mantiene 24h frío, 12h calor.', 58000, 55)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  updated_at = NOW();

COMMIT;
