/**
 * ============================================================
 * services/tmdb.service.js — Integração TMDB (CineLog)
 * ============================================================
 * Credenciais via .env → dotenv → process.env.TMDB_API_KEY
 * JWT (eyJ...) usa Bearer; API Key usa ?api_key=
 */

const axios = require('axios');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

/** Cargos da equipe técnica (crew) exibidos na página do filme. */
const CARGOS_EQUIPE_PRIORIDADE = [
  'Director',
  'Screenplay',
  'Writer',
  'Producer',
  'Executive Producer',
  'Director of Photography',
  'Original Music Composer',
  'Editor',
  'Production Design',
  'Costume Design',
];

const TRADUCAO_CARGOS = {
  Director: 'Direção',
  Screenplay: 'Roteiro',
  Writer: 'Roteiro',
  Producer: 'Produção',
  'Executive Producer': 'Produtor executivo',
  'Director of Photography': 'Fotografia',
  'Original Music Composer': 'Música',
  Editor: 'Edição',
  'Production Design': 'Direção de arte',
  'Costume Design': 'Figurino',
};

/** Tipos de catálogo suportados (mesma fonte da Busca). */
const TIPOS_CATALOGO = {
  popular: '/movie/popular',
  top_rated: '/movie/top_rated',
  now_playing: '/movie/now_playing',
  upcoming: '/movie/upcoming',
};

function obterChaveTmdb() {
  const chave = process.env.TMDB_API_KEY;
  if (!chave || !String(chave).trim()) return null;
  return String(chave).trim();
}

function ehTokenJwt(chave) {
  return chave.startsWith('eyJ');
}

function tmdbConfigurada() {
  return Boolean(obterChaveTmdb());
}

function criarConfigRequisicao(extrasParams = {}) {
  const chave = obterChaveTmdb();
  const params = { language: 'pt-BR', ...extrasParams };

  if (ehTokenJwt(chave)) {
    return { params, headers: { Authorization: `Bearer ${chave}` } };
  }
  return { params: { ...params, api_key: chave } };
}

async function requisicaoTmdb(endpoint, paramsExtras = {}) {
  if (!tmdbConfigurada()) {
    const erro = new Error('TMDB_API_KEY não configurada no arquivo .env');
    erro.status = 503;
    throw erro;
  }

  try {
    const config = criarConfigRequisicao(paramsExtras);
    const resposta = await axios.get(`${TMDB_BASE}${endpoint}`, config);
    return resposta.data;
  } catch (erroAxios) {
    const msg = erroAxios.response?.data?.status_message || erroAxios.message;
    const erro = new Error(`TMDB: ${msg}`);
    erro.status = erroAxios.response?.status || 502;
    throw erro;
  }
}

function mapearFilmeResumo(filme) {
  return {
    tmdb_id: filme.id,
    titulo: filme.title,
    ano: filme.release_date ? parseInt(filme.release_date.slice(0, 4), 10) : null,
    sinopse: filme.overview || null,
    poster_url: filme.poster_path ? `${TMDB_POSTER_BASE}${filme.poster_path}` : null,
    backdrop_url: filme.backdrop_path ? `${TMDB_BACKDROP_BASE}${filme.backdrop_path}` : null,
    nota_tmdb: filme.vote_average ?? null,
    genero: (filme.genre_ids || []).join(','),
  };
}

async function buscarFilmesNaTmdb(termo, ano = null) {
  const params = { query: termo };
  if (ano) params.year = ano;
  const dados = await requisicaoTmdb('/search/movie', params);
  return (dados.results || []).map(mapearFilmeResumo);
}

async function buscarPopularesNaTmdb() {
  const dados = await requisicaoTmdb('/movie/popular');
  return (dados.results || []).slice(0, 10).map(mapearFilmeResumo);
}

/**
 * Catálogo paginado — mesma fonte TMDB usada na Busca.
 * @param {string} tipo - popular | top_rated | now_playing | upcoming
 * @param {number} page - página TMDB (20 filmes por página)
 */
async function buscarCatalogoTmdb(tipo = 'popular', page = 1) {
  const endpoint = TIPOS_CATALOGO[tipo] || TIPOS_CATALOGO.popular;
  const dados = await requisicaoTmdb(endpoint, { page: parseInt(page, 10) || 1 });

  return {
    resultados: (dados.results || []).map(mapearFilmeResumo),
    page: dados.page,
    total_pages: dados.total_pages,
    total_results: dados.total_results,
    tipo,
  };
}

/** Lista oficial de gêneros TMDB (pt-BR). */
async function listarGenerosTmdb() {
  const dados = await requisicaoTmdb('/genre/movie/list');
  return (dados.genres || []).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

/** Filmes por gênero TMDB — GET /discover/movie?with_genres= */
async function buscarFilmesPorGeneroTmdb(generoId, page = 1) {
  const dados = await requisicaoTmdb('/discover/movie', {
    with_genres: generoId,
    page: parseInt(page, 10) || 1,
    sort_by: 'popularity.desc',
  });

  return {
    resultados: (dados.results || []).map(mapearFilmeResumo),
    page: dados.page,
    total_pages: dados.total_pages,
    total_results: dados.total_results,
    genero_id: parseInt(generoId, 10),
  };
}

function formatarDuracao(minutos) {
  if (!minutos) return null;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

function formatarMoeda(valor) {
  if (valor == null || valor === 0) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(valor);
}

/**
 * CAST (elenco) = atores em cena (credits.cast)
 * CREW (equipe) = direção, roteiro, fotografia... (credits.crew)
 */
function mapearElenco(cast) {
  return (cast || [])
    .slice(0, 20)
    .map((ator) => ({
      id: ator.id,
      nome: ator.name,
      personagem: ator.character,
      foto_url: ator.profile_path ? `${TMDB_PROFILE_BASE}${ator.profile_path}` : null,
      ordem: ator.order,
    }));
}

function mapearEquipe(crew) {
  const lista = [];
  const vistos = new Set();

  CARGOS_EQUIPE_PRIORIDADE.forEach((cargoIngles) => {
    const pessoas = (crew || []).filter((p) => p.job === cargoIngles);
    pessoas.slice(0, 2).forEach((p) => {
      const chave = `${p.id}-${cargoIngles}`;
      if (!vistos.has(chave)) {
        vistos.add(chave);
        lista.push({
          nome: p.name,
          cargo: TRADUCAO_CARGOS[cargoIngles] || cargoIngles,
          cargo_original: cargoIngles,
          departamento: p.department,
        });
      }
    });
  });

  return lista.slice(0, 14);
}

/**
 * Pontua idioma do vídeo TMDB (iso_639_1).
 * Preferência: pt-BR > pt > en-US > en > outros
 */
function pontuarIdiomaVideo(iso) {
  if (!iso) return 0;
  const cod = String(iso).toLowerCase();
  if (cod === 'pt' || cod === 'pt-br') return 40;
  if (cod.startsWith('pt')) return 35;
  if (cod === 'en' || cod === 'en-us') return 25;
  if (cod.startsWith('en')) return 20;
  return 5;
}

function montarUrlVideo(video) {
  if (!video?.key) return null;

  if (video.site === 'YouTube') {
    return {
      key: video.key,
      nome: video.name,
      tipo: video.type,
      oficial: Boolean(video.official),
      site: 'YouTube',
      idioma: video.iso_639_1 || null,
      youtube_url: `https://www.youtube.com/watch?v=${video.key}`,
    };
  }

  if (video.site === 'Vimeo') {
    return {
      key: video.key,
      nome: video.name,
      tipo: video.type,
      oficial: Boolean(video.official),
      site: 'Vimeo',
      idioma: video.iso_639_1 || null,
      youtube_url: `https://vimeo.com/${video.key}`,
    };
  }

  return null;
}

/**
 * TMDB GET /movie/{id}/videos → videos.results[]
 *
 * Cada item tem:
 *   type     → Trailer | Teaser | Clip | Featurette...
 *   site     → YouTube | Vimeo
 *   key      → ID do vídeo (ex: dQw4w9WgXcQ no YouTube)
 *   official → trailer oficial do estúdio
 *   iso_639_1 → idioma (pt, en...)
 *
 * Prioridade (evita falso "sem trailer"):
 *   1. Official Trailer + YouTube
 *   2. Trailer + YouTube
 *   3. Teaser + YouTube
 *   4. Qualquer YouTube com key
 *   5. Trailer/qualquer Vimeo
 */
function selecionarTrailer(videosData) {
  const todos = (videosData?.results || []).filter((v) => v.key && v.site);

  if (!todos.length) return null;

  const ordenarPorIdioma = (lista) =>
    [...lista].sort(
      (a, b) => pontuarIdiomaVideo(b.iso_639_1) - pontuarIdiomaVideo(a.iso_639_1)
    );

  const regras = [
    {
      descricao: 'Official Trailer + YouTube',
      filtro: (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official === true,
    },
    {
      descricao: 'Trailer + YouTube',
      filtro: (v) => v.site === 'YouTube' && v.type === 'Trailer',
    },
    {
      descricao: 'Teaser + YouTube',
      filtro: (v) => v.site === 'YouTube' && v.type === 'Teaser',
    },
    {
      descricao: 'Clip/Featurette + YouTube',
      filtro: (v) =>
        v.site === 'YouTube' && ['Clip', 'Featurette', 'Behind the Scenes'].includes(v.type),
    },
    {
      descricao: 'Qualquer YouTube',
      filtro: (v) => v.site === 'YouTube',
    },
    {
      descricao: 'Trailer + Vimeo',
      filtro: (v) => v.site === 'Vimeo' && v.type === 'Trailer',
    },
    {
      descricao: 'Qualquer Vimeo',
      filtro: (v) => v.site === 'Vimeo',
    },
  ];

  for (const regra of regras) {
    const candidatos = ordenarPorIdioma(todos.filter(regra.filtro));
    if (candidatos.length > 0) {
      const montado = montarUrlVideo(candidatos[0]);
      if (montado) {
        montado.selecao = regra.descricao;
        return montado;
      }
    }
  }

  return null;
}

/**
 * Detalhes completos TMDB — usado em GET /filmes/tmdb/:id e enriquecimento por id local.
 * Requisições paralelas: filme + credits + videos
 */
async function buscarDetalhesCompletosFilmeTmdb(tmdbId) {
  const [filme, creditos, videosData] = await Promise.all([
    requisicaoTmdb(`/movie/${tmdbId}`),
    requisicaoTmdb(`/movie/${tmdbId}/credits`),
    requisicaoTmdb(`/movie/${tmdbId}/videos`),
  ]);

  const diretorObj = (creditos.crew || []).find((p) => p.job === 'Director');
  const elencoLista = mapearElenco(creditos.cast);
  const equipe = mapearEquipe(creditos.crew);
  const trailer = selecionarTrailer(videosData);

  const generos = (filme.genres || []).map((g) => ({ id: g.id, nome: g.name }));
  const paises = (filme.production_countries || []).map((p) => ({
    codigo: p.iso_3166_1,
    nome: p.name,
  }));

  return {
    ...mapearFilmeResumo(filme),
    diretor: diretorObj ? diretorObj.name : null,
    genero: generos.map((g) => g.nome).join(', '),
    generos,
    paises,
    elenco: elencoLista.map((a) => a.nome).join(', '),
    elenco_lista: elencoLista,
    equipe,
    trailer,
    detalhes: {
      duracao_minutos: filme.runtime || null,
      duracao_formatada: formatarDuracao(filme.runtime),
      classificacao: filme.adult ? '18+' : null,
      idioma_original: filme.original_language
        ? filme.original_language.toUpperCase()
        : null,
      data_lancamento: filme.release_date || null,
      orcamento: filme.budget || null,
      orcamento_formatado: formatarMoeda(filme.budget),
      receita: filme.revenue || null,
      receita_formatada: formatarMoeda(filme.revenue),
      status: filme.status || null,
      popularidade: filme.popularity ?? null,
      nota_tmdb: filme.vote_average ?? null,
      total_votos: filme.vote_count ?? null,
      tagline: filme.tagline || null,
    },
    tmdb_completo: true,
  };
}

/** Resumo leve (compatível com sync/cache MySQL). */
async function buscarDetalhesFilmeTmdb(tmdbId) {
  const completo = await buscarDetalhesCompletosFilmeTmdb(tmdbId);
  return {
    tmdb_id: completo.tmdb_id,
    titulo: completo.titulo,
    ano: completo.ano,
    sinopse: completo.sinopse,
    poster_url: completo.poster_url,
    backdrop_url: completo.backdrop_url,
    nota_tmdb: completo.nota_tmdb,
    diretor: completo.diretor,
    genero: completo.genero,
    elenco: completo.elenco,
  };
}

/**
 * Sincroniza filme LOCAL sem poster com a TMDB (título + ano).
 * Usado para corrigir seed do banco (Clube da Luta, Matrix, etc.).
 */
async function encontrarFilmeNaTmdbPorTitulo(titulo, ano = null) {
  const resultados = await buscarFilmesNaTmdb(titulo, ano);

  if (!resultados.length) return null;

  if (ano) {
    const exato = resultados.find((f) => f.ano === ano);
    if (exato) return exato;
  }

  return resultados[0];
}

async function testarConexaoTmdb() {
  const chave = obterChaveTmdb();
  if (!chave) return { ok: false, motivo: 'TMDB_API_KEY ausente no .env' };

  const dados = await requisicaoTmdb('/movie/popular');
  const primeiro = dados.results?.[0];

  return {
    ok: true,
    tipo_auth: ehTokenJwt(chave) ? 'Bearer JWT (v4)' : 'api_key (v3)',
    filme_exemplo: primeiro?.title,
    poster_ok: Boolean(primeiro?.poster_path),
    backdrop_ok: Boolean(primeiro?.backdrop_path),
  };
}

module.exports = {
  tmdbConfigurada,
  buscarFilmesNaTmdb,
  buscarPopularesNaTmdb,
  buscarCatalogoTmdb,
  listarGenerosTmdb,
  buscarFilmesPorGeneroTmdb,
  buscarDetalhesFilmeTmdb,
  buscarDetalhesCompletosFilmeTmdb,
  encontrarFilmeNaTmdbPorTitulo,
  testarConexaoTmdb,
  ehTokenJwt,
  TIPOS_CATALOGO,
};
