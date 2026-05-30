/**
 * pages/Perfil.jsx — Perfil público do usuário + suas avaliações
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StarRating from '../components/StarRating';
import { useAuth } from '../hooks/useAuth';
import { apiAvaliacoesUsuario, apiObterUsuario } from '../services/api';

function Perfil() {
  const { id } = useParams();
  const { usuario: usuarioLogado } = useAuth();
  const [usuario, setUsuario] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const ehMeuPerfil = usuarioLogado && String(usuarioLogado.id) === id;

  useEffect(() => {
    async function carregar() {
      try {
        const [dadosUsuario, dataAvals] = await Promise.all([
          apiObterUsuario(id),
          apiAvaliacoesUsuario(id),
        ]);
        setUsuario(dadosUsuario.usuario);
        setAvaliacoes(dataAvals);
      } catch (e) {
        setErro(e.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [id]);

  if (carregando) return <p className="loading-text">Carregando perfil...</p>;
  if (erro) return <div className="alert alert-error">{erro}</div>;

  return (
    <>
      <div className="perfil-header">
        <div className="avatar large">
          {usuario.foto_perfil ? (
            <img src={usuario.foto_perfil} alt="" />
          ) : (
            <span>{usuario.nome_usuario.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className="page-title">@{usuario.nome_usuario}</h1>
          <p className="page-subtitle">
            {avaliacoes.length} avaliações · membro desde {new Date(usuario.criado_em).getFullYear()}
          </p>
          {ehMeuPerfil && (
            <Link to="/perfil/editar" className="btn-sm perfil-edit-link">
              Editar perfil
            </Link>
          )}
        </div>
      </div>

      {avaliacoes.length === 0 ? (
        <div className="empty-state">
          <p>Este usuário ainda não avaliou nenhum filme.</p>
        </div>
      ) : (
        <div className="perfil-reviews">
          {avaliacoes.map((av) => (
            <article key={av.id} className="perfil-review-item">
              <Link to={`/filme/${av.filme_id}`} className="perfil-poster">
                {av.poster_url ? (
                  <img src={av.poster_url} alt={av.titulo} />
                ) : (
                  <div className="poster-fallback mini">🎬</div>
                )}
              </Link>
              <div>
                <Link to={`/filme/${av.filme_id}`} className="perfil-filme-titulo">
                  {av.titulo}
                </Link>
                {av.ano && <span className="muted"> ({av.ano})</span>}
                <StarRating modo="display" tamanho="sm" nota={av.nota} />
                {av.comentario && <p>{av.comentario}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

export default Perfil;
