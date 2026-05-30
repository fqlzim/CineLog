/**
 * ============================================================
 * middleware/auth.js — Proteção de rotas com JWT
 * ============================================================
 *
 * O QUE É MIDDLEWARE?
 *   Função que roda ENTRE a requisição chegar e o controller responder.
 *
 * FLUXO DO LOGIN:
 *   1. Usuário envia email + senha → auth.controller valida → gera JWT
 *   2. Front guarda token no localStorage
 *   3. Próximas requisições enviam: Authorization: Bearer <token>
 *   4. Este middleware decodifica o token e coloca req.usuario = { id, tipo, ... }
 *
 * SE ALTERAR JWT_SECRET no .env sem avisar usuários:
 *   Todos os tokens antigos ficam inválidos (logout forçado).
 */

const jwt = require('jsonwebtoken');

/**
 * authMiddleware — exige que o usuário esteja logado.
 * Rotas que usam: POST /avaliacoes, GET /auth/me, etc.
 */
function authMiddleware(req, res, next) {
  // Header padrão para enviar o token (case-insensitive no Express).
  const authHeader = req.headers.authorization;

  // Sem header ou sem formato "Bearer xxx" → não autenticado.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      erro: 'Acesso negado. Faça login para continuar.',
    });
  }

  // Remove o prefixo "Bearer " e fica só o token JWT.
  const token = authHeader.split(' ')[1];

  try {
    // verify() confere assinatura e expiração; se falhar, lança exceção.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Anexamos dados do usuário na requisição para os controllers usarem.
    req.usuario = {
      id: payload.id,
      email: payload.email,
      nome_usuario: payload.nome_usuario,
      tipo: payload.tipo,
    };

    // next() passa para o próximo middleware ou controller.
    next();
  } catch (erro) {
    return res.status(401).json({
      erro: 'Token inválido ou expirado. Faça login novamente.',
    });
  }
}

module.exports = authMiddleware;
