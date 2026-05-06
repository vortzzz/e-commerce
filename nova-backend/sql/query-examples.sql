-- Ejemplos de consultas parametrizadas para PostgreSQL (usadas con pg)

-- SELECT: productos por categoría y búsqueda textual
SELECT id, name, category, price, stock
FROM products
WHERE category = $1
  AND name ILIKE $2
ORDER BY id::int;

-- INSERT: registrar usuario
INSERT INTO users (id, username, email, password_hash, created_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, username, email, created_at;

-- UPDATE: actualizar cantidad de un item del carrito
UPDATE cart_items
SET qty = $1
WHERE cart_id = $2
  AND product_id = $3
RETURNING cart_id, product_id, qty;
