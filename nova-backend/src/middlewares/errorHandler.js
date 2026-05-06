// ─────────────────────────────────────────────────────────────────────────────
//  src/middlewares/errorHandler.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Manejador global de errores. Siempre va al final de app.js.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);

  const statusCode = err.statusCode || err.status || 500;
  const message    = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Maneja rutas no encontradas (404).
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * Valida resultados de express-validator y lanza 422 si hay errores.
 */
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: 'Error de validación',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { errorHandler, notFound, validate };
