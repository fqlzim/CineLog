/**
 * pages/Cadastro.jsx — Criar nova conta
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Cadastro() {
  const [form, setForm] = useState({
    nome_usuario: '',
    email: '',
    senha: '',
    confirmar: '',
    foto_perfil: '',
  });
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (form.senha !== form.confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }

    if (form.senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setCarregando(true);
    try {
      await register({
        nome_usuario: form.nome_usuario.trim(),
        email: form.email.trim(),
        senha: form.senha,
        foto_perfil: form.foto_perfil.trim() || null,
      });
      navigate('/');
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Criar Conta</h1>
        <p className="auth-subtitle">Junte-se à comunidade CineLog</p>

        {erro && <div className="alert alert-error">{erro}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Nome de usuário
            <input
              name="nome_usuario"
              className="form-input full"
              placeholder="@seuusuario"
              value={form.nome_usuario}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            E-mail
            <input
              name="email"
              type="email"
              className="form-input full"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Senha
            <input
              name="senha"
              type="password"
              className="form-input full"
              value={form.senha}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Confirmar senha
            <input
              name="confirmar"
              type="password"
              className="form-input full"
              value={form.confirmar}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Foto de perfil (URL — opcional)
            <input
              name="foto_perfil"
              type="url"
              className="form-input full"
              placeholder="https://..."
              value={form.foto_perfil}
              onChange={handleChange}
            />
          </label>

          <button type="submit" className="btn-submit" disabled={carregando}>
            {carregando ? 'Criando...' : 'CADASTRAR'}
          </button>
        </form>

        <p className="auth-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

export default Cadastro;
