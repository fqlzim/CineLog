/**
 * ============================================================
 * controllers/avaliacoes.controller.js — Reviews estilo Letterboxd
 * ============================================================
 *
 * REGRA DE NEGÓCIO:
 *   Cada usuário pode ter NO MÁXIMO 1 avaliação por filme (UNIQUE no banco).
 *   Se tentar avaliar de novo → atualizamos (PUT) em vez de duplicar.
 *
 * REDE SOCIAL:
 *   GET /avaliacoes/filme/:filmeId lista TODAS as reviews — visíveis para todos logados.
 */

const db = require('../config/db');

/** GET /avaliacoes/filme/:filmeId — Todas as avaliações de um filme. */
async function listarPorFilme(req, res) {
  try {
    const { filmeId } = req.params;

    const [avaliacoes] = await db.query(
      `SELECT a.id, a.nota, a.comentario, a.criado_em, a.atualizado_em,
              u.id AS usuario_id, u.nome_usuario, u.foto_perfil
       FROM avaliacoes a
       INNER JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.filme_id = ?
       ORDER BY a.criado_em DESC`,
      [filmeId]
    );

    return res.json(avaliacoes);
  } catch (erro) {
    console.error('Erro listarPorFilme:', erro);
    return res.status(500).json({ erro: 'Erro ao listar avaliações.' });
  }
}

/** GET /avaliacoes/usuario/:usuarioId — Avaliações de um perfil. */
async function listarPorUsuario(req, res) {
  try {
    const { usuarioId } = req.params;

    const [avaliacoes] = await db.query(
      `SELECT a.id, a.nota, a.comentario, a.criado_em,
              f.id AS filme_id, f.titulo, f.poster_url, f.ano
       FROM avaliacoes a
       INNER JOIN filmes f ON f.id = a.filme_id
       WHERE a.usuario_id = ?
       ORDER BY a.criado_em DESC`,
      [usuarioId]
    );

    return res.json(avaliacoes);
  } catch (erro) {
    console.error('Erro listarPorUsuario:', erro);
    return res.status(500).json({ erro: 'Erro ao listar avaliações do usuário.' });
  }
}

/** GET /avaliacoes/minha/:filmeId — Avaliação do usuário logado neste filme (se existir). */
async function minhaAvaliacaoNoFilme(req, res) {
  try {
    const { filmeId } = req.params;
    const usuarioId = req.usuario.id;

    const [linhas] = await db.query(
      'SELECT * FROM avaliacoes WHERE usuario_id = ? AND filme_id = ?',
      [usuarioId, filmeId]
    );

    if (linhas.length === 0) {
      return res.json({ avaliacao: null });
    }

    return res.json({ avaliacao: linhas[0] });
  } catch (erro) {
    console.error('Erro minhaAvaliacaoNoFilme:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar sua avaliação.' });
  }
}

/** POST /avaliacoes — Criar avaliação (usuário logado). */
async function criar(req, res) {
  try {
    const { filme_id, nota, comentario } = req.body;
    const usuarioId = req.usuario.id;

    if (!filme_id || !nota) {
      return res.status(400).json({ erro: 'filme_id e nota são obrigatórios.' });
    }

    const notaNum = parseInt(nota, 10);
    if (notaNum < 1 || notaNum > 5) {
      return res.status(400).json({ erro: 'A nota deve ser entre 1 e 5 estrelas.' });
    }

    // Confirma que o filme existe.
    const [filmes] = await db.query('SELECT id FROM filmes WHERE id = ?', [filme_id]);
    if (filmes.length === 0) {
      return res.status(404).json({ erro: 'Filme não encontrado.' });
    }

    // Verifica duplicata (usuário já avaliou este filme).
    const [existentes] = await db.query(
      'SELECT id FROM avaliacoes WHERE usuario_id = ? AND filme_id = ?',
      [usuarioId, filme_id]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        erro: 'Você já avaliou este filme. Use PUT para editar.',
        avaliacao_id: existentes[0].id,
      });
    }

    const [resultado] = await db.query(
      'INSERT INTO avaliacoes (usuario_id, filme_id, nota, comentario) VALUES (?, ?, ?, ?)',
      [usuarioId, filme_id, notaNum, comentario || null]
    );

    const [nova] = await db.query('SELECT * FROM avaliacoes WHERE id = ?', [resultado.insertId]);
    return res.status(201).json(nova[0]);
  } catch (erro) {
    console.error('Erro criar avaliação:', erro);
    return res.status(500).json({ erro: 'Erro ao criar avaliação.' });
  }
}

/** PUT /avaliacoes/:id — Editar própria avaliação. */
async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { nota, comentario } = req.body;
    const usuarioId = req.usuario.id;

    const [linhas] = await db.query('SELECT * FROM avaliacoes WHERE id = ?', [id]);
    if (linhas.length === 0) {
      return res.status(404).json({ erro: 'Avaliação não encontrada.' });
    }

    // Só o autor pode editar (ou admin — tratado em rota separada se necessário).
    if (linhas[0].usuario_id !== usuarioId) {
      return res.status(403).json({ erro: 'Você só pode editar suas próprias avaliações.' });
    }

    const notaNum = nota !== undefined ? parseInt(nota, 10) : linhas[0].nota;
    if (notaNum < 1 || notaNum > 5) {
      return res.status(400).json({ erro: 'A nota deve ser entre 1 e 5.' });
    }

    await db.query(
      'UPDATE avaliacoes SET nota = ?, comentario = ? WHERE id = ?',
      [notaNum, comentario !== undefined ? comentario : linhas[0].comentario, id]
    );

    const [atualizada] = await db.query('SELECT * FROM avaliacoes WHERE id = ?', [id]);
    return res.json(atualizada[0]);
  } catch (erro) {
    console.error('Erro atualizar avaliação:', erro);
    return res.status(500).json({ erro: 'Erro ao atualizar avaliação.' });
  }
}

/** DELETE /avaliacoes/:id — Excluir própria avaliação. */
async function remover(req, res) {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const [linhas] = await db.query('SELECT * FROM avaliacoes WHERE id = ?', [id]);
    if (linhas.length === 0) {
      return res.status(404).json({ erro: 'Avaliação não encontrada.' });
    }

    if (linhas[0].usuario_id !== usuarioId && req.usuario.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Sem permissão para excluir esta avaliação.' });
    }

    await db.query('DELETE FROM avaliacoes WHERE id = ?', [id]);
    return res.status(204).send();
  } catch (erro) {
    console.error('Erro remover avaliação:', erro);
    return res.status(500).json({ erro: 'Erro ao excluir avaliação.' });
  }
}

/** GET /avaliacoes/feed — Feed social: últimas avaliações de todos os usuários. */
async function feed(req, res) {
  try {
    const [avaliacoes] = await db.query(
      `SELECT a.id, a.nota, a.comentario, a.criado_em,
              u.id AS usuario_id, u.nome_usuario, u.foto_perfil,
              f.id AS filme_id, f.titulo, f.poster_url
       FROM avaliacoes a
       INNER JOIN usuarios u ON u.id = a.usuario_id
       INNER JOIN filmes f ON f.id = a.filme_id
       ORDER BY a.criado_em DESC
       LIMIT 50`
    );

    return res.json(avaliacoes);
  } catch (erro) {
    console.error('Erro feed:', erro);
    return res.status(500).json({ erro: 'Erro ao carregar feed.' });
  }
}

module.exports = {
  listarPorFilme,
  listarPorUsuario,
  minhaAvaliacaoNoFilme,
  criar,
  atualizar,
  remover,
  feed,
};
