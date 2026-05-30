/**
 * pages/EditarPerfil.jsx — Edição de perfil do usuário logado
 *
 * FLUXO COMPLETO (React → Express → MySQL):
 *   1. Usuário altera campos no formulário
 *   2. PUT /auth/profile com JWT no header
 *   3. Backend valida, criptografa senha se necessário, UPDATE no banco
 *   4. Retorna novo JWT + dados atualizados
 *   5. AuthContext.updateProfile salva token e atualiza estado global
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function EditarPerfil() {
  const { usuario, updateProfile, isLoggedIn, carregando } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome_usuario: '',
    email: '',
    foto_perfil: '',
    senha_atual: '',
    senha_nova: '',
    confirmar_senha: '',
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!carregando && !isLoggedIn) {
      navigate('/login');
    }
  }, [carregando, isLoggedIn, navigate]);

  useEffect(() => {
    if (usuario) {
      setForm((prev) => ({
        ...prev,
        nome_usuario: usuario.nome_usuario || '',
        email: usuario.email || '',
        foto_perfil: usuario.foto_perfil || '',
      }));
    }
  }, [usuario]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (form.senha_nova && form.senha_nova !== form.confirmar_senha) {
      setErro('A confirmação da nova senha não confere.');
      return;
    }

    setSalvando(true);
    try {
      const payload = {
        nome_usuario: form.nome_usuario.trim(),
        email: form.email.trim(),
        foto_perfil: form.foto_perfil.trim() || null,
      };

      if (form.senha_nova) {
        payload.senha_atual = form.senha_atual;
        payload.senha_nova = form.senha_nova;
      }

      await updateProfile(payload);
      setSucesso('Perfil atualizado com sucesso!');
      setForm((prev) => ({ ...prev, senha_atual: '', senha_nova: '', confirmar_senha: '' }));
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  if (carregando || !usuario) return <p className="loading-text">Carregando...</p>;

  return (
    <div className="editar-perfil-page">
      <h1 className="page-title">Editar Perfil</h1>
      <p className="page-subtitle">Atualize suas informações de conta</p>

      <div className="editar-perfil-grid">
        {/* Preview da foto — feedback visual imediato */}
        <aside className="perfil-preview-card">
          <div className="avatar xlarge">
            {form.foto_perfil ? (
              <img src={form.foto_perfil} alt="Preview" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <span>{form.nome_usuario.charAt(0).toUpperCase() || '?'}</span>
            )}
          </div>
          <h3>@{form.nome_usuario || 'usuario'}</h3>
          <p className="perfil-preview-email">{form.email}</p>
        </aside>

        <form className="form-card editar-form" onSubmit={handleSubmit}>
          {erro && <div className="alert alert-error">{erro}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}

          <h2>Dados da conta</h2>

          <label>
            Nome de usuário
            <input name="nome_usuario" className="form-input full" value={form.nome_usuario} onChange={handleChange} required />
          </label>

          <label>
            E-mail
            <input name="email" type="email" className="form-input full" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            Foto de perfil (URL)
            <input name="foto_perfil" type="url" className="form-input full" placeholder="https://..." value={form.foto_perfil} onChange={handleChange} />
          </label>

          <h2 className="section-divider">Alterar senha (opcional)</h2>

          <label>
            Senha atual
            <input name="senha_atual" type="password" className="form-input full" value={form.senha_atual} onChange={handleChange} autoComplete="current-password" />
          </label>

          <label>
            Nova senha
            <input name="senha_nova" type="password" className="form-input full" value={form.senha_nova} onChange={handleChange} autoComplete="new-password" />
          </label>

          <label>
            Confirmar nova senha
            <input name="confirmar_senha" type="password" className="form-input full" value={form.confirmar_senha} onChange={handleChange} autoComplete="new-password" />
          </label>

          <button type="submit" className="btn-submit" disabled={salvando}>
            {salvando ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditarPerfil;
