/**
 * components/ProtectedRoute.jsx — Bloqueia rotas para visitantes
 *
 * Se não estiver logado → redireciona para /login.
 * Guarda a URL original em state para voltar depois do login (opcional).
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isLoggedIn, carregando } = useAuth();
  const location = useLocation();

  // Evita flash de redirect enquanto verifica token salvo.
  if (carregando) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Carregando sessão...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
