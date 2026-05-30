/**
 * pages/admin/GerenciarUsuarios.jsx — Gerenciar contas (somente admin)
 */

import { useState, useEffect } from 'react';
import { apiAdminUsuarios, apiAdminRemoverUsuario, apiAdminAlterarTipo } from '../../services/api';

function GerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [erro, setErro] = useState('');

  async function carregar() {
    const data = await apiAdminUsuarios();
    setUsuarios(data);
  }

  useEffect(() => {
    carregar().catch((e) => setErro(e.message));
  }, []);

  const handleRemover = async (id) => {
    if (!window.confirm('Excluir este usuário?')) return;
    try {
      await apiAdminRemoverUsuario(id);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  const handleToggleAdmin = async (usuario) => {
    const novoTipo = usuario.tipo === 'admin' ? 'usuario' : 'admin';
    try {
      await apiAdminAlterarTipo(usuario.id, novoTipo);
      await carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <>
      <h1 className="page-title">Gerenciar Usuários</h1>
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuário</th>
              <th>E-mail</th>
              <th>Tipo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>@{u.nome_usuario}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.tipo}`}>{u.tipo}</span>
                </td>
                <td className="admin-actions">
                  <button type="button" className="btn-text" onClick={() => handleToggleAdmin(u)}>
                    {u.tipo === 'admin' ? 'Rebaixar' : 'Promover admin'}
                  </button>
                  <button type="button" className="btn-text danger" onClick={() => handleRemover(u.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default GerenciarUsuarios;
