/**
 * scripts/init-db.js — Migração automática do banco
 *
 * Execute: node scripts/init-db.js
 *
 * Cria tabelas novas (usuarios, avaliacoes, favoritos) e
 * adiciona colunas TMDB em filmes SEM apagar dados existentes.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function colunaExiste(conn, tabela, coluna) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [process.env.DB_NAME || 'cinelog', tabela, coluna]
  );
  return rows[0].n > 0;
}

async function tabelaExiste(conn, tabela) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [process.env.DB_NAME || 'cinelog', tabela]
  );
  return rows[0].n > 0;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cinelog',
    multipleStatements: true,
  });

  console.log('🔧 Iniciando migração do banco CineLog...\n');

  // ── Tabela usuarios ──
  if (!(await tabelaExiste(conn, 'usuarios'))) {
    await conn.query(`
      CREATE TABLE usuarios (
        id INT NOT NULL AUTO_INCREMENT,
        nome_usuario VARCHAR(50) NOT NULL,
        email VARCHAR(150) NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        foto_perfil VARCHAR(500) NULL,
        tipo ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_usuarios_nome (nome_usuario),
        UNIQUE KEY uk_usuarios_email (email)
      )
    `);
    console.log('✅ Tabela usuarios criada');
  } else {
    console.log('ℹ️  Tabela usuarios já existe');
  }

  // ── Alterações em filmes ──
  const colunasFilmes = [
    ['tmdb_id', 'INT NULL UNIQUE'],
    ['poster_url', 'VARCHAR(500) NULL'],
    ['backdrop_url', 'VARCHAR(500) NULL'],
    ['sinopse', 'TEXT NULL'],
    ['nota_tmdb', 'DECIMAL(3,1) NULL'],
    ['elenco', 'TEXT NULL'],
  ];

  for (const [nome, tipo] of colunasFilmes) {
    if (!(await colunaExiste(conn, 'filmes', nome))) {
      await conn.query(`ALTER TABLE filmes ADD COLUMN ${nome} ${tipo}`);
      console.log(`✅ Coluna filmes.${nome} adicionada`);
    }
  }

  if (await colunaExiste(conn, 'filmes', 'nota')) {
    await conn.query('ALTER TABLE filmes DROP COLUMN nota');
    console.log('✅ Coluna filmes.nota removida (notas agora vêm de avaliacoes)');
  }

  // ── Tabela avaliacoes ──
  if (!(await tabelaExiste(conn, 'avaliacoes'))) {
    await conn.query(`
      CREATE TABLE avaliacoes (
        id INT NOT NULL AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        filme_id INT NOT NULL,
        nota TINYINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
        comentario TEXT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_avaliacoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        CONSTRAINT fk_avaliacoes_filme FOREIGN KEY (filme_id) REFERENCES filmes(id) ON DELETE CASCADE,
        UNIQUE KEY uk_avaliacao_usuario_filme (usuario_id, filme_id)
      )
    `);
    console.log('✅ Tabela avaliacoes criada');
  }

  // ── Tabela favoritos ──
  if (!(await tabelaExiste(conn, 'favoritos'))) {
    await conn.query(`
      CREATE TABLE favoritos (
        id INT NOT NULL AUTO_INCREMENT,
        usuario_id INT NOT NULL,
        filme_id INT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_favoritos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        CONSTRAINT fk_favoritos_filme FOREIGN KEY (filme_id) REFERENCES filmes(id) ON DELETE CASCADE,
        UNIQUE KEY uk_favorito_usuario_filme (usuario_id, filme_id)
      )
    `);
    console.log('✅ Tabela favoritos criada');
  }

  // ── Admin demo ──
  const [admins] = await conn.query('SELECT id FROM usuarios WHERE email = ?', ['admin@cinelog.com']);
  if (admins.length === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await conn.query(
      `INSERT INTO usuarios (nome_usuario, email, senha_hash, tipo) VALUES ('admin', 'admin@cinelog.com', ?, 'admin')`,
      [hash]
    );
    console.log('✅ Usuário admin criado (admin@cinelog.com / admin123)');
  }

  await conn.end();
  console.log('\n🎬 Migração concluída! Reinicie a API com: node server.js\n');
}

main().catch((err) => {
  console.error('❌ Erro na migração:', err.message);
  process.exit(1);
});
