-- ============================================================
--  CINELOG — Banco de Dados MySQL (ARQUIVO ÚNICO DEFINITIVO)
--  UNINASSAU | Avaliação Prática — Projeto Biblioteca (Filmes)
-- ============================================================
--
--  HISTÓRICO DE UNIFICAÇÃO (para apresentação acadêmica):
--  ─────────────────────────────────────────────────────────
--  Existiam dois arquivos:
--    • banco_cinelog.sql        → estrutura completa v2
--    • banco_cinelog_upgrade.sql → ALTER TABLE para quem tinha v1
--
--  PROBLEMA: manter dois arquivos confundia instalação e estudo.
--  SOLUÇÃO: este arquivo único contém TUDO:
--    ✓ Tabelas usuarios, filmes, avaliacoes, favoritos
--    ✓ Colunas TMDB (tmdb_id, poster_url, backdrop_url, sinopse...)
--    ✓ Remoção da coluna antiga "nota" em filmes (nota vem de avaliacoes)
--    ✓ Admin padrão para testes
--    ✓ Filmes de exemplo
--
--  Quem já tinha banco antigo pode usar: npm run init-db (cinelog-api)
--  que aplica migrações incrementais SEM apagar dados.
--
--  DIAGRAMA DE RELACIONAMENTOS:
--  ┌──────────┐     ┌────────────┐     ┌──────────┐
--  │ usuarios │────<│ avaliacoes │>────│  filmes  │
--  └──────────┘     └────────────┘     └──────────┘
--       │                                    │
--       └──────────< favoritos >─────────────┘
-- ============================================================

DROP DATABASE IF EXISTS cinelog;

CREATE DATABASE cinelog
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cinelog;

-- ============================================================
-- TABELA: usuarios
-- Login, perfil editável, permissões (usuario | admin).
-- Campo tipo = 'admin' → acesso ao painel /admin
-- ============================================================
CREATE TABLE usuarios (
  id              INT          NOT NULL AUTO_INCREMENT,
  nome_usuario    VARCHAR(50)  NOT NULL,
  email           VARCHAR(150) NOT NULL,
  senha_hash      VARCHAR(255) NOT NULL,
  foto_perfil     VARCHAR(500) NULL,
  tipo            ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
  criado_em       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_nome (nome_usuario),
  UNIQUE KEY uk_usuarios_email (email)
);

-- ============================================================
-- TABELA: filmes
-- Catálogo local + cache TMDB. Imagens reais via poster_url e backdrop_url.
-- ============================================================
CREATE TABLE filmes (
  id            INT          NOT NULL AUTO_INCREMENT,
  tmdb_id       INT          NULL,
  titulo        VARCHAR(200) NOT NULL,
  diretor       VARCHAR(150) NULL,
  ano           YEAR         NULL,
  genero        VARCHAR(200) NULL,
  poster_url    VARCHAR(500) NULL,
  backdrop_url  VARCHAR(500) NULL,
  sinopse       TEXT         NULL,
  nota_tmdb     DECIMAL(3,1) NULL,
  elenco        TEXT         NULL,
  criado_em     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_filmes_tmdb (tmdb_id)
);

-- ============================================================
-- TABELA: avaliacoes — reviews sociais (1 por usuário/filme)
-- ============================================================
CREATE TABLE avaliacoes (
  id            INT       NOT NULL AUTO_INCREMENT,
  usuario_id    INT       NOT NULL,
  filme_id      INT       NOT NULL,
  nota          TINYINT   NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario    TEXT      NULL,
  criado_em     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_avaliacoes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_avaliacoes_filme
    FOREIGN KEY (filme_id) REFERENCES filmes(id) ON DELETE CASCADE,
  UNIQUE KEY uk_avaliacao_usuario_filme (usuario_id, filme_id)
);

-- ============================================================
-- TABELA: favoritos — watchlist pessoal
-- ============================================================
CREATE TABLE favoritos (
  id          INT       NOT NULL AUTO_INCREMENT,
  usuario_id  INT       NOT NULL,
  filme_id    INT       NOT NULL,
  criado_em   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_favoritos_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_favoritos_filme
    FOREIGN KEY (filme_id) REFERENCES filmes(id) ON DELETE CASCADE,
  UNIQUE KEY uk_favorito_usuario_filme (usuario_id, filme_id)
);

-- ============================================================
-- CREDENCIAIS ADMIN PADRÃO (desenvolvimento / apresentação)
-- Email: admin@cinelog.com
-- Senha: admin123
-- Hash bcrypt (10 rounds) — NUNCA armazene senha em texto no banco!
-- ============================================================
INSERT INTO usuarios (nome_usuario, email, senha_hash, tipo) VALUES
  (
    'admin',
    'admin@cinelog.com',
    '$2b$10$3Pg6ESTHBglG7SVHQ1x5Zuv4u783q1xwsUAC3tpIXjHVxKpVh63hq',
    'admin'
  );

INSERT INTO filmes (titulo, diretor, ano, genero, sinopse) VALUES
  ('Parasita',             'Bong Joon-ho',           2019, 'Thriller',          'Família pobre infiltra-se na casa de uma família rica.'),
  ('Clube da Luta',        'David Fincher',           1999, 'Drama',             'Um homem insone forma um clube de luta clandestino.'),
  ('Interestelar',         'Christopher Nolan',       2014, 'Ficção Científica', 'Exploradores viajam por um buraco de minhoca para salvar a humanidade.'),
  ('Cidade de Deus',       'Fernando Meirelles',      2002, 'Drama',             'Juventude e crime na Cidade de Deus, Rio de Janeiro.'),
  ('O Poderoso Chefão',    'Francis Ford Coppola',    1972, 'Drama',             'Saga da família Corleone no submundo do crime.'),
  ('Matrix',               'Lana e Lilly Wachowski',  1999, 'Ficção Científica', 'Hacker descobre que a realidade é uma simulação.'),
  ('Pulp Fiction',         'Quentin Tarantino',       1994, 'Thriller',          'Histórias entrelaçadas de crime em Los Angeles.'),
  ('Coringa',              'Todd Phillips',           2019, 'Drama',             'Origem do icônico vilão de Gotham.');
