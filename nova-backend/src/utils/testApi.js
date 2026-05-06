// ─────────────────────────────────────────────────────────────────────────────
//  src/utils/testApi.js
//  Prueba todos los endpoints en secuencia. Ejecutar con: npm test
//  Requiere que el servidor esté corriendo en el puerto 3000.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'http://localhost:3000/api';
let token  = '';
let orderId = '';

const req = async (method, path, body, auth = false) => {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  const ok   = data.success ? '✅' : '❌';
  console.log(`${ok} ${method.padEnd(6)} ${path.padEnd(35)} → ${res.status} ${data.message || data.error || ''}`);
  return data;
};

const run = async () => {
  console.log('\n══════════════════════════════════════════');
  console.log('  NOVA API — Suite de pruebas');
  console.log('══════════════════════════════════════════\n');

  // ── Auth ──
  console.log('📋 AUTH\n');
  const reg = await req('POST', '/auth/register', { username: 'testuser', email: 'test@nova.co', password: '123456' });
  token = reg.data?.token || '';

  await req('POST', '/auth/login',    { username: 'testuser', password: '123456' });
  await req('GET',  '/auth/me',       null, true);

  // ── Productos ──
  console.log('\n📦 PRODUCTOS\n');
  await req('GET', '/products');
  await req('GET', '/products?category=tech');
  await req('GET', '/products?search=yoga');
  await req('GET', '/products/1');
  await req('GET', '/products/999');

  // ── Carrito ──
  console.log('\n🛒 CARRITO\n');
  await req('GET',    '/cart',                        null,               true);
  await req('POST',   '/cart/items',                  { productId: '1', qty: 2 }, true);
  await req('POST',   '/cart/items',                  { productId: '5', qty: 1 }, true);
  await req('PUT',    '/cart/items/1',                { qty: 3 },         true);
  await req('GET',    '/cart',                        null,               true);
  await req('DELETE', '/cart/items/5',                null,               true);

  // ── Checkout ──
  console.log('\n💳 CHECKOUT\n');
  const order = await req('POST', '/checkout', { paymentMethod: 'card', holderName: 'Test User' }, true);
  if (order.data?.order) {
    orderId = order.data.order.id;
    console.log(`   Orden generada: ${orderId} | TXN: ${order.data.order.transactionId}`);
  }

  // ── Órdenes ──
  console.log('\n📄 ÓRDENES\n');
  await req('GET', '/orders',            null, true);
  if (orderId) await req('GET', `/orders/${orderId}`, null, true);

  // ── Logout ──
  console.log('\n🔐 LOGOUT\n');
  await req('POST', '/auth/logout', null, true);

  console.log('\n══════════════════════════════════════════');
  console.log('  Pruebas completadas');
  console.log('══════════════════════════════════════════\n');
};

run().catch(err => {
  console.error('\n❌ Error al conectar con la API:', err.message);
  console.error('   Asegúrate de que el servidor esté corriendo: npm run dev\n');
  process.exit(1);
});
