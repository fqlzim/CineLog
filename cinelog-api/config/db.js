/**
 * ============================================================
 * config/db.js — Conexão com o banco MySQL
 * ============================================================
 *
 * O QUE FAZ?
 *   Cria um "pool" de conexões reutilizáveis com o MySQL.
 *
 * POR QUE POOL EM VEZ DE createConnection?
 *   Várias requisições HTTP podem chegar ao mesmo tempo.
 *   O pool gerencia filas de conexões — mais eficiente e seguro.
 *
 * COMO O BACKEND USA?
 *   Outros arquivos fazem: const db = require('../config/db');
 *   Depois: db.query('SELECT ...', [params], callback) ou db.promise().query(...)
 */

const mysql = require('mysql2');

// Pool lê credenciais do arquivo .env (dotenv é carregado no server.js).
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cinelog',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Testa conexão ao subir o servidor (callback de erro ajuda no debug).
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erro ao conectar ao MySQL:', err.message);
    console.error('   Verifique se o MySQL está rodando e se o .env está correto.');
    return;
  }
  console.log('✅ Conectado ao banco MySQL —', process.env.DB_NAME || 'cinelog');
  connection.release(); // devolve a conexão ao pool
});

// Exportamos a versão com Promises (.promise()) para usar async/await nos controllers.
module.exports = pool.promise();
