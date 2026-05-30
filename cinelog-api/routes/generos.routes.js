/**
 * routes/generos.routes.js — Atalho GET /generos (mesmo controller)
 */

const express = require('express');
const router = express.Router();
const filmesController = require('../controllers/filmes.controller');

router.get('/', filmesController.generos);

module.exports = router;
