/**
 * ============================================================
 * services/api.js — Comunicação centralizada com a API
 * ============================================================
 *
 * POR QUE CENTRALIZAR?
 *   Evita repetir fetch('http://localhost:3000/...') em todo componente.
 *   Se a URL mudar, alteramos só aqui.
 *
 * TOKEN JWT:
 *   getToken() lê do localStorage — gravado no login.
 *   headersAuth() adiciona Authorization em rotas privadas.
 */

const API_URL = 'http://localhost:3000';

/** Chave usada no localStorage para guardar o JWT. */
const TOKEN_KEY = 'cinelog_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Headers padrão + token quando existir. */
function headersAuth(contentType = true) {
  const headers = {};
  if (contentType) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** Trata resposta: se erro HTTP, lança exceção com mensagem da API. */
async function tratarResposta(response) {
  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const erro = new Error(data.erro || 'Erro na requisição.');
    erro.status = response.status;
    erro.dados = data;
    throw erro;
  }

  return data;
}

// ─── AUTH ───────────────────────────────────────────────────

export async function apiLogin(email, senha) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: headersAuth(),
    body: JSON.stringify({ email, senha }),
  });
  return tratarResposta(res);
}

export async function apiRegister(dados) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: headersAuth(),
    body: JSON.stringify(dados),
  });
  return tratarResposta(res);
}

export async function apiMe() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: headersAuth(false),
  });
  return tratarResposta(res);
}

/** PUT /auth/profile — atualizar perfil (retorna novo JWT). */
export async function apiAtualizarPerfil(dados) {
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: headersAuth(),
    body: JSON.stringify(dados),
  });
  return tratarResposta(res);
}

export async function apiObterUsuario(id) {
  const res = await fetch(`${API_URL}/auth/usuario/${id}`);
  return tratarResposta(res);
}

// ─── FILMES ─────────────────────────────────────────────────

/** GET /filmes/catalogo — catálogo dinâmico TMDB com paginação. */
export async function apiCatalogo({ tipo = 'popular', page = 1, generoId = null } = {}) {
  let url;
  if (generoId) {
    url = `${API_URL}/filmes/genero/${generoId}?page=${page}`;
  } else {
    url = `${API_URL}/filmes/catalogo?tipo=${tipo}&page=${page}`;
  }
  const res = await fetch(url);
  return tratarResposta(res);
}

/** GET /generos — gêneros oficiais TMDB. */
export async function apiGeneros() {
  const res = await fetch(`${API_URL}/generos`);
  return tratarResposta(res);
}

export async function apiListarFilmes() {
  const res = await fetch(`${API_URL}/filmes`);
  return tratarResposta(res);
}

/** GET /filmes/populares — destaques TMDB para hero da Home. */
export async function apiFilmesPopulares() {
  const res = await fetch(`${API_URL}/filmes/populares`);
  return tratarResposta(res);
}

export async function apiBuscarFilmes(termo) {
  const res = await fetch(`${API_URL}/filmes/buscar?q=${encodeURIComponent(termo)}`);
  return tratarResposta(res);
}

export async function apiObterFilme(id) {
  const res = await fetch(`${API_URL}/filmes/${id}`);
  return tratarResposta(res);
}

export async function apiObterFilmeTmdb(tmdbId) {
  const res = await fetch(`${API_URL}/filmes/tmdb/${tmdbId}`);
  return tratarResposta(res);
}

export async function apiCriarFilme(dados) {
  const res = await fetch(`${API_URL}/filmes`, {
    method: 'POST',
    headers: headersAuth(),
    body: JSON.stringify(dados),
  });
  return tratarResposta(res);
}

export async function apiAtualizarFilme(id, dados) {
  const res = await fetch(`${API_URL}/filmes/${id}`, {
    method: 'PUT',
    headers: headersAuth(),
    body: JSON.stringify(dados),
  });
  return tratarResposta(res);
}

export async function apiRemoverFilme(id) {
  const res = await fetch(`${API_URL}/filmes/${id}`, {
    method: 'DELETE',
    headers: headersAuth(false),
  });
  return tratarResposta(res);
}

// ─── AVALIAÇÕES ─────────────────────────────────────────────

export async function apiFeedAvaliacoes() {
  const res = await fetch(`${API_URL}/avaliacoes/feed`);
  return tratarResposta(res);
}

export async function apiAvaliacoesFilme(filmeId) {
  const res = await fetch(`${API_URL}/avaliacoes/filme/${filmeId}`);
  return tratarResposta(res);
}

export async function apiAvaliacoesUsuario(usuarioId) {
  const res = await fetch(`${API_URL}/avaliacoes/usuario/${usuarioId}`);
  return tratarResposta(res);
}

export async function apiMinhaAvaliacao(filmeId) {
  const res = await fetch(`${API_URL}/avaliacoes/minha/${filmeId}`, {
    headers: headersAuth(false),
  });
  return tratarResposta(res);
}

export async function apiCriarAvaliacao(dados) {
  const res = await fetch(`${API_URL}/avaliacoes`, {
    method: 'POST',
    headers: headersAuth(),
    body: JSON.stringify(dados),
  });
  return tratarResposta(res);
}

export async function apiAtualizarAvaliacao(id, dados) {
  const res = await fetch(`${API_URL}/avaliacoes/${id}`, {
    method: 'PUT',
    headers: headersAuth(),
    body: JSON.stringify(dados),
  });
  return tratarResposta(res);
}

export async function apiRemoverAvaliacao(id) {
  const res = await fetch(`${API_URL}/avaliacoes/${id}`, {
    method: 'DELETE',
    headers: headersAuth(false),
  });
  return tratarResposta(res);
}

// ─── ADMIN ──────────────────────────────────────────────────

export async function apiAdminDashboard() {
  const res = await fetch(`${API_URL}/admin/dashboard`, {
    headers: headersAuth(false),
  });
  return tratarResposta(res);
}

export async function apiAdminUsuarios() {
  const res = await fetch(`${API_URL}/admin/usuarios`, {
    headers: headersAuth(false),
  });
  return tratarResposta(res);
}

export async function apiAdminRemoverUsuario(id) {
  const res = await fetch(`${API_URL}/admin/usuarios/${id}`, {
    method: 'DELETE',
    headers: headersAuth(false),
  });
  return tratarResposta(res);
}

export async function apiAdminAlterarTipo(id, tipo) {
  const res = await fetch(`${API_URL}/admin/usuarios/${id}/tipo`, {
    method: 'PATCH',
    headers: headersAuth(),
    body: JSON.stringify({ tipo }),
  });
  return tratarResposta(res);
}
