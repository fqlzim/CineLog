/**
 * components/ReviewCard.jsx — Card de uma avaliação na rede social
 *
 * Exibe: avatar, nome do usuário, estrelas, comentário, data.
 * Se for a avaliação do usuário logado, mostra botões editar/excluir.
 */

import { Link } from 'react-router-dom';
import StarRating from './StarRating';

function formatarData(dataStr) {
  if (!dataStr) return '';
  return new Date(dataStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function ReviewCard({ avaliacao, usuarioLogadoId, onEditar, onExcluir }) {
  const ehMinha = usuarioLogadoId && avaliacao.usuario_id === usuarioLogadoId;

  return (
    <article className="review-card">
      <div className="review-header">
        <Link to={`/perfil/${avaliacao.usuario_id}`} className="review-user">
          <div className="avatar">
            {avaliacao.foto_perfil ? (
              <img src={avaliacao.foto_perfil} alt="" />
            ) : (
              <span>{avaliacao.nome_usuario?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <strong>@{avaliacao.nome_usuario}</strong>
            <time className="review-date">{formatarData(avaliacao.criado_em)}</time>
          </div>
        </Link>
        <StarRating modo="display" tamanho="sm" nota={avaliacao.nota} />
      </div>

      {avaliacao.comentario && (
        <p className="review-text">{avaliacao.comentario}</p>
      )}

      {ehMinha && (
        <div className="review-actions">
          <button type="button" className="btn-text" onClick={() => onEditar?.(avaliacao)}>
            Editar
          </button>
          <button type="button" className="btn-text danger" onClick={() => onExcluir?.(avaliacao.id)}>
            Excluir
          </button>
        </div>
      )}
    </article>
  );
}

export default ReviewCard;
