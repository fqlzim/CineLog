/**
 * pages/admin/GerenciarFilmes.jsx — CRUD de filmes (somente admin)
 */

import { useState, useEffect } from 'react';
import ListaDeFilmes from '../../components/ListaDeFilmes';
import { apiListarFilmes, apiCriarFilme, apiRemoverFilme } from '../../services/api';

function GerenciarFilmes() {
  const [filmes, setFilmes] = useState([]);
  const [form, setForm] = useState({ titulo: '', diretor: '', ano: '', genero: '', sinopse: '' });
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  async function carregar() {
    const data = await apiListarFilmes();
    setFilmes(data);
  }

  useEffect(() => {
    carregar().catch((e) => setErro(e.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setMsg('');
    try {
      await apiCriarFilme(form);
      setForm({ titulo: '', diretor: '', ano: '', genero: '', sinopse: '' });
      setMsg('Filme adicionado com sucesso!');
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remover este filme? Avaliações serão excluídas também.')) return;
    try {
      await apiRemoverFilme(id);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <>
      <h1 className="page-title">Gerenciar Filmes</h1>

      {erro && <div className="alert alert-error">{erro}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}

      <div className="form-card">
        <h2>+ Adicionar filme manualmente</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <input className="form-input full" placeholder="Título" value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          <input className="form-input" placeholder="Diretor" value={form.diretor}
            onChange={(e) => setForm({ ...form, diretor: e.target.value })} />
          <input className="form-input" type="number" placeholder="Ano" value={form.ano}
            onChange={(e) => setForm({ ...form, ano: e.target.value })} />
          <input className="form-input full" placeholder="Gênero" value={form.genero}
            onChange={(e) => setForm({ ...form, genero: e.target.value })} />
          <textarea className="form-input full" placeholder="Sinopse" rows={3} value={form.sinopse}
            onChange={(e) => setForm({ ...form, sinopse: e.target.value })} />
          <button type="submit" className="btn-submit">SALVAR FILME</button>
        </form>
      </div>

      <h2 className="section-title">Filmes no banco ({filmes.length})</h2>
      <ListaDeFilmes filmes={filmes} onRemove={handleRemove} />
    </>
  );
}

export default GerenciarFilmes;
