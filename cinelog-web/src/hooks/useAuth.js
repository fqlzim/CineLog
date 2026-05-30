/**
 * hooks/useAuth.js — Atalho para consumir AuthContext
 *
 * Em vez de: useContext(AuthContext) em todo lugar,
 * usamos: const { usuario, login } = useAuth();
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }

  return contexto;
}
