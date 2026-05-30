/**
 * pages/Login.jsx — Tela de login
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Se veio de rota protegida, volta para lá após login.
  const destino = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await login(email, senha);
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Entrar no CineLog</h1>
        <p className="auth-subtitle">Acesse sua conta para avaliar filmes</p>

        {erro && <div className="alert alert-error">{erro}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            E-mail
            <input
              type="email"
              className="form-input full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              className="form-input full"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="btn-submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>

        <p className="auth-footer">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
