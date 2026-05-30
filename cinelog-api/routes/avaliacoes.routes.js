/**
 * routes/avaliacoes.routes.js — Reviews e feed social
 * Prefixo: /avaliacoes
 */

const express = require('express');
const router = express.Router();
const avaliacoesController = require('../controllers/avaliacoes.controller');
const authMiddleware = require('../middleware/auth');

// Feed e listagens públicas (qualquer um pode ler — estilo rede social).
router.get('/feed', avaliacoesController.feed);
router.get('/filme/:filmeId', avaliacoesController.listarPorFilme);
router.get('/usuario/:usuarioId', avaliacoesController.listarPorUsuario);

// Rotas que exigem login.
router.get('/minha/:filmeId', authMiddleware, avaliacoesController.minhaAvaliacaoNoFilme);
router.post('/', authMiddleware, avaliacoesController.criar);
router.put('/:id', authMiddleware, avaliacoesController.atualizar);
router.delete('/:id', authMiddleware, avaliacoesController.remover);

module.exports = router;
