/**
 * routes/admin.routes.js — Painel administrativo
 * Prefixo: /admin
 * Todas as rotas exigem login + tipo admin.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const filmesController = require('../controllers/filmes.controller');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Middleware em cascata para TODAS as rotas /admin/*
router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', adminController.dashboard);
router.get('/usuarios', adminController.listarUsuarios);
router.delete('/usuarios/:id', adminController.removerUsuario);
router.patch('/usuarios/:id/tipo', adminController.alterarTipoUsuario);

// Atalhos admin para filmes (mesmos controllers, rotas dedicadas ao painel).
router.get('/filmes', filmesController.listar);
router.post('/filmes', filmesController.criar);
router.put('/filmes/:id', filmesController.atualizar);
router.delete('/filmes/:id', filmesController.remover);

module.exports = router;
