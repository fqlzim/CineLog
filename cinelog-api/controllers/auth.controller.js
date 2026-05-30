/**
 * ============================================================
 * controllers/auth.controller.js — Cadastro, Login e Perfil
 * ============================================================
 *
 * SEGURANÇA DAS SENHAS:
 *   bcrypt.hash(senha, 10) → gera hash (nunca armazenamos senha pura).
 *   bcrypt.compare(senhaDigitada, hashDoBanco) → true/false no login.
 *
 * JWT (JSON Web Token):
 *   Payload: { id, email, nome_usuario, tipo }
 *   Assinado com JWT_SECRET — cliente não pode falsificar sem a chave.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/** Gera token JWT com dados mínimos do usuário. */
function gerarToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      nome_usuario: usuario.nome_usuario,
      tipo: usuario.tipo,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/** Remove campos sensíveis antes de enviar JSON ao front. */
function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nome_usuario: usuario.nome_usuario,
    email: usuario.email,
    foto_perfil: usuario.foto_perfil,
    tipo: usuario.tipo,
    criado_em: usuario.criado_em,
  };
}

/**
 * POST /auth/register — Criar nova conta.
 * Body: { nome_usuario, email, senha, foto_perfil? }
 */
async function registrar(req, res) {
  try {
    const { nome_usuario, email, senha, foto_perfil } = req.body;

    // Validação básica — sempre validar no backend (front pode ser burlado).
    if (!nome_usuario || !email || !senha) {
      return res.status(400).json({ erro: 'Nome de usuário, e-mail e senha são obrigatórios.' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    // Verifica e-mail duplicado antes de inserir.
    const [existentes] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existentes.length > 0) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    const [existentesNome] = await db.query('SELECT id FROM usuarios WHERE nome_usuario = ?', [nome_usuario]);
    if (existentesNome.length > 0) {
      return res.status(409).json({ erro: 'Este nome de usuário já está em uso.' });
    }

    // 10 "rounds" de salt — equilíbrio entre segurança e performance.
    const senha_hash = await bcrypt.hash(senha, 10);

    const [resultado] = await db.query(
      `INSERT INTO usuarios (nome_usuario, email, senha_hash, foto_perfil, tipo)
       VALUES (?, ?, ?, ?, 'usuario')`,
      [nome_usuario.trim(), email.trim().toLowerCase(), senha_hash, foto_perfil || null]
    );

    const novoUsuario = {
      id: resultado.insertId,
      nome_usuario: nome_usuario.trim(),
      email: email.trim().toLowerCase(),
      foto_perfil: foto_perfil || null,
      tipo: 'usuario',
    };

    const token = gerarToken(novoUsuario);

    return res.status(201).json({
      mensagem: 'Conta criada com sucesso!',
      token,
      usuario: novoUsuario,
    });
  } catch (erro) {
    console.error('Erro em registrar:', erro);
    return res.status(500).json({ erro: 'Erro interno ao criar conta.' });
  }
}

/**
 * POST /auth/login — Autenticar usuário existente.
 * Body: { email, senha }
 */
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    // Busca usuário pelo e-mail (único no banco).
    const [linhas] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);

    if (linhas.length === 0) {
      // Mensagem genérica evita revelar se o e-mail existe (segurança).
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const usuario = linhas[0];

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }

    const token = gerarToken(usuario);

    return res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: usuarioPublico(usuario),
    });
  } catch (erro) {
    console.error('Erro em login:', erro);
    return res.status(500).json({ erro: 'Erro interno ao fazer login.' });
  }
}

/**
 * GET /auth/me — Retorna dados do usuário logado (requer JWT).
 * req.usuario vem do authMiddleware.
 */
async function me(req, res) {
  try {
    const [linhas] = await db.query('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);

    if (linhas.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.json({ usuario: usuarioPublico(linhas[0]) });
  } catch (erro) {
    console.error('Erro em me:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar perfil.' });
  }
}

/**
 * POST /auth/logout — Logout "stateless".
 * Com JWT não há sessão no servidor; o front apaga o token do localStorage.
 * Esta rota existe para documentar o fluxo e permitir extensões futuras.
 */
function logout(req, res) {
  return res.json({ mensagem: 'Logout realizado. Remova o token no cliente.' });
}

/**
 * GET /auth/usuario/:id — Perfil público (sem senha).
 */
async function obterUsuarioPublico(req, res) {
  try {
    const { id } = req.params;
    const [linhas] = await db.query(
      'SELECT id, nome_usuario, email, foto_perfil, tipo, criado_em FROM usuarios WHERE id = ?',
      [id]
    );

    if (linhas.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.json({ usuario: usuarioPublico(linhas[0]) });
  } catch (erro) {
    console.error('Erro obterUsuarioPublico:', erro);
    return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
  }
}

/**
 * PUT /auth/profile — Atualizar perfil do usuário logado.
 *
 * FLUXO React → Express → MySQL:
 *   1. Front envia JSON com campos alterados
 *   2. authMiddleware valida JWT → req.usuario.id
 *   3. Validamos duplicatas (email, nome_usuario)
 *   4. Se senha nova → bcrypt.hash antes de salvar
 *   5. UPDATE usuarios SET ... WHERE id = ?
 *   6. Geramos NOVO JWT (email/nome podem ter mudado no payload)
 *   7. Front atualiza token + estado global (AuthContext)
 */
async function atualizarPerfil(req, res) {
  try {
    const usuarioId = req.usuario.id;
    const { nome_usuario, email, senha_atual, senha_nova, foto_perfil } = req.body;

    const [linhas] = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
    if (linhas.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    const usuarioAtual = linhas[0];
    const novoNome = nome_usuario?.trim() || usuarioAtual.nome_usuario;
    const novoEmail = email?.trim().toLowerCase() || usuarioAtual.email;
    const novaFoto = foto_perfil !== undefined ? (foto_perfil || null) : usuarioAtual.foto_perfil;

    if (novoEmail !== usuarioAtual.email) {
      const [emailDup] = await db.query(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [novoEmail, usuarioId]
      );
      if (emailDup.length > 0) {
        return res.status(409).json({ erro: 'Este e-mail já está em uso por outra conta.' });
      }
    }

    if (novoNome !== usuarioAtual.nome_usuario) {
      const [nomeDup] = await db.query(
        'SELECT id FROM usuarios WHERE nome_usuario = ? AND id != ?',
        [novoNome, usuarioId]
      );
      if (nomeDup.length > 0) {
        return res.status(409).json({ erro: 'Este nome de usuário já está em uso.' });
      }
    }

    let novoHash = usuarioAtual.senha_hash;

    if (senha_nova) {
      if (!senha_atual) {
        return res.status(400).json({ erro: 'Informe a senha atual para alterar a senha.' });
      }
      const senhaOk = await bcrypt.compare(senha_atual, usuarioAtual.senha_hash);
      if (!senhaOk) {
        return res.status(401).json({ erro: 'Senha atual incorreta.' });
      }
      if (senha_nova.length < 6) {
        return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres.' });
      }
      novoHash = await bcrypt.hash(senha_nova, 10);
    }

    await db.query(
      `UPDATE usuarios SET nome_usuario = ?, email = ?, senha_hash = ?, foto_perfil = ? WHERE id = ?`,
      [novoNome, novoEmail, novoHash, novaFoto, usuarioId]
    );

    const [atualizado] = await db.query('SELECT * FROM usuarios WHERE id = ?', [usuarioId]);
    const usuarioLimpo = usuarioPublico(atualizado[0]);
    const token = gerarToken(atualizado[0]);

    return res.json({
      mensagem: 'Perfil atualizado com sucesso!',
      token,
      usuario: usuarioLimpo,
    });
  } catch (erro) {
    console.error('Erro atualizarPerfil:', erro);
    return res.status(500).json({ erro: 'Erro ao atualizar perfil.' });
  }
}

module.exports = {
  registrar,
  login,
  me,
  logout,
  obterUsuarioPublico,
  atualizarPerfil,
};
