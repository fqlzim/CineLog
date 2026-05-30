# CineLog — Documentação Acadêmica Completa (v2.6)

Documento para apresentação ao professor: explica **o que foi desenvolvido**, **como funciona** e **por que** cada tecnologia foi escolhida.

**Repositório GitHub:** [https://github.com/fqlzim/CineLog](https://github.com/fqlzim/CineLog)

---

## 1. Objetivo do projeto

Construir uma aplicação web full stack que simule a experiência de plataformas como **Letterboxd** e serviços de streaming, permitindo:

1. Descobrir filmes com catálogo global (TMDB)
2. Registrar usuários e autenticar com segurança (JWT + bcrypt)
3. Avaliar e comentar filmes (reviews sociais)
4. Administrar o sistema via painel restrito

---

## 2. O que é Git e GitHub (versionamento)

### Git (local)

**Git** é um sistema de controle de versão. Ele grava **snapshots** do projeto ao longo do tempo (commits). Cada commit tem mensagem, autor e data.

**Por que ajuda no desenvolvimento:**

- Histórico de mudanças (voltar atrás se algo quebrar)
- Trabalho organizado por funcionalidade (`feat: autenticação`)
- Backup e colaboração

### GitHub (remoto)

**GitHub** hospeda o repositório na nuvem. O comando `git push` envia os commits locais para `https://github.com/fqlzim/CineLog.git`.

**Fluxo típico:**

```
Código local → git add → git commit → git push → GitHub (público/privado)
```

### Arquivos ignorados (`.gitignore`)

Não sobem para o GitHub:

- `node_modules/` (reinstalados com `npm install`)
- `.env` (senhas e tokens TMDB)
- `dist/` (build gerado)

Isso evita vazamento de credenciais e repositório pesado.

---

## 3. Arquitetura em camadas

### 3.1 Visão geral

```
FRONTEND (React)
    ↓ HTTP (fetch, JSON)
BACKEND (Express)
    ↓ SQL                    ↓ HTTPS
MYSQL                  TMDB API
    ↓
Dados persistidos (usuários, avaliações, cache de filmes)
```

### 3.2 Frontend → Backend

O arquivo `cinelog-web/src/services/api.js` centraliza URLs:

```javascript
fetch('http://localhost:3000/filmes/catalogo')
  .then(res => res.json())
  .then(dados => setFilmes(dados.resultados));
```

O React **não acessa** MySQL nem TMDB diretamente — apenas a API Express.

### 3.3 Backend → MySQL + TMDB

- **MySQL:** usuários, avaliações, filmes em cache
- **TMDB:** catálogo, imagens, vídeos, créditos

O `filmes.controller.js` decide: buscar no banco, enriquecer com TMDB, salvar cache.

---

## 4. Estrutura de pastas

| Pasta | Papel acadêmico |
|-------|-----------------|
| `cinelog-api` | **Back-end** — regras de negócio, segurança, integrações |
| `cinelog-web` | **Front-end** — experiência do usuário no navegador |
| `banco_cinelog.sql` | Modelo relacional único do sistema |

**Por que duas pastas?** Separação de responsabilidades (padrão profissional): interface e servidor evoluem de forma independente.

---

## 5. Tecnologias detalhadas

### 5.1 React + Vite

- **React:** componentes (`FilmeCard`, `StarRating`) e estado (`useState`, `useEffect`)
- **Vite:** substitui Create React App; inicia em ~5173 com hot reload

### 5.2 Context API

- `AuthContext`: guarda usuário logado e token JWT no `localStorage`
- `GuestPromptContext`: modal quando visitante tenta avaliar

### 5.3 Express + REST

Endpoints seguem padrão REST:

| Método | Exemplo | Ação |
|--------|---------|------|
| GET | `/filmes/catalogo` | Listar |
| POST | `/auth/login` | Criar sessão |
| PUT | `/auth/profile` | Atualizar |
| DELETE | `/avaliacoes/:id` | Remover |

### 5.4 JWT (JSON Web Token)

1. Login válido → servidor assina token com `JWT_SECRET`
2. Cliente guarda token
3. Requisições privadas enviam header `Authorization: Bearer <token>`
4. `middleware/auth.js` decodifica e anexa `req.usuario`

### 5.5 bcrypt

Senhas nunca são salvas em texto. No cadastro: `bcrypt.hash(senha)` → `senha_hash` no MySQL.

### 5.6 TMDB

- Token JWT v4 (`eyJ...`) usa header `Authorization: Bearer`
- Serviços em `tmdb.service.js`: catálogo, busca, detalhes, vídeos, créditos
- `filmes-sync.service.js`: corrige posters de filmes locais sem imagem

**Seleção de trailer (v2.4.2):**

Prioridade: Official Trailer → Trailer → Teaser → qualquer YouTube → Vimeo, com preferência de idioma **pt → en**.

---

## 6. Funcionalidades implementadas

### 6.1 Autenticação

| Item | Implementação |
|------|----------------|
| Login | `Login.jsx` + `POST /auth/login` |
| Cadastro | `Cadastro.jsx` + `POST /auth/register` |
| JWT | `jsonwebtoken` + `localStorage` |
| bcrypt | `bcryptjs` no `auth.controller.js` |
| Rotas protegidas | `ProtectedRoute.jsx` |
| Middleware | `middleware/auth.js` |

### 6.2 Usuário

| Item | Implementação |
|------|----------------|
| Perfil público | `Perfil.jsx` |
| Editar perfil | `EditarPerfil.jsx` + `PUT /auth/profile` |
| Foto (URL) | Campo `foto_perfil` |
| E-mail/senha | Formulário com validação |
| Favoritos | Tabela `favoritos` no SQL (UI futura) |

### 6.3 Social

| Item | Implementação |
|------|----------------|
| Avaliações | `avaliacoes.controller.js` |
| Feed | `Feed.jsx` + `GET /avaliacoes/feed` |
| Reviews no filme | `ReviewCard.jsx` |
| Estrelas | `StarRating.jsx` (modo input vs display) |

### 6.4 Admin

| Item | Implementação |
|------|----------------|
| Painel | `/admin` — `Dashboard.jsx` |
| Filmes | `GerenciarFilmes.jsx` |
| Usuários | `GerenciarUsuarios.jsx` |
| Middleware admin | `middleware/admin.js` → 403 |
| Login limpo | Sem exibir credenciais demo na UI |

### 6.5 TMDB e filmes

| Item | Endpoint / arquivo |
|------|-------------------|
| Catálogo paginado | `GET /filmes/catalogo` |
| Gêneros | `GET /generos` |
| Busca | `GET /filmes/buscar?q=` |
| Detalhe completo | `GET /filmes/tmdb/:id` |
| Elenco / crew / trailer | `buscarDetalhesCompletosFilmeTmdb()` |

### 6.6 Séries

**Não implementado** nesta versão. Escopo = filmes (`/movie/` TMDB).

### 6.7 Responsividade

- Breakpoints: 480px, 768px, 1024px
- Menu mobile, grids flexíveis
- Estrelas **xl** só no formulário de avaliação; **sm** no feed/perfil

---

## 7. Banco de dados

Tabelas principais (`banco_cinelog.sql`):

| Tabela | Função |
|--------|--------|
| `usuarios` | Contas (tipo `usuario` ou `admin`) |
| `filmes` | Cache local + seed |
| `avaliacoes` | Nota 1–5 + comentário |
| `favoritos` | Relação N:N usuário-filme (watchlist) |

---

## 8. Execução — resumo

Ver `EXECUTAR_API.txt` e `EXECUTAR_REACT.txt`.

| Serviço | Porta | Comando |
|---------|-------|---------|
| API | 3000 | `cd cinelog-api && node server.js` |
| Web | 5173 | `cd cinelog-web && npm run dev` |

---

## 9. Commits Git (organização v2.6)

| Commit | Significado |
|--------|-------------|
| `chore: gitignore e estrutura inicial` | Prepara repositório sem lixo |
| `feat: schema MySQL e scripts` | Banco e init-db |
| `feat: API Express autenticação e filmes` | Backend core |
| `feat: integração TMDB e detalhes completos` | Serviços TMDB |
| `feat: frontend React CineLog` | Interface completa |
| `docs: README e documentação acadêmica v2.6` | Material para professor |

---

## 10. Referências para apresentação

- TMDB API: [developer.themoviedb.org](https://developer.themoviedb.org/docs)
- React: [react.dev](https://react.dev)
- Express: [expressjs.com](https://expressjs.com)

---

*Documento gerado para CineLog v2.6 — UNINASSAU*
