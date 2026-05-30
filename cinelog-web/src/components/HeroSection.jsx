/**
 * components/HeroSection.jsx — Destaque visual estilo streaming/Letterboxd
 *
 * Busca filmes populares da TMDB via GET /filmes/populares.
 * Exibe backdrop grande + poster + sinopse do filme em destaque.
 * Usuário pode trocar destaque clicando nos thumbnails abaixo.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { apiFilmesPopulares } from '../services/api';

function HeroSection() {
  const [destaques, setDestaques] = useState([]);
  const [indice, setIndice] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const data = await apiFilmesPopulares();
        setDestaques(data.resultados || []);
      } catch (e) {
        console.error('Hero:', e.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) {
    return (
      <section className="hero-section hero-loading">
        <div className="hero-skeleton" />
      </section>
    );
  }

  if (destaques.length === 0) return null;

  const filme = destaques[indice];
  const linkDestino = filme.tmdb_id
    ? `/filme/tmdb/${filme.tmdb_id}`
    : `/filme/${filme.id}`;

  return (
    <section className="hero-section">
      {/* Backdrop TMDB — imagem de fundo cinematográfica */}
      <div
        className="hero-backdrop"
        style={{
          backgroundImage: filme.backdrop_url
            ? `url(${filme.backdrop_url})`
            : filme.poster_url
              ? `url(${filme.poster_url})`
              : undefined,
        }}
      />
      <div className="hero-overlay" />

      <div className="hero-inner">
        <div className="hero-poster">
          {filme.poster_url ? (
            <img src={filme.poster_url} alt={`Poster de ${filme.titulo}`} />
          ) : (
            <div className="poster-fallback">🎬</div>
          )}
        </div>

        <div className="hero-text">
          <span className="hero-badge">Em destaque</span>
          <h1>{filme.titulo}</h1>
          {filme.ano && <span className="hero-year">{filme.ano}</span>}
          {filme.nota_tmdb > 0 && (
            <div className="hero-rating">
              <StarRating modo="display" tamanho="sm" nota={Math.round(filme.nota_tmdb / 2)} />
              <span>TMDB {Number(filme.nota_tmdb).toFixed(1)}</span>
            </div>
          )}
          {filme.sinopse && (
            <p className="hero-sinopse">{filme.sinopse.slice(0, 180)}...</p>
          )}
          <div className="hero-cta">
            <Link to={linkDestino} className="btn-submit">
              Ver filme
            </Link>
            <Link to="/buscar" className="btn-outline">
              Buscar mais
            </Link>
          </div>
        </div>
      </div>

      {/* Thumbnails para trocar destaque */}
      <div className="hero-thumbs">
        {destaques.slice(0, 6).map((f, i) => (
          <button
            key={f.tmdb_id || f.id || i}
            type="button"
            className={`hero-thumb ${i === indice ? 'active' : ''}`}
            onClick={() => setIndice(i)}
            aria-label={`Destaque: ${f.titulo}`}
          >
            {f.poster_url ? (
              <img src={f.poster_url} alt="" />
            ) : (
              <span>🎬</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

export default HeroSection;
