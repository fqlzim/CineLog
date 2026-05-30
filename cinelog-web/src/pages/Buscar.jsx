/**
 * pages/Buscar.jsx — Busca dinâmica via TMDB (catálogo automático)
 *
 * Debounce: espera 400ms após parar de digitar para não spammar a API.
 */

import { useState, useEffect } from 'react';
import ListaDeFilmes from '../components/ListaDeFilmes';
import { apiBuscarFilmes } from '../services/api';

function Buscar() {
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState([]);
  const [fonte, setFonte] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (termo.trim().length < 2) {
      setResultados([]);
      setFonte('');
      return;
    }

    const timer = setTimeout(async () => {
      setCarregando(true);
      setErro('');
      try {
        const data = await apiBuscarFilmes(termo.trim());
        setResultados(data.resultados || []);
        setFonte(data.fonte || '');
      } catch (e) {
        setErro(e.message);
        setResultados([]);
      } finally {
        setCarregando(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [termo]);

  return (
    <>
      <h1 className="page-title">Buscar Filmes</h1>
      <p className="page-subtitle">
        Catálogo automático via TMDB — clique em um filme para ver detalhes e avaliar
      </p>

      <div className="search-box">
        <input
          type="search"
          className="search-input"
          placeholder="Digite o nome do filme..."
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          autoFocus
        />
      </div>

      {fonte === 'local' && (
        <div className="alert alert-info">
          TMDB não configurada — buscando apenas no banco local. Adicione TMDB_API_KEY no .env da API.
        </div>
      )}

      {erro && <div className="alert alert-error">{erro}</div>}
      {carregando && <p className="loading-text">Buscando...</p>}

      {!carregando && termo.length >= 2 && (
        <ListaDeFilmes
          filmes={resultados}
          linkTmdb={fonte === 'tmdb'}
          mensagemVazia="Nenhum resultado para esta busca."
        />
      )}
    </>
  );
}

export default Buscar;
