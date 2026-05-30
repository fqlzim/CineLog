/**
 * ============================================================
 * server.js — Ponto de entrada da API REST CineLog
 * ============================================================
 *
 * CAMADAS DO PROJETO (para apresentação acadêmica):
 *   1. FRONT (React) — interface do usuário
 *   2. BACK (Express) — este arquivo + routes + controllers
 *   3. BANCO (MySQL) — persistência em cinelog
 *   4. API EXTERNA (TMDB) — catálogo automático de filmes
 *
 * COMO INICIAR:
 *   cd cinelog-api
 *   npm install
 *   node server.js
 */

// Carrega variáveis do arquivo .env para process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Importa rotas modulares (cada arquivo agrupa endpoints relacionados).
const authRoutes = require('./routes/auth.routes');
const filmesRoutes = require('./routes/filmes.routes');
const generosRoutes = require('./routes/generos.routes');
const avaliacoesRoutes = require('./routes/avaliacoes.routes');
const adminRoutes = require('./routes/admin.routes');

// Side-effect: config/db.js testa conexão MySQL ao ser importado indiretamente pelos controllers.
require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS permite que o React (porta 5173) chame esta API (porta 3000).
app.use(cors());

// express.json() converte body JSON das requisições POST/PUT em req.body.
app.use(express.json());

// Montagem das rotas — prefixo + router.
app.use('/auth', authRoutes);
app.use('/filmes', filmesRoutes);
app.use('/generos', generosRoutes);
app.use('/avaliacoes', avaliacoesRoutes);
app.use('/admin', adminRoutes);

// Rota raiz — health check (útil para saber se a API está no ar).
app.get('/', (req, res) => {
  res.json({
    mensagem: 'API CineLog rodando',
    versao: '2.0',
    endpoints: [
      'GET  /filmes',
      'GET  /filmes/buscar?q=',
      'POST /auth/login',
      'POST /auth/register',
      'GET  /avaliacoes/feed',
      'GET  /admin/dashboard',
    ],
  });
});

// Middleware global de erro (captura exceções não tratadas).
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

app.listen(PORT, async () => {
  console.log(`\n🎬 Servidor CineLog em http://localhost:${PORT}`);
  console.log('   Aguardando requisições do Front-End React...\n');

  // Valida TMDB ao subir — feedback imediato no terminal.
  const { tmdbConfigurada, testarConexaoTmdb } = require('./services/tmdb.service');

  if (!tmdbConfigurada()) {
    console.warn('⚠️  TMDB_API_KEY não definida — busca/hero usarão apenas MySQL local.');
    console.warn('   Configure em cinelog-api/.env\n');
  } else {
    try {
      const teste = await testarConexaoTmdb();
      console.log('✅ TMDB conectada —', teste.tipo_auth);
      console.log('   Exemplo:', teste.filme_exemplo);
      console.log('   Posters e backdrops ativos na Home, Busca e Filme.\n');

      // Sincroniza posters de filmes locais sem imagem (background, não bloqueia).
      const { sincronizarTodosSemPoster } = require('./services/filmes-sync.service');
      sincronizarTodosSemPoster()
        .then((r) => console.log(`🖼️  Posters locais: ${r.corrigidos}/${r.total} sincronizados com TMDB`))
        .catch(() => {});
    } catch (erro) {
      console.warn('⚠️  TMDB configurada mas falhou:', erro.message);
      console.warn('   Sistema usará fallback MySQL local.\n');
    }
  }
});
