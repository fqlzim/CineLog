/**
 * components/AdminRoute.jsx — Só administradores acessam
 *
 * Combina ProtectedRoute + verificação tipo === 'admin'.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function AdminRoute({ children }) {
  const { isLoggedIn, isAdmin, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Verificando permissões...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminRoute;
