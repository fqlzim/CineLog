/**
 * pages/admin/Dashboard.jsx — Painel administrativo
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiAdminDashboard } from '../../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const data = await apiAdminDashboard();
        setStats(data);
      } catch (e) {
        setErro(e.message);
      }
    }
    carregar();
  }, []);

  return (
    <>
      <h1 className="page-title">Painel Admin</h1>
      <p className="page-subtitle">Gerenciamento do CineLog</p>

      {erro && <div className="alert alert-error">{erro}</div>}

      {stats && (
        <div className="stats-bar admin-stats">
          <div className="stat">
            <span className="stat-value">{stats.total_filmes}</span>
            <span className="stat-label">Filmes</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.total_usuarios}</span>
            <span className="stat-label">Usuários</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.total_avaliacoes}</span>
            <span className="stat-label">Avaliações</span>
          </div>
        </div>
      )}

      <div className="admin-links">
        <Link to="/admin/filmes" className="admin-link-card">
          <span>🎬</span>
          <h3>Gerenciar Filmes</h3>
          <p>Adicionar, editar e remover filmes do catálogo</p>
        </Link>
        <Link to="/admin/usuarios" className="admin-link-card">
          <span>👥</span>
          <h3>Gerenciar Usuários</h3>
          <p>Ver contas, promover admins ou excluir usuários</p>
        </Link>
      </div>
    </>
  );
}

export default Dashboard;
