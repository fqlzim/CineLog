/**
 * components/ListaDeFilmes.jsx — Grid responsivo de FilmeCard
 */

import FilmeCard from './FilmeCard';

function ListaDeFilmes({ filmes, onRemove, linkTmdb = false, mensagemVazia }) {
  if (filmes.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🎬</span>
        <p>{mensagemVazia || 'Nenhum filme encontrado.'}</p>
      </div>
    );
  }

  return (
    <div className="filmes-grid">
      {filmes.map((filme) => (
        <FilmeCard
          key={filme.id || filme.tmdb_id}
          filme={filme}
          onRemove={onRemove}
          linkTmdb={linkTmdb}
        />
      ))}
    </div>
  );
}

export default ListaDeFilmes;
