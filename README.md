# CineLog

**CineLog** é uma plataforma web inspirada em **Letterboxd** e catálogos de streaming, desenvolvida com **React**, **Express**, **MySQL** e integração com a **API TMDB** para gerenciamento, descoberta e avaliação de filmes.

Projeto acadêmico (UNINASSAU) com arquitetura em camadas, autenticação JWT, painel administrativo e interface responsiva.

**Repositório:** [github.com/fqlzim/CineLog](https://github.com/fqlzim/CineLog)

---

## Índice

1. [Visão geral](#visão-geral)
2. [Tecnologias](#tecnologias)
3. [Estrutura do projeto](#estrutura-do-projeto)
4. [Arquitetura](#arquitetura)
5. [Funcionalidades](#funcionalidades)
6. [Como executar](#como-executar)
7. [Documentação complementar](#documentação-complementar)
8. [Versionamento (Git)](#versionamento-git)

---

## Visão geral

O CineLog permite que usuários:

- Explorem um **catálogo dinâmico** de filmes (milhões de títulos via TMDB)
- Vejam **detalhes cinematográficos** (sinopse, elenco, equipe, trailer, países, gêneros)
- **Avaliem** filmes com estrelas e comentários (reviews)
- Acompanhem a **comunidade** no feed de avaliações
- Gerenciem **perfil** (nome, e-mail, foto, senha)
- Administradores usem o **painel admin** (usuários e filmes)

A comunicação entre interface e dados ocorre via **API REST** em JSON.

---

## Tecnologias

### Frontend (`cinelog-web`)

| Tecnologia | Função no projeto |
|------------|-------------------|
| **React** | Biblioteca para construir a interface com componentes reutilizáveis |
| **Vite** | Servidor de desenvolvimento rápido e build de produção |
| **React Router** | Navegação entre páginas (SPA) |
| **Context API** | Estado global de autenticação (`AuthContext`) e modal visitante (`GuestPromptContext`) |
| **CSS responsivo** | Layout adaptável (mobile, tablet, desktop) com media queries |

### Backend (`cinelog-api`)

| Tecnologia | Função no projeto |
|------------|-------------------|
| **Node.js + Express** | Servidor HTTP e rotas REST |
| **JWT** | Token de sessão após login (`jsonwebtoken`) |
| **bcrypt** | Hash seguro de senhas no cadastro/login |
| **dotenv** | Carrega credenciais do arquivo `.env` |
| **mysql2** | Conexão e queries no MySQL |
| **axios** | Requisições à API TMDB |

### Banco de dados

| Tecnologia | Função no projeto |
|------------|-------------------|
| **MySQL** | Persistência de usuários, filmes (cache), avaliações e favoritos |

### API externa

| Tecnologia | Função no projeto |
|------------|-------------------|
| **TMDB** | Catálogo mundial, posters, backdrops, trailers, gêneros, elenco e metadados |

---

## Estrutura do projeto

```
projeto-biblioteca/
├── cinelog-api/          ← Backend (Express + MySQL + TMDB)
│   ├── config/           ← Conexão MySQL
│   ├── controllers/      ← Lógica das rotas
│   ├── middleware/       ← JWT e admin
│   ├── routes/           ← Endpoints REST
│   ├── services/         ← TMDB e sync de posters
│   ├── scripts/          ← init-db, test-tmdb
│   └── server.js         ← Entrada da API
├── cinelog-web/          ← Frontend (React + Vite)
│   └── src/
│       ├── components/   ← UI reutilizável
│       ├── context/      ← Auth e GuestPrompt
│       ├── pages/        ← Telas completas
│       └── services/     ← api.js (fetch centralizado)
├── banco_cinelog.sql     ← Script do banco
├── DOCUMENTACAO_CINELOG.md
├── EXECUTAR_API.txt
├── EXECUTAR_REACT.txt
└── CREDENCIAIS.md        ← Admin (não exibido na tela de login)
```

---

## Arquitetura

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐
│   cinelog-web   │ ◄────────────────► │   cinelog-api   │
│  React (5173)   │   fetch + JWT      │  Express (3000) │
└─────────────────┘                    └────────┬────────┘
                                                │
                                    ┌───────────┴───────────┐
                                    ▼                       ▼
                              ┌──────────┐           ┌──────────┐
                              │  MySQL   │           │   TMDB   │
                              │ banco_   │           │   API    │
                              │ cinelog  │           │          │
                              └──────────┘           └──────────┘
```

### Fluxo de uma requisição

1. Usuário interage com o **React** (ex.: abrir catálogo).
2. `api.js` faz `fetch('http://localhost:3000/filmes/catalogo')`.
3. **Express** recebe a rota → **controller** processa → **service** chama TMDB/MySQL.
4. Resposta JSON volta ao React → componentes renderizam posters, textos, etc.

### Camadas do backend

| Camada | Responsabilidade |
|--------|------------------|
| **routes** | Define URLs (`GET /filmes/catalogo`) |
| **controllers** | Valida entrada, orquestra resposta |
| **services** | Integração TMDB, sync de imagens |
| **middleware** | Verifica JWT (`auth.js`) e tipo admin (`admin.js`) |
| **config/db** | Pool de conexões MySQL |

### Camadas do frontend

| Camada | Responsabilidade |
|--------|------------------|
| **pages** | Telas (Home, Login, FilmeDetalhe, Admin…) |
| **components** | Cards, estrelas, header, rotas protegidas |
| **context** | Estado de login e modal para visitantes |
| **services/api.js** | Todas as chamadas HTTP à API |

---

## Funcionalidades

### Autenticação

- Cadastro de usuário (`POST /auth/register`)
- Login com e-mail e senha (`POST /auth/login`)
- Senha armazenada com **bcrypt** (nunca em texto puro)
- **JWT** retornado no login e enviado em rotas privadas (`Authorization: Bearer`)
- Rotas protegidas no React (`ProtectedRoute`, `AdminRoute`)
- Middleware no Express valida token antes de criar avaliação ou acessar admin

### Usuário

- Perfil público (`/perfil/:id`) com lista de avaliações
- Editar perfil: nome, e-mail, URL da foto, troca de senha (`PUT /auth/profile`)
- Tabela **favoritos** no banco (estrutura pronta para watchlist futura)

### Social

- Avaliar filmes (1–5 estrelas + comentário opcional)
- Feed da comunidade com avaliações recentes
- Reviews públicas na página do filme
- Editar/excluir própria avaliação

### Admin

- Painel em `/admin` (apenas `tipo = admin`)
- Dashboard com estatísticas
- Gerenciar usuários (promover/rebaixar admin, excluir)
- CRUD de filmes locais
- Middleware retorna **403** se usuário comum tentar acessar
- Credenciais admin **não aparecem** na tela de login (documentadas em `CREDENCIAIS.md`)

### TMDB

- Catálogo paginado (popular, top rated, em cartaz, lançamentos)
- Busca global por título
- 19+ gêneros oficiais com filtro
- Posters e backdrops em alta resolução
- Sync automático de filmes locais sem imagem
- Trailers YouTube/Vimeo com prioridade inteligente e idioma (pt → en)

### Filmes

- Página de detalhe com sinopse, elenco (cast), equipe (crew), países, detalhes técnicos
- Botão de trailer (nova aba) ou mensagem elegante se indisponível
- Cache no MySQL ao abrir filme TMDB

### Séries

> **Não implementado nesta versão.** O escopo atual é **filmes**. A tabela e a API TMDB de séries podem ser evolução futura.

### Responsividade e UX

- Menu hamburger no mobile
- Grid adaptativo de catálogo e elenco
- **Estrelas premium** no formulário de avaliação (grandes, hover, touch)
- **Estrelas compactas** no feed e perfil (proporcionais ao card)
- Modal para visitantes que tentam avaliar sem login
- Tema escuro estilo streaming

---

## Como executar

### Pré-requisitos

- Node.js 18+
- MySQL 8+
- Conta/chave TMDB ([themoviedb.org](https://www.themoviedb.org/settings/api))

### 1. Banco de dados

No **MySQL Workbench**, execute:

`banco_cinelog.sql`

Ou migração incremental:

```bash
cd cinelog-api
npm run init-db
```

### 2. Configurar TMDB

Copie o exemplo e preencha:

```bash
cd cinelog-api
copy .env.example .env
```

Edite `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=banco_cinelog
JWT_SECRET=uma_chave_secreta_forte
TMDB_API_KEY=seu_token_tmdb
```

Teste a TMDB:

```bash
npm run test-tmdb
```

### 3. Backend (Terminal 1)

```bash
cd cinelog-api
npm install
node server.js
```

API: **http://localhost:3000**

### 4. Frontend (Terminal 2)

```bash
cd cinelog-web
npm install
npm run dev
```

App: **http://localhost:5173**

---



---

## Versionamento (Git)

O projeto usa **Git** para histórico de alterações e **GitHub** para publicação remota.

```bash
git clone https://github.com/fqlzim/CineLog.git
cd CineLog
```

Commits organizados por tipo (`feat`, `docs`, `chore`) facilitam revisão acadêmica e manutenção.

---

**Desenvolvido para apresentação acadêmica — UNINASSAU**
