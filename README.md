# NOVA — Backend API

API REST para la plataforma de e-commerce NOVA, construida con **Node.js + Express.js**.

## Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4
- **Autenticación**: JWT (jsonwebtoken) + Bcrypt
- **Validaciones**: express-validator
- **Base de datos**: En memoria (reemplazable por PostgreSQL/MongoDB)
- **Pago**: Servicio ficticio simulado (reemplazable por Wompi/PayU/Stripe)

---

## Instalación

```bash
# 1. Clonar e instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar en desarrollo
npm run dev

# 4. Iniciar en producción
npm start

# 5. Ejecutar pruebas (requiere el servidor corriendo)
npm test
```

---

## Endpoints

### 🔓 Públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`  | `/health` | Health check |
| `GET`  | `/api` | Documentación de endpoints |
| `POST` | `/api/auth/register` | Registro de usuario |
| `POST` | `/api/auth/login` | Inicio de sesión → JWT |
| `GET`  | `/api/products` | Listar productos (`?category=&search=`) |
| `GET`  | `/api/products/:id` | Detalle de producto |

### 🔒 Requieren JWT (`Authorization: Bearer <token>`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET`    | `/api/auth/me` | Perfil del usuario |
| `POST`   | `/api/auth/logout` | Cerrar sesión |
| `GET`    | `/api/cart` | Ver carrito |
| `POST`   | `/api/cart/items` | Agregar producto al carrito |
| `PUT`    | `/api/cart/items/:productId` | Actualizar cantidad (`qty: 0` elimina) |
| `DELETE` | `/api/cart/items/:productId` | Quitar producto |
| `DELETE` | `/api/cart` | Vaciar carrito |
| `POST`   | `/api/checkout` | Procesar pago |
| `GET`    | `/api/orders` | Historial de órdenes |
| `GET`    | `/api/orders/:orderId` | Detalle de una orden |

---

## Ejemplos cURL

### Registrar usuario
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"juan123","email":"juan@correo.com","password":"mipassword"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"juan123","password":"mipassword"}'
# → Guarda el token retornado
```

### Listar productos por categoría
```bash
curl "http://localhost:3000/api/products?category=tech"
```

### Agregar al carrito
```bash
curl -X POST http://localhost:3000/api/cart/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"productId":"1","qty":2}'
```

### Procesar pago
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"paymentMethod":"card","holderName":"Juan García"}'
```

---

## Estructura del proyecto

```
nova-backend/
├── src/
│   ├── app.js                    # Punto de entrada
│   ├── config/
│   │   ├── database.js           # DB en memoria (Users, Carts, Orders)
│   │   └── products.js           # Catálogo de productos
│   ├── controllers/
│   │   ├── authController.js     # register, login, logout, me
│   │   ├── cartController.js     # getCart, addItem, updateItem, removeItem, clearCart
│   │   ├── orderController.js    # checkout, getOrders, getOrderById
│   │   └── productController.js  # getProducts, getProductById
│   ├── middlewares/
│   │   ├── auth.js               # requireAuth, optionalAuth (JWT)
│   │   └── errorHandler.js       # errorHandler, notFound, validate
│   ├── routes/
│   │   ├── auth.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   └── products.js
│   └── utils/
│       ├── paymentService.js     # Servicio de pago ficticio
│       └── testApi.js            # Suite de pruebas
├── .env                          # Variables de entorno (no versionar)
├── .env.example                  # Plantilla de variables
└── package.json
```

---

## Migrar a base de datos real

Reemplaza `src/config/database.js` con un ORM como **Prisma** o **Mongoose**:

```bash
# PostgreSQL con Prisma
npm install prisma @prisma/client
npx prisma init

# MongoDB con Mongoose
npm install mongoose
```

Los controladores no necesitan cambios ya que acceden a la DB solo a través de los helpers `Users`, `Carts`, `Orders`.

## Integrar pasarela de pago real

Reemplaza `src/utils/paymentService.js` con el SDK de tu proveedor:

- **Wompi** (Colombia): `npm install wompi-node`
- **PayU** (Latinoamérica): SDK oficial PayU
- **Stripe** (Global): `npm install stripe`
