/**
 * components/FilmeCard.jsx — Card moderno com poster TMDB real
 *
 * IMAGENS:
 *   filme.poster_url vem da TMDB (w500) via backend.
 *   Se null, usamos gradiente estilizado (não emoji simples).
 */

import { Link } from 'react-router-dom';
import StarRating from './StarRating';

function FilmeCard({ filme, onRemove, linkTmdb = false }) {
  const destino = linkTmdb && filme.tmdb_id
    ? `/filme/tmdb/${filme.tmdb_id}`
    : `/filme/${filme.id}`;

  return (
    <article className="filme-card">
      {onRemove && (
        <button
          className="btn-delete"
          onClick={() => onRemove(filme.id)}
          title="Remover filme"
          type="button"
        >
          ✕
        </button>
      )}

      <Link to={destino} className="filme-card-link">
        <div className="filme-card-poster">
          {filme.poster_url ? (
            <img src={filme.poster_url} alt={`Poster de ${filme.titulo}`} loading="lazy" />
          ) : (
            <div className="poster-fallback">
              <span>{filme.titulo?.charAt(0)}</span>
            </div>
          )}
          <div className="filme-card-overlay">
            {filme.ano && <span className="poster-year">{filme.ano}</span>}
          </div>
        </div>

        <div className="card-body">
          <h3 className="card-titulo" title={filme.titulo}>{filme.titulo}</h3>
          {filme.diretor && (
            <p className="card-diretor" title={filme.diretor}>{filme.diretor}</p>
          )}
          <div className="card-footer">
            {filme.media_cinelog != null ? (
              <StarRating modo="display" tamanho="xs" nota={Math.round(filme.media_cinelog)} />
            ) : filme.nota_tmdb > 0 ? (
              <span className="card-tmdb">★ {Number(filme.nota_tmdb).toFixed(1)}</span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

export default FilmeCard;
