/**
 * ============================================================
 * controllers/admin.controller.js — Painel Administrativo
 * ============================================================
 *
 * Todas as funções aqui assumem que authMiddleware + adminMiddleware já rodaram.
 * Usuário comum recebe 403 antes de chegar neste controller.
 */

const db = require('../config/db');

/** GET /admin/dashboard — Estatísticas gerais para o painel. */
async function dashboard(req, res) {
  try {
    const [[filmes]] = await db.query('SELECT COUNT(*) AS total FROM filmes');
    const [[usuarios]] = await db.query('SELECT COUNT(*) AS total FROM usuarios');
    const [[avaliacoes]] = await db.query('SELECT COUNT(*) AS total FROM avaliacoes');

    return res.json({
      total_filmes: filmes.total,
      total_usuarios: usuarios.total,
      total_avaliacoes: avaliacoes.total,
    });
  } catch (erro) {
    console.error('Erro dashboard:', erro);
    return res.status(500).json({ erro: 'Erro ao carregar dashboard.' });
  }
}

/** GET /admin/usuarios — Listar todos os usuários. */
async function listarUsuarios(req, res) {
  try {
    const [usuarios] = await db.query(
      `SELECT id, nome_usuario, email, foto_perfil, tipo, criado_em
       FROM usuarios ORDER BY criado_em DESC`
    );
    return res.json(usuarios);
  } catch (erro) {
    console.error('Erro listarUsuarios:', erro);
    return res.status(500).json({ erro: 'Erro ao listar usuários.' });
  }
}

/** DELETE /admin/usuarios/:id — Remover usuário (não pode excluir a si mesmo). */
async function removerUsuario(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.usuario.id;

    if (parseInt(id, 10) === adminId) {
      return res.status(400).json({ erro: 'Você não pode excluir sua própria conta admin.' });
    }

    const [resultado] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.status(204).send();
  } catch (erro) {
    console.error('Erro removerUsuario:', erro);
    return res.status(500).json({ erro: 'Erro ao excluir usuário.' });
  }
}

/** PATCH /admin/usuarios/:id/tipo — Promover/rebaixar admin. */
async function alterarTipoUsuario(req, res) {
  try {
    const { id } = req.params;
    const { tipo } = req.body;

    if (!['usuario', 'admin'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo deve ser "usuario" ou "admin".' });
    }

    await db.query('UPDATE usuarios SET tipo = ? WHERE id = ?', [tipo, id]);
    const [atualizado] = await db.query(
      'SELECT id, nome_usuario, email, tipo FROM usuarios WHERE id = ?',
      [id]
    );

    return res.json(atualizado[0]);
  } catch (erro) {
    console.error('Erro alterarTipoUsuario:', erro);
    return res.status(500).json({ erro: 'Erro ao alterar tipo do usuário.' });
  }
}

module.exports = {
  dashboard,
  listarUsuarios,
  removerUsuario,
  alterarTipoUsuario,
};
