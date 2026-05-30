/**
 * routes/filmes.routes.js — Catálogo e filmes
 * ORDEM: rotas fixas ANTES de /:id
 */

const express = require('express');
const router = express.Router();
const filmesController = require('../controllers/filmes.controller');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

router.get('/', filmesController.listar);
router.get('/catalogo', filmesController.catalogo);
router.get('/generos', filmesController.generos);
router.get('/genero/:generoId', filmesController.porGenero);
router.get('/buscar', filmesController.buscar);
router.get('/populares', filmesController.populares);
router.get('/tmdb/:tmdbId', filmesController.obterPorTmdbId);
router.get('/:id', filmesController.obterPorId);

router.post('/sincronizar-posters', authMiddleware, adminMiddleware, filmesController.sincronizarPosters);
router.post('/', authMiddleware, adminMiddleware, filmesController.criar);
router.put('/:id', authMiddleware, adminMiddleware, filmesController.atualizar);
router.delete('/:id', authMiddleware, adminMiddleware, filmesController.remover);

module.exports = router;
