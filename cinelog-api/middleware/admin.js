/**
 * ============================================================
 * middleware/admin.js — Só administradores passam
 * ============================================================
 *
 * DEVE ser usado DEPOIS de authMiddleware:
 *   router.delete('/filmes/:id', authMiddleware, adminMiddleware, controller);
 *
 * POR QUÊ?
 *   authMiddleware garante que há um usuário logado.
 *   adminMiddleware garante que esse usuário tem tipo === 'admin'.
 *
 * Se um usuário comum tentar acessar rota admin → HTTP 403 Forbidden.
 */

function adminMiddleware(req, res, next) {
  // req.usuario foi definido pelo authMiddleware.
  if (!req.usuario || req.usuario.tipo !== 'admin') {
    return res.status(403).json({
      erro: 'Acesso restrito a administradores.',
    });
  }
  next();
}

module.exports = adminMiddleware;
