// ─────────────────────────────────────────────────────────────────────────────
//  src/utils/paymentService.js
//  Simula un servicio externo de procesamiento de pagos (FakePay).
//  En producción reemplazar por Wompi, PayU, Stripe, etc.
// ─────────────────────────────────────────────────────────────────────────────

const { v4: uuidv4 } = require('uuid');

/**
 * Simula una llamada al servicio de pago.
 * Retorna { success, transactionId, message } después de un delay aleatorio.
 *
 * @param {Object} params
 * @param {number} params.amount         - Monto en COP (centavos en producción)
 * @param {string} params.paymentMethod  - 'card' | 'transfer' | 'crypto'
 * @param {string} params.holderName     - Nombre del titular
 * @param {string} params.currency       - 'COP' por defecto
 * @returns {Promise<{success: boolean, transactionId: string, message: string, code: string}>}
 */
const processPayment = ({ amount, paymentMethod, holderName, currency = 'COP' }) => {
  return new Promise((resolve) => {
    // Simula latencia de red (800ms – 1.8s)
    const delay = 800 + Math.random() * 1000;

    setTimeout(() => {
      // Simula rechazo: 5% de probabilidad (para pruebas)
      const rejected = Math.random() < 0.05;

      if (rejected) {
        resolve({
          success:       false,
          transactionId: null,
          code:          'PAYMENT_DECLINED',
          message:       'Pago rechazado por el emisor. Intenta con otro método.',
        });
        return;
      }

      resolve({
        success:       true,
        transactionId: `TXN-${uuidv4().split('-')[0].toUpperCase()}`,
        code:          'PAYMENT_APPROVED',
        message:       'Pago aprobado exitosamente.',
        details: {
          amount,
          currency,
          paymentMethod,
          holderName,
          processedAt: new Date().toISOString(),
          gateway:     'FakePay Sandbox v1',
        },
      });
    }, delay);
  });
};

module.exports = { processPayment };
