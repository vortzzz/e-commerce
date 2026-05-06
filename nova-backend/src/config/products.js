// ─────────────────────────────────────────────────────────────────────────────
//  src/config/products.js
//  Catálogo de productos. En producción vendría de una tabla en la DB.
// ─────────────────────────────────────────────────────────────────────────────

const products = [
  { id: '1',  name: 'AirPods Pro',       category: 'tech',    emoji: '🎧', description: 'Audio envolvente con cancelación de ruido activa.',        price: 299000, stock: 50 },
  { id: '2',  name: 'MacBook Stand',     category: 'tech',    emoji: '💻', description: 'Soporte de aluminio ergonómico para portátiles.',            price: 89000,  stock: 30 },
  { id: '3',  name: 'Teclado Mecánico',  category: 'tech',    emoji: '⌨️', description: 'Switches táctiles con retroiluminación RGB.',               price: 175000, stock: 20 },
  { id: '4',  name: 'Mouse Inalámbrico', category: 'tech',    emoji: '🖱️', description: 'Conexión Bluetooth hasta 3 dispositivos.',                  price: 95000,  stock: 40 },
  { id: '5',  name: 'Lámpara Nórdica',   category: 'hogar',   emoji: '🪔', description: 'Luz cálida regulable. Diseño escandinavo.',                 price: 145000, stock: 15 },
  { id: '6',  name: 'Cafetera Italiana', category: 'hogar',   emoji: '☕', description: 'Moka pot de acero inoxidable 6 tazas.',                     price: 78000,  stock: 25 },
  { id: '7',  name: 'Veladora Aromática',category: 'hogar',   emoji: '🕯️', description: 'Cera de soya con notas de sándalo y cedro.',               price: 38000,  stock: 60 },
  { id: '8',  name: 'Cuadro Minimalista',category: 'hogar',   emoji: '🖼️', description: 'Impresión en lienzo 50×70 cm, lista para colgar.',          price: 120000, stock: 12 },
  { id: '9',  name: 'Sudadera Oversize', category: 'moda',    emoji: '👕', description: '100% algodón orgánico. Fit relajado unisex.',               price: 115000, stock: 35 },
  { id: '10', name: 'Gorra 5-Panel',     category: 'moda',    emoji: '🧢', description: 'Tela ripstop. Ajuste con cierre metálico.',                 price: 65000,  stock: 40 },
  { id: '11', name: 'Mochila Urbana',    category: 'moda',    emoji: '🎒', description: '15L, bolsillo para laptop, impermeable.',                   price: 198000, stock: 18 },
  { id: '12', name: 'Tenis Running',     category: 'deporte', emoji: '👟', description: 'Amortiguación reactiva para entrenamiento diario.',          price: 245000, stock: 22 },
  { id: '13', name: 'Mat de Yoga',       category: 'deporte', emoji: '🧘', description: '6mm de grosor, antideslizante, con correa.',                price: 72000,  stock: 28 },
  { id: '14', name: 'Termo 750ml',       category: 'deporte', emoji: '🧴', description: 'Acero inoxidable. Mantiene 24h frío, 12h calor.',           price: 58000,  stock: 55 },
];

const findById   = (id) => products.find(p => p.id === id) || null;
const findAll    = ({ category, search } = {}) => {
  let list = [...products];
  if (category) list = list.filter(p => p.category === category);
  if (search)   list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return list;
};

module.exports = { products, findById, findAll };
