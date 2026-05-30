/**
 * routes/auth.routes.js — Rotas de autenticação
 * Prefixo montado no server: /auth
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');

// Públicas — qualquer visitante pode cadastrar ou logar.
router.post('/register', authController.registrar);
router.post('/login', authController.login);

// Privadas — precisam do header Authorization: Bearer <token>.
router.get('/me', authMiddleware, authController.me);
router.put('/profile', authMiddleware, authController.atualizarPerfil);
router.post('/logout', authMiddleware, authController.logout);
router.get('/usuario/:id', authController.obterUsuarioPublico);

module.exports = router;
