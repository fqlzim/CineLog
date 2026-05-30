/**
 * pages/Feed.jsx — Feed social: últimas avaliações de todos os usuários
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { apiFeedAvaliacoes } from '../services/api';

function formatarData(dataStr) {
  return new Date(dataStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function Feed() {
  const [feed, setFeed] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const data = await apiFeedAvaliacoes();
        setFeed(data);
      } catch (e) {
        console.error(e);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) return <p className="loading-text">Carregando feed...</p>;

  return (
    <>
      <h1 className="page-title">Feed da Comunidade</h1>
      <p className="page-subtitle">Avaliações recentes — estilo rede social Letterboxd</p>

      {feed.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">💬</span>
          <p>Nenhuma avaliação ainda. Seja o primeiro a avaliar um filme!</p>
        </div>
      ) : (
        <div className="feed-list">
          {feed.map((item) => (
            <article key={item.id} className="feed-item">
              <div className="feed-poster">
                {item.poster_url ? (
                  <img src={item.poster_url} alt="" />
                ) : (
                  <div className="poster-placeholder mini">🎬</div>
                )}
              </div>
              <div className="feed-content">
                <p className="feed-meta">
                  <Link to={`/perfil/${item.usuario_id}`} className="feed-user">
                    @{item.nome_usuario}
                  </Link>
                  {' avaliou '}
                  <Link to={`/filme/${item.filme_id}`} className="feed-filme">
                    {item.titulo}
                  </Link>
                </p>
                <StarRating modo="display" tamanho="sm" nota={item.nota} />
                {item.comentario && <p className="feed-comment">{item.comentario}</p>}
                <time className="feed-date">{formatarData(item.criado_em)}</time>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export default Feed;
