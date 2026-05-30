/**
 * ============================================================
 * scripts/test-tmdb.js — Diagnóstico da integração TMDB
 * ============================================================
 *
 * Execute: node scripts/test-tmdb.js
 *
 * Testa: conexão, populares, busca, poster, backdrop, detalhes.
 * Não exibe o token completo (segurança).
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const {
  tmdbConfigurada,
  testarConexaoTmdb,
  buscarPopularesNaTmdb,
  buscarFilmesNaTmdb,
  buscarDetalhesFilmeTmdb,
} = require('../services/tmdb.service');

async function main() {
  console.log('\n══════════════════════════════════════');
  console.log('  CINELOG — Teste de integração TMDB');
  console.log('══════════════════════════════════════\n');

  if (!tmdbConfigurada()) {
    console.log('❌ TMDB_API_KEY não encontrada em cinelog-api/.env');
    process.exit(1);
  }

  console.log('✅ TMDB_API_KEY presente no .env');
  console.log('   (credencial carregada via dotenv → process.env)\n');

  try {
    const conexao = await testarConexaoTmdb();
    console.log('1. CONEXÃO TMDB:', conexao.ok ? '✅ OK' : '❌ FALHOU');
    console.log('   Tipo de autenticação:', conexao.tipo_auth);
    console.log('   Filme exemplo:', conexao.filme_exemplo);
    console.log('   Poster na resposta:', conexao.poster_ok ? '✅' : '❌');
    console.log('   Backdrop na resposta:', conexao.backdrop_ok ? '✅' : '❌');

    const populares = await buscarPopularesNaTmdb();
    const p = populares[0];
    console.log('\n2. FILMES POPULARES (Hero Home):', populares.length > 0 ? '✅ OK' : '❌');
    if (p) {
      console.log('   Título:', p.titulo);
      console.log('   Poster URL:', p.poster_url ? '✅' : '❌');
      console.log('   Backdrop URL:', p.backdrop_url ? '✅' : '❌');
    }

    const busca = await buscarFilmesNaTmdb('Matrix');
    const m = busca[0];
    console.log('\n3. BUSCA ("Matrix"):', busca.length > 0 ? '✅ OK' : '❌');
    if (m) {
      console.log('   Resultado:', m.titulo, '| tmdb_id:', m.tmdb_id);
      console.log('   Poster:', m.poster_url ? '✅' : '❌');
    }

    if (m?.tmdb_id) {
      const detalhe = await buscarDetalhesFilmeTmdb(m.tmdb_id);
      console.log('\n4. DETALHE DO FILME:', detalhe.titulo ? '✅ OK' : '❌');
      console.log('   Sinopse:', detalhe.sinopse ? '✅' : '—');
      console.log('   Diretor:', detalhe.diretor || '—');
      console.log('   Backdrop:', detalhe.backdrop_url ? '✅' : '❌');
    }

    console.log('\n══════════════════════════════════════');
    console.log('  TMDB ATIVA — reinicie a API: node server.js');
    console.log('══════════════════════════════════════\n');
  } catch (erro) {
    console.error('\n❌ ERRO:', erro.message);
    process.exit(1);
  }
}

main();
