/**
 * ============================================================
 * services/filmes-sync.service.js — Sincronização local ↔ TMDB
 * ============================================================
 *
 * PROBLEMA RESOLVIDO:
 *   Filmes inseridos manualmente no MySQL (seed) não tinham poster_url.
 *
 * FLUXO:
 *   1. Detecta filme sem poster (ou sem tmdb_id)
 *   2. Busca na TMDB por título + ano
 *   3. UPDATE no MySQL com poster_url, backdrop_url, tmdb_id, etc.
 *   4. Front recebe URLs reais — placeholder só enquanto carrega
 */

const db = require('../config/db');
const { tmdbConfigurada, encontrarFilmeNaTmdbPorTitulo, buscarDetalhesFilmeTmdb } = require('./tmdb.service');

/** Filme precisa sincronizar se não tem poster OU não tem tmdb_id. */
function precisaSincronizar(filme) {
  return !filme.poster_url || !filme.tmdb_id;
}

/**
 * Sincroniza UM filme local com a TMDB e persiste no MySQL.
 * @returns {Object} filme atualizado do banco
 */
async function sincronizarFilmeLocal(filme) {
  if (!tmdbConfigurada() || !precisaSincronizar(filme)) {
    return filme;
  }

  try {
    const match = await encontrarFilmeNaTmdbPorTitulo(filme.titulo, filme.ano);
    if (!match?.tmdb_id) return filme;

    const detalhes = await buscarDetalhesFilmeTmdb(match.tmdb_id);

    // Evita erro se outro filme local já usa o mesmo tmdb_id.
    const [duplicata] = await db.query(
      'SELECT id FROM filmes WHERE tmdb_id = ? AND id != ?',
      [detalhes.tmdb_id, filme.id]
    );

    if (duplicata.length > 0) {
      await db.query(
        `UPDATE filmes SET poster_url = ?, backdrop_url = ?, sinopse = COALESCE(?, sinopse),
         nota_tmdb = ?, elenco = COALESCE(?, elenco) WHERE id = ?`,
        [detalhes.poster_url, detalhes.backdrop_url, detalhes.sinopse, detalhes.nota_tmdb, detalhes.elenco, filme.id]
      );
    } else {
      await db.query(
        `UPDATE filmes SET
           tmdb_id = ?,
           titulo = ?,
           diretor = COALESCE(?, diretor),
           ano = COALESCE(?, ano),
           genero = COALESCE(?, genero),
           poster_url = ?,
           backdrop_url = ?,
           sinopse = COALESCE(?, sinopse),
           nota_tmdb = ?,
           elenco = COALESCE(?, elenco)
         WHERE id = ?`,
        [
          detalhes.tmdb_id,
          detalhes.titulo || filme.titulo,
          detalhes.diretor,
          detalhes.ano,
          detalhes.genero,
          detalhes.poster_url,
          detalhes.backdrop_url,
          detalhes.sinopse,
          detalhes.nota_tmdb,
          detalhes.elenco,
          filme.id,
        ]
      );
    }

    const [atualizado] = await db.query('SELECT * FROM filmes WHERE id = ?', [filme.id]);
    console.log(`🔄 Poster sincronizado: "${filme.titulo}" → TMDB #${detalhes.tmdb_id}`);
    return atualizado[0];
  } catch (erro) {
    console.warn(`⚠️  Falha ao sincronizar "${filme.titulo}":`, erro.message);
    return filme;
  }
}

/** Sincroniza vários filmes em paralelo (limite de concorrência). */
async function sincronizarFilmesSemPoster(filmes, limite = 5) {
  const pendentes = filmes.filter(precisaSincronizar);
  if (!pendentes.length || !tmdbConfigurada()) return filmes;

  const mapa = { ...Object.fromEntries(filmes.map((f) => [f.id, f])) };

  for (let i = 0; i < pendentes.length; i += limite) {
    const lote = pendentes.slice(i, i + limite);
    const sincronizados = await Promise.all(lote.map(sincronizarFilmeLocal));
    sincronizados.forEach((f) => { mapa[f.id] = f; });
  }

  return filmes.map((f) => mapa[f.id]);
}

/** Sincroniza todos os filmes locais sem poster (rota admin / startup). */
async function sincronizarTodosSemPoster() {
  const [filmes] = await db.query(
    'SELECT * FROM filmes WHERE poster_url IS NULL OR tmdb_id IS NULL'
  );
  const resultado = await sincronizarFilmesSemPoster(filmes, 3);
  const corrigidos = resultado.filter((f) => f.poster_url).length;
  return { total: filmes.length, corrigidos, filmes: resultado };
}

module.exports = {
  precisaSincronizar,
  sincronizarFilmeLocal,
  sincronizarFilmesSemPoster,
  sincronizarTodosSemPoster,
};
