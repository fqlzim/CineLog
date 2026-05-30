/**
 * ============================================================
 * controllers/filmes.controller.js — Catálogo TMDB + cache MySQL
 * ============================================================
 *
 * CATÁLOGO UNIFICADO:
 *   Home, Busca e Filtros usam a MESMA fonte TMDB.
 *   GET /filmes/catalogo → paginação (20 filmes/página)
 *   GET /generos → gêneros oficiais TMDB
 *   GET /filmes/genero/:id → discover por gênero
 *
 * SINCRONIZAÇÃO DE POSTERS:
 *   Filmes locais sem poster_url → filmes-sync.service.js busca TMDB
 */

const db = require('../config/db');
const {
  tmdbConfigurada,
  buscarFilmesNaTmdb,
  buscarPopularesNaTmdb,
  buscarCatalogoTmdb,
  listarGenerosTmdb,
  buscarFilmesPorGeneroTmdb,
  buscarDetalhesFilmeTmdb,
  buscarDetalhesCompletosFilmeTmdb,
  TIPOS_CATALOGO,
} = require('../services/tmdb.service');
const {
  sincronizarFilmeLocal,
  sincronizarFilmesSemPoster,
  sincronizarTodosSemPoster,
} = require('../services/filmes-sync.service');

async function enriquecerComMedia(filmes) {
  if (!filmes.length) return [];

  const ids = filmes.map((f) => f.id).filter(Boolean);
  if (!ids.length) return filmes;

  const placeholders = ids.map(() => '?').join(',');
  const [stats] = await db.query(
    `SELECT filme_id, AVG(nota) AS media_cinelog, COUNT(*) AS total_avaliacoes
     FROM avaliacoes WHERE filme_id IN (${placeholders}) GROUP BY filme_id`,
    ids
  );

  const mapaStats = {};
  stats.forEach((s) => {
    mapaStats[s.filme_id] = {
      media_cinelog: Number(parseFloat(s.media_cinelog).toFixed(1)),
      total_avaliacoes: s.total_avaliacoes,
    };
  });

  return filmes.map((f) => ({
    ...f,
    media_cinelog: f.id ? (mapaStats[f.id]?.media_cinelog ?? null) : null,
    total_avaliacoes: f.id ? (mapaStats[f.id]?.total_avaliacoes ?? 0) : 0,
  }));
}

/** GET /filmes — Lista local + sincroniza posters automaticamente. */
async function listar(req, res) {
  try {
    let [filmes] = await db.query('SELECT * FROM filmes ORDER BY criado_em DESC');

    if (tmdbConfigurada()) {
      filmes = await sincronizarFilmesSemPoster(filmes, 3);
    }

    const filmesComMedia = await enriquecerComMedia(filmes);
    return res.json(filmesComMedia);
  } catch (erro) {
    console.error('Erro ao listar filmes:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar filmes.' });
  }
}

/**
 * GET /filmes/catalogo?tipo=popular&page=1
 * Catálogo dinâmico TMDB — mesma fonte da Busca, com paginação.
 */
async function catalogo(req, res) {
  try {
    const tipo = req.query.tipo || 'popular';
    const page = parseInt(req.query.page, 10) || 1;

    if (!tmdbConfigurada()) {
      const [filmes] = await db.query(
        'SELECT * FROM filmes ORDER BY criado_em DESC LIMIT 20 OFFSET ?',
        [(page - 1) * 20]
      );
      return res.json({
        fonte: 'local',
        resultados: filmes,
        page,
        total_pages: 1,
        total_results: filmes.length,
        tipos_disponiveis: Object.keys(TIPOS_CATALOGO),
      });
    }

    const dados = await buscarCatalogoTmdb(tipo, page);
    return res.json({
      fonte: 'tmdb',
      ...dados,
      tipos_disponiveis: Object.keys(TIPOS_CATALOGO),
    });
  } catch (erro) {
    console.error('Erro catalogo:', erro);
    return res.status(erro.status || 500).json({ erro: erro.message || 'Erro no catálogo.' });
  }
}

/** GET /generos — Lista gêneros oficiais TMDB. */
async function generos(req, res) {
  try {
    if (!tmdbConfigurada()) {
      const [filmes] = await db.query('SELECT DISTINCT genero FROM filmes WHERE genero IS NOT NULL');
      const lista = [...new Set(filmes.flatMap((f) => f.genero.split(',').map((g) => g.trim())))]
        .filter(Boolean)
        .map((nome, i) => ({ id: i + 1, name: nome }));
      return res.json({ fonte: 'local', generos: lista });
    }

    const generosTmdb = await listarGenerosTmdb();
    return res.json({ fonte: 'tmdb', generos: generosTmdb });
  } catch (erro) {
    console.error('Erro generos:', erro);
    return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao listar gêneros.' });
  }
}

/** GET /filmes/genero/:generoId?page=1 — Filmes por gênero TMDB. */
async function porGenero(req, res) {
  try {
    const { generoId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;

    if (!tmdbConfigurada()) {
      const [filmes] = await db.query(
        'SELECT * FROM filmes WHERE genero LIKE ? LIMIT 20',
        [`%${req.query.nome || ''}%`]
      );
      return res.json({ fonte: 'local', resultados: filmes, page: 1, total_pages: 1 });
    }

    const dados = await buscarFilmesPorGeneroTmdb(generoId, page);
    return res.json({ fonte: 'tmdb', ...dados });
  } catch (erro) {
    console.error('Erro porGenero:', erro);
    return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao buscar por gênero.' });
  }
}

/** POST /filmes/sincronizar-posters — Força sync de todos sem poster (admin). */
async function sincronizarPosters(req, res) {
  try {
    if (!tmdbConfigurada()) {
      return res.status(503).json({ erro: 'TMDB não configurada.' });
    }
    const resultado = await sincronizarTodosSemPoster();
    return res.json({
      mensagem: `${resultado.corrigidos} de ${resultado.total} filmes sincronizados com posters TMDB.`,
      ...resultado,
    });
  } catch (erro) {
    console.error('Erro sincronizarPosters:', erro);
    return res.status(500).json({ erro: 'Erro na sincronização.' });
  }
}

async function buscar(req, res) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ erro: 'Digite pelo menos 2 caracteres para buscar.' });
    }

    if (!tmdbConfigurada()) {
      const termo = `%${q.trim()}%`;
      const [filmes] = await db.query(
        `SELECT * FROM filmes WHERE titulo LIKE ? OR diretor LIKE ? OR genero LIKE ? ORDER BY titulo ASC`,
        [termo, termo, termo]
      );
      return res.json({ fonte: 'local', resultados: filmes });
    }

    const resultados = await buscarFilmesNaTmdb(q.trim());
    return res.json({ fonte: 'tmdb', resultados });
  } catch (erro) {
    console.error('Erro na busca:', erro);
    return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao buscar filmes.' });
  }
}

async function salvarFilmeDaTmdb(tmdbId) {
  const dados = await buscarDetalhesFilmeTmdb(tmdbId);
  const [existentes] = await db.query('SELECT * FROM filmes WHERE tmdb_id = ?', [tmdbId]);

  if (existentes.length > 0) {
    await db.query(
      `UPDATE filmes SET titulo=?, diretor=?, ano=?, genero=?, poster_url=?, backdrop_url=?,
       sinopse=?, nota_tmdb=?, elenco=? WHERE tmdb_id=?`,
      [dados.titulo, dados.diretor, dados.ano, dados.genero, dados.poster_url, dados.backdrop_url,
        dados.sinopse, dados.nota_tmdb, dados.elenco, tmdbId]
    );
    const [atualizado] = await db.query('SELECT * FROM filmes WHERE tmdb_id = ?', [tmdbId]);
    return atualizado[0];
  }

  const [resultado] = await db.query(
    `INSERT INTO filmes (tmdb_id, titulo, diretor, ano, genero, poster_url, backdrop_url, sinopse, nota_tmdb, elenco)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [dados.tmdb_id, dados.titulo, dados.diretor, dados.ano, dados.genero, dados.poster_url,
      dados.backdrop_url, dados.sinopse, dados.nota_tmdb, dados.elenco]
  );
  const [novo] = await db.query('SELECT * FROM filmes WHERE id = ?', [resultado.insertId]);
  return novo[0];
}

async function populares(req, res) {
  try {
    if (!tmdbConfigurada()) {
      const [filmes] = await db.query('SELECT * FROM filmes ORDER BY criado_em DESC LIMIT 6');
      return res.json({ fonte: 'local', resultados: filmes });
    }
    const resultados = await buscarPopularesNaTmdb();
    return res.json({ fonte: 'tmdb', resultados });
  } catch (erro) {
    console.error('Erro populares:', erro);
    return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao buscar destaques.' });
  }
}

async function obterPorTmdbId(req, res) {
  try {
    const tmdbId = parseInt(req.params.tmdbId, 10);
    if (Number.isNaN(tmdbId)) return res.status(400).json({ erro: 'ID TMDB inválido.' });

    let filme;
    if (tmdbConfigurada()) {
      // Cache MySQL (resumo) + detalhes completos TMDB na mesma resposta
      const filmeLocal = await salvarFilmeDaTmdb(tmdbId);
      const completo = await buscarDetalhesCompletosFilmeTmdb(tmdbId);
      filme = { ...completo, id: filmeLocal.id };
    } else {
      const [linhas] = await db.query('SELECT * FROM filmes WHERE tmdb_id = ?', [tmdbId]);
      if (!linhas.length) return res.status(503).json({ erro: 'TMDB não configurada.' });
      filme = linhas[0];
    }

    const [enriquecido] = await enriquecerComMedia([filme]);
    return res.json(enriquecido);
  } catch (erro) {
    console.error('Erro obterPorTmdbId:', erro);
    return res.status(500).json({ erro: 'Erro ao carregar filme da TMDB.' });
  }
}

async function obterPorId(req, res) {
  try {
    const { id } = req.params;
    const [linhas] = await db.query('SELECT * FROM filmes WHERE id = ?', [id]);
    if (!linhas.length) return res.status(404).json({ erro: 'Filme não encontrado.' });

    let filme = linhas[0];
    if (tmdbConfigurada()) {
      filme = await sincronizarFilmeLocal(filme);
      // Filme local com tmdb_id → enriquece com elenco, crew, trailer, detalhes
      if (filme.tmdb_id) {
        const completo = await buscarDetalhesCompletosFilmeTmdb(filme.tmdb_id);
        filme = { ...completo, id: filme.id };
      }
    }

    const [enriquecido] = await enriquecerComMedia([filme]);
    return res.json(enriquecido);
  } catch (erro) {
    console.error('Erro obterPorId:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar filme.' });
  }
}

async function criar(req, res) {
  try {
    const { titulo, diretor, ano, genero, sinopse, poster_url, tmdb_id } = req.body;
    if (!titulo) return res.status(400).json({ erro: 'Título é obrigatório.' });

    const [resultado] = await db.query(
      `INSERT INTO filmes (tmdb_id, titulo, diretor, ano, genero, sinopse, poster_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tmdb_id || null, titulo, diretor || null, ano ? parseInt(ano, 10) : null, genero || null, sinopse || null, poster_url || null]
    );
    const [novo] = await db.query('SELECT * FROM filmes WHERE id = ?', [resultado.insertId]);
    return res.status(201).json(novo[0]);
  } catch (erro) {
    console.error('Erro ao criar filme:', erro);
    return res.status(500).json({ erro: 'Erro ao inserir filme.' });
  }
}

async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { titulo, diretor, ano, genero, sinopse, poster_url } = req.body;
    const [resultado] = await db.query(
      `UPDATE filmes SET titulo=?, diretor=?, ano=?, genero=?, sinopse=?, poster_url=? WHERE id=?`,
      [titulo, diretor, ano, genero, sinopse, poster_url, id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Filme não encontrado.' });
    const [atualizado] = await db.query('SELECT * FROM filmes WHERE id = ?', [id]);
    return res.json(atualizado[0]);
  } catch (erro) {
    console.error('Erro ao atualizar filme:', erro);
    return res.status(500).json({ erro: 'Erro ao atualizar filme.' });
  }
}

async function remover(req, res) {
  try {
    const { id } = req.params;
    const [resultado] = await db.query('DELETE FROM filmes WHERE id = ?', [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ erro: 'Filme não encontrado.' });
    return res.status(204).send();
  } catch (erro) {
    console.error('Erro ao remover filme:', erro);
    return res.status(500).json({ erro: 'Erro ao excluir filme.' });
  }
}

module.exports = {
  listar,
  catalogo,
  generos,
  porGenero,
  sincronizarPosters,
  buscar,
  populares,
  obterPorTmdbId,
  obterPorId,
  criar,
  atualizar,
  remover,
};
