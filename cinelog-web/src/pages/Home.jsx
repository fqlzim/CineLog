/**
 * pages/Home.jsx — Catálogo dinâmico TMDB (estilo streaming/Letterboxd)
 *
 * FONTE UNIFICADA:
 *   Home e Busca usam a mesma TMDB via backend.
 *   GET /filmes/catalogo → 20 filmes/página + paginação
 *   GET /generos → filtros reais TMDB
 *
 * FLUXO:
 *   React fetch → Express → TMDB → JSON com poster_url → FilmeCard renderiza <img>
 */

import { useState, useEffect, useCallback } from 'react';
import HeroSection from '../components/HeroSection';
import ListaDeFilmes from '../components/ListaDeFilmes';
import { apiCatalogo, apiGeneros } from '../services/api';

const TIPOS_CATALOGO = [
  { id: 'popular', label: 'Populares' },
  { id: 'top_rated', label: 'Mais avaliados' },
  { id: 'now_playing', label: 'Em cartaz' },
  { id: 'upcoming', label: 'Lançamentos' },
];

function Home() {
  const [filmes, setFilmes] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [tipoAtivo, setTipoAtivo] = useState('popular');
  const [generoAtivo, setGeneroAtivo] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [fonte, setFonte] = useState('tmdb');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);

  useEffect(() => {
    apiGeneros()
      .then((data) => setGeneros(data.generos || []))
      .catch(() => setGeneros([]));
  }, []);

  const carregarCatalogo = useCallback(async (pagina, append = false) => {
    try {
      if (append) setCarregandoMais(true);
      else setCarregando(true);

      const data = await apiCatalogo({
        tipo: tipoAtivo,
        page: pagina,
        generoId: generoAtivo,
      });

      setFonte(data.fonte || 'tmdb');
      setTotalPages(data.total_pages || 1);
      setTotalResults(data.total_results || data.resultados?.length || 0);
      setPage(data.page || pagina);

      setFilmes((prev) =>
        append ? [...prev, ...(data.resultados || [])] : (data.resultados || [])
      );
      setErro('');
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  }, [tipoAtivo, generoAtivo]);

  useEffect(() => {
    carregarCatalogo(1, false);
  }, [carregarCatalogo]);

  const handleTipo = (tipo) => {
    setGeneroAtivo(null);
    setTipoAtivo(tipo);
    setPage(1);
  };

  const handleGenero = (generoId) => {
    if (generoAtivo === generoId) {
      setGeneroAtivo(null);
    } else {
      setGeneroAtivo(generoId);
      setTipoAtivo('popular');
    }
    setPage(1);
  };

  const handleCarregarMais = () => {
    if (page < totalPages) {
      carregarCatalogo(page + 1, true);
    }
  };

  return (
    <div className="home-page">
      <HeroSection />

      <section className="catalog-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Catálogo CineLog</h2>
            <p className="section-subtitle">
              {totalResults.toLocaleString('pt-BR')} filmes · fonte: {fonte === 'tmdb' ? 'TMDB' : 'banco local'}
            </p>
          </div>
        </div>

        {erro && <div className="alert alert-error">{erro}</div>}

        {/* Abas de tipo (popular, top_rated, etc.) */}
        <div className="catalog-tabs">
          {TIPOS_CATALOGO.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`catalog-tab ${tipoAtivo === t.id && !generoAtivo ? 'active' : ''}`}
              onClick={() => handleTipo(t.id)}
              disabled={Boolean(generoAtivo)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtros por gênero TMDB */}
        {generos.length > 0 && (
          <div className="filter-bar generos-bar">
            <span className="filter-label">Gênero:</span>
            <button
              type="button"
              className={`filter-btn ${!generoAtivo ? 'active' : ''}`}
              onClick={() => setGeneroAtivo(null)}
            >
              Todos
            </button>
            {generos.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`filter-btn ${generoAtivo === g.id ? 'active' : ''}`}
                onClick={() => handleGenero(g.id)}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {carregando ? (
          <div className="catalog-loading">
            <div className="loading-spinner" />
            <p>Carregando catálogo TMDB...</p>
          </div>
        ) : (
          <>
            <ListaDeFilmes
              filmes={filmes}
              linkTmdb
              mensagemVazia="Nenhum filme encontrado nesta categoria."
            />

            {page < totalPages && (
              <div className="load-more-wrap">
                <button
                  type="button"
                  className="btn-outline load-more-btn"
                  onClick={handleCarregarMais}
                  disabled={carregandoMais}
                >
                  {carregandoMais ? 'Carregando...' : `Carregar mais (página ${page + 1} de ${totalPages})`}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default Home;
