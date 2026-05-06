// ─────────────────────────────────────────────────────────────────────────────
//  src/controllers/authController.js
//  POST /api/auth/register
//  POST /api/auth/login
//  POST /api/auth/logout
//  GET  /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { Users } = require('../config/database');

/** Genera un JWT firmado para el usuario */
const signToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (Users.findByEmail(email)) {
      return res.status(409).json({ success: false, error: 'El correo ya está registrado.' });
    }
    if (Users.findByUsername(username)) {
      return res.status(409).json({ success: false, error: 'El nombre de usuario ya está en uso.' });
    }

    const rounds       = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(password, rounds);

    const user = Users.create({
      id: uuidv4(),
      username,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    });

    const token = signToken(user.id);

    console.log(`[AUTH] Nuevo registro: ${user.username} (${user.email})`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      data: {
        token,
        user: { id: user.id, username: user.username, email: user.email },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Acepta login por username o email
    const user = Users.findByUsername(username) || Users.findByEmail(username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
    }

    const token = signToken(user.id);
    console.log(`[AUTH] Login: ${user.username}`);

    res.json({
      success: true,
      message: 'Sesión iniciada correctamente.',
      data: {
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        user: { id: user.id, username: user.username, email: user.email },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
// JWT es stateless; el cliente simplemente descarta el token.
// En producción se podría usar una blacklist en Redis.
const logout = (req, res) => {
  console.log(`[AUTH] Logout: ${req.user.username}`);
  res.json({ success: true, message: 'Sesión cerrada. Descarta el token en el cliente.' });
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const me = (req, res) => {
  const user = Users.findById(req.user.id);
  res.json({
    success: true,
    data: {
      user: {
        id:        user.id,
        username:  user.username,
        email:     user.email,
        createdAt: user.createdAt,
      },
    },
  });
};

module.exports = { register, login, logout, me };
