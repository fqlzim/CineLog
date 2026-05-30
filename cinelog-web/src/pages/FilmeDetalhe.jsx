/**
 * pages/FilmeDetalhe.jsx — Página cinematográfica completa (Letterboxd + TMDB)
 *
 * DADOS TMDB (GET /filmes/tmdb/:id ou /filmes/:id com tmdb_id):
 *   elenco_lista  → cast (atores + personagens + fotos)
 *   equipe        → crew (direção, roteiro, música...)
 *   detalhes      → duração, orçamento, votos, status...
 *   paises        → production_countries
 *   generos       → badges
 *   trailer       → videos TMDB → link YouTube (key)
 *
 * AVALIAÇÃO:
 *   StarRating modo="input" + bloqueio visitante (GuestPrompt)
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import ReviewCard from '../components/ReviewCard';
import { useAuth } from '../hooks/useAuth';
import { useGuestPrompt } from '../context/GuestPromptContext';
import {
  apiObterFilme,
  apiObterFilmeTmdb,
  apiAvaliacoesFilme,
  apiMinhaAvaliacao,
  apiCriarAvaliacao,
  apiAtualizarAvaliacao,
  apiRemoverAvaliacao,
} from '../services/api';

function formatarNumero(n) {
  if (n == null) return null;
  return new Intl.NumberFormat('pt-BR').format(n);
}

function FilmeDetalhe() {
  const { id, tmdbId } = useParams();
  const { usuario, isLoggedIn } = useAuth();
  const { showGuestModal } = useGuestPrompt();

  const [filme, setFilme] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [minhaAvaliacao, setMinhaAvaliacao] = useState(null);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [modoEdicao, setModoEdicao] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);

  async function carregarDados(filmeId) {
    const [avals, minha] = await Promise.all([
      apiAvaliacoesFilme(filmeId),
      isLoggedIn ? apiMinhaAvaliacao(filmeId) : Promise.resolve({ avaliacao: null }),
    ]);
    setAvaliacoes(avals);
    setMinhaAvaliacao(minha.avaliacao);
    if (minha.avaliacao) {
      setNota(minha.avaliacao.nota);
      setComentario(minha.avaliacao.comentario || '');
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const dadosFilme = tmdbId
          ? await apiObterFilmeTmdb(tmdbId)
          : await apiObterFilme(id);
        setFilme(dadosFilme);
        if (dadosFilme.id) await carregarDados(dadosFilme.id);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    init();
  }, [id, tmdbId, isLoggedIn]);

  const handleNotaChange = (valor) => {
    if (!isLoggedIn) {
      showGuestModal('Para avaliar filmes e escrever reviews, crie uma conta ou faça login no CineLog.');
      return;
    }
    setNota(valor);
  };

  const handleSalvarAvaliacao = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      showGuestModal();
      return;
    }
    if (nota < 1) {
      setErro('Selecione uma nota de 1 a 5 estrelas.');
      return;
    }

    setErro('');
    try {
      if (minhaAvaliacao && modoEdicao) {
        await apiAtualizarAvaliacao(minhaAvaliacao.id, { nota, comentario });
      } else if (!minhaAvaliacao) {
        await apiCriarAvaliacao({ filme_id: filme.id, nota, comentario });
      }
      setModoEdicao(false);
      await carregarDados(filme.id);
      setFilme(await apiObterFilme(filme.id));
    } catch (err) {
      setErro(err.message);
    }
  };

  const handleEditar = (av) => {
    if (!isLoggedIn) { showGuestModal(); return; }
    setModoEdicao(true);
    setNota(av.nota);
    setComentario(av.comentario || '');
    document.getElementById('avaliar')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExcluir = async (avaliacaoId) => {
    if (!window.confirm('Excluir sua avaliação?')) return;
    try {
      await apiRemoverAvaliacao(avaliacaoId);
      setMinhaAvaliacao(null);
      setNota(0);
      setComentario('');
      await carregarDados(filme.id);
      setFilme(await apiObterFilme(filme.id));
    } catch (err) {
      setErro(err.message);
    }
  };

  if (carregando) return <p className="loading-text">Carregando filme...</p>;
  if (erro && !filme) return <div className="alert alert-error">{erro}</div>;
  if (!filme) return null;

  const bgImage = filme.backdrop_url || filme.poster_url;
  const generosLista = filme.generos?.length
    ? filme.generos
    : (filme.genero || '').split(',').filter(Boolean).map((nome, i) => ({
        id: i,
        nome: nome.trim(),
      }));
  const paises = filme.paises || [];
  const elenco = filme.elenco_lista || [];
  const equipe = filme.equipe || [];
  const det = filme.detalhes || {};
  const trailer = filme.trailer;

  return (
    <div className="filme-detalhe-page">
      <div
        className="filme-banner"
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
      >
        <div className="filme-banner-overlay" />
        <div className="filme-banner-content">
          <div className="filme-poster-lg">
            {filme.poster_url ? (
              <img src={filme.poster_url} alt={filme.titulo} />
            ) : (
              <div className="poster-fallback large">🎬</div>
            )}
          </div>
          <div className="filme-info">
            <h1>{filme.titulo}</h1>
            {det.tagline && <p className="filme-tagline">{det.tagline}</p>}
            {filme.diretor && <p className="filme-diretor">Dir. {filme.diretor}</p>}
            <div className="filme-meta">
              {filme.ano && <span className="meta-tag">{filme.ano}</span>}
              {det.duracao_formatada && (
                <span className="meta-tag">{det.duracao_formatada}</span>
              )}
            </div>
            {generosLista.length > 0 && (
              <div className="genero-badges">
                {generosLista.map((g) => (
                  <span key={g.id ?? g.nome} className="genero-badge">
                    {g.nome}
                  </span>
                ))}
              </div>
            )}
            <div className="filme-notas">
              {filme.media_cinelog != null && (
                <div className="nota-box">
                  <span className="nota-label">CineLog</span>
                  <StarRating modo="display" tamanho="sm" nota={Math.round(filme.media_cinelog)} />
                  <span>{filme.media_cinelog} · {filme.total_avaliacoes} reviews</span>
                </div>
              )}
              {filme.nota_tmdb > 0 && (
                <div className="nota-box tmdb">
                  <span className="nota-label">TMDB</span>
                  <span className="tmdb-score">{Number(filme.nota_tmdb).toFixed(1)}</span>
                  <span>/10 · {formatarNumero(det.total_votos)} votos</span>
                </div>
              )}
            </div>
            {trailer?.youtube_url && (
              <a
                href={trailer.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-trailer-hero"
              >
                ▶ Assistir trailer
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="filme-body filme-body--wide">
        {filme.sinopse && (
          <section className="filme-sinopse-section">
            <h2 className="section-heading">Sinopse</h2>
            <p>{filme.sinopse}</p>
          </section>
        )}

        {/* Trailer */}
        <section className="filme-section trailer-section">
          <h2 className="section-heading">Assistir trailer</h2>
          {trailer?.youtube_url ? (
            <a
              href={trailer.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-trailer-youtube"
            >
              <span className="trailer-yt-icon" aria-hidden="true">▶</span>
              <span>
                <strong>{trailer.nome || 'Trailer oficial'}</strong>
                <small>
                  Abrir no {trailer.site || 'YouTube'}
                  {trailer.oficial ? ' · Oficial' : ''}
                  {trailer.idioma ? ` · ${trailer.idioma}` : ''}
                </small>
              </span>
            </a>
          ) : (
            <p className="trailer-indisponivel">
              Trailer indisponível para este filme.
            </p>
          )}
        </section>

        {/* Detalhes */}
        {(det.duracao_formatada || det.data_lancamento || det.status) && (
          <section className="filme-section">
            <h2 className="section-heading">Detalhes</h2>
            <dl className="detalhes-grid">
              {det.duracao_formatada && (
                <>
                  <dt>Duração</dt>
                  <dd>{det.duracao_formatada}</dd>
                </>
              )}
              {det.data_lancamento && (
                <>
                  <dt>Lançamento</dt>
                  <dd>{new Date(det.data_lancamento + 'T12:00:00').toLocaleDateString('pt-BR')}</dd>
                </>
              )}
              {det.idioma_original && (
                <>
                  <dt>Idioma original</dt>
                  <dd>{det.idioma_original}</dd>
                </>
              )}
              {det.status && (
                <>
                  <dt>Status</dt>
                  <dd>{det.status}</dd>
                </>
              )}
              {det.nota_tmdb != null && (
                <>
                  <dt>Nota TMDB</dt>
                  <dd>{Number(det.nota_tmdb).toFixed(1)} / 10</dd>
                </>
              )}
              {det.total_votos != null && (
                <>
                  <dt>Votos TMDB</dt>
                  <dd>{formatarNumero(det.total_votos)}</dd>
                </>
              )}
              {det.popularidade != null && (
                <>
                  <dt>Popularidade</dt>
                  <dd>{Number(det.popularidade).toFixed(1)}</dd>
                </>
              )}
              {det.orcamento_formatado && (
                <>
                  <dt>Orçamento</dt>
                  <dd>{det.orcamento_formatado}</dd>
                </>
              )}
              {det.receita_formatada && (
                <>
                  <dt>Bilheteria</dt>
                  <dd>{det.receita_formatada}</dd>
                </>
              )}
            </dl>
          </section>
        )}

        {/* Países */}
        {paises.length > 0 && (
          <section className="filme-section">
            <h2 className="section-heading">Países de produção</h2>
            <div className="pais-badges">
              {paises.map((p) => (
                <span key={p.codigo} className="pais-badge">{p.nome}</span>
              ))}
            </div>
          </section>
        )}

        {/* Elenco */}
        {elenco.length > 0 && (
          <section className="filme-section">
            <h2 className="section-heading">Elenco principal</h2>
            <p className="section-hint">
              Cast — atores e personagens (TMDB /movie/credits)
            </p>
            <div className="elenco-grid">
              {elenco.map((ator) => (
                <article key={ator.id} className="elenco-card">
                  <div className="elenco-foto">
                    {ator.foto_url ? (
                      <img src={ator.foto_url} alt={ator.nome} loading="lazy" />
                    ) : (
                      <span className="elenco-foto-fallback" aria-hidden="true">👤</span>
                    )}
                  </div>
                  <div className="elenco-info">
                    <h3>{ator.nome}</h3>
                    <p>{ator.personagem}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Equipe */}
        {equipe.length > 0 && (
          <section className="filme-section">
            <h2 className="section-heading">Equipe técnica</h2>
            <p className="section-hint">
              Crew — direção, roteiro, produção e mais (TMDB credits.crew)
            </p>
            <ul className="equipe-lista">
              {equipe.map((membro, idx) => (
                <li key={`${membro.nome}-${membro.cargo}-${idx}`}>
                  <span className="equipe-cargo">{membro.cargo}</span>
                  <span className="equipe-nome">{membro.nome}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Fallback elenco texto (filmes só locais sem TMDB completo) */}
        {elenco.length === 0 && filme.elenco && (
          <p className="filme-elenco"><strong>Elenco:</strong> {filme.elenco}</p>
        )}

        <section id="avaliar" className="avaliar-section">
          <h2 className="section-heading">Sua avaliação</h2>

          {!isLoggedIn ? (
            <div className="guest-avaliar-cta">
              <p>Faça parte da comunidade CineLog — avalie e comente este filme.</p>
              <div className="guest-avaliar-actions">
                <button
                  type="button"
                  className="btn-submit"
                  onClick={() => showGuestModal('Para avaliar e comentar, crie sua conta no CineLog!')}
                >
                  Quero avaliar
                </button>
                <Link to="/login" className="btn-outline">Já tenho conta</Link>
              </div>
            </div>
          ) : minhaAvaliacao && !modoEdicao ? (
            <div className="minha-avaliacao-resumo">
              <StarRating modo="display" tamanho="sm" nota={minhaAvaliacao.nota} />
              {minhaAvaliacao.comentario && <p>{minhaAvaliacao.comentario}</p>}
              <button type="button" className="btn-text" onClick={() => handleEditar(minhaAvaliacao)}>
                Editar avaliação
              </button>
            </div>
          ) : (
            <form onSubmit={handleSalvarAvaliacao} className="avaliar-form avaliar-form--premium">
              {erro && <div className="alert alert-error">{erro}</div>}
              <StarRating
                modo="input"
                tamanho="xl"
                nota={nota}
                onChange={handleNotaChange}
              />
              <textarea
                className="form-input full review-textarea"
                placeholder="Escreva sua review (opcional)..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={4}
              />
              <button type="submit" className="btn-submit">
                {modoEdicao ? 'SALVAR ALTERAÇÕES' : 'PUBLICAR AVALIAÇÃO'}
              </button>
            </form>
          )}
        </section>

        <section className="reviews-section">
          <h2 className="section-heading">
            Avaliações da comunidade ({avaliacoes.length})
          </h2>
          {avaliacoes.length === 0 ? (
            <p className="muted">Nenhuma avaliação ainda. Seja o primeiro!</p>
          ) : (
            <div className="reviews-list">
              {avaliacoes.map((av) => (
                <ReviewCard
                  key={av.id}
                  avaliacao={av}
                  usuarioLogadoId={usuario?.id}
                  onEditar={handleEditar}
                  onExcluir={handleExcluir}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default FilmeDetalhe;
