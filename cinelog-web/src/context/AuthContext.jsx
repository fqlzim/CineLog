/**
 * ============================================================
 * context/AuthContext.jsx — Estado global de autenticação
 * ============================================================
 *
 * O QUE É CONTEXT API?
 *   Permite compartilhar dados (usuário logado) entre componentes
 *   sem passar props manualmente em cada nível da árvore React.
 *
 * FLUXO:
 *   1. App envolve tudo com <AuthProvider>
 *   2. Login chama login() → salva token + setUsuario
 *   3. Header, rotas protegidas usam useAuth() para ler usuario
 *   4. Logout limpa token e usuario
 */

import { createContext, useState, useEffect, useCallback } from 'react';
import {
  getToken,
  setToken,
  removeToken,
  apiLogin,
  apiRegister,
  apiMe,
  apiAtualizarPerfil,
} from '../services/api';

// Contexto vazio — será preenchido pelo Provider.
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // usuario: null = não logado | objeto = dados do perfil.
  const [usuario, setUsuario] = useState(null);

  // carregando: true enquanto verificamos token salvo ao abrir o site.
  const [carregando, setCarregando] = useState(true);

  /**
   * Ao montar o app, se existir token no localStorage,
   * validamos chamando GET /auth/me.
   */
  useEffect(() => {
    async function restaurarSessao() {
      const token = getToken();
      if (!token) {
        setCarregando(false);
        return;
      }

      try {
        const { usuario: dados } = await apiMe();
        setUsuario(dados);
      } catch {
        // Token inválido/expirado — remove e trata como deslogado.
        removeToken();
      } finally {
        setCarregando(false);
      }
    }

    restaurarSessao();
  }, []);

  /** Login: API retorna token + usuario → persistimos ambos. */
  const login = useCallback(async (email, senha) => {
    const data = await apiLogin(email, senha);
    setToken(data.token);
    setUsuario(data.usuario);
    return data;
  }, []);

  /** Cadastro: mesmo fluxo do login após criar conta. */
  const register = useCallback(async (dados) => {
    const data = await apiRegister(dados);
    setToken(data.token);
    setUsuario(data.usuario);
    return data;
  }, []);

  /** Logout: apaga token local — JWT no servidor não precisa ser invalidado. */
  const logout = useCallback(() => {
    removeToken();
    setUsuario(null);
  }, []);

  /**
   * updateProfile — PUT /auth/profile
   * Se email/nome mudarem, o backend emite NOVO JWT.
   * Substituímos token antigo para manter sessão válida.
   */
  const updateProfile = useCallback(async (dados) => {
    const data = await apiAtualizarPerfil(dados);
    setToken(data.token);
    setUsuario(data.usuario);
    return data;
  }, []);

  const valor = {
    usuario,
    carregando,
    login,
    register,
    logout,
    updateProfile,
    isAdmin: usuario?.tipo === 'admin',
    isLoggedIn: Boolean(usuario),
  };

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}
