/**
 * context/GuestPromptContext.jsx — Modal para visitantes
 *
 * BUG CORRIGIDO (v2.2):
 *   O modal usava <Link> do react-router FORA do <Router>.
 *   Isso quebrava a renderização e o popup não aparecia.
 *
 * SOLUÇÃO:
 *   1. GuestPromptProvider agora fica DENTRO do Router (App.jsx)
 *   2. Modal usa createPortal → document.body (sempre visível, z-index alto)
 *   3. Botões usam useNavigate() para redirecionar
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

export const GuestPromptContext = createContext(null);

function GuestModal({ aberto, motivo, onFechar }) {
  const navigate = useNavigate();

  if (!aberto) return null;

  const irPara = (rota) => {
    onFechar();
    navigate(rota);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onFechar} role="presentation">
      <div
        className="modal-card guest-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-modal-title"
      >
        <button type="button" className="modal-close" onClick={onFechar} aria-label="Fechar">
          ✕
        </button>
        <div className="guest-modal-icon">🎬</div>
        <h2 id="guest-modal-title">Participe do CineLog</h2>
        <p>{motivo}</p>
        <div className="guest-modal-actions">
          <button type="button" className="btn-submit" onClick={() => irPara('/login')}>
            Entrar
          </button>
          <button type="button" className="btn-outline" onClick={() => irPara('/cadastro')}>
            Criar conta
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function GuestPromptProvider({ children }) {
  const [modalAberto, setModalAberto] = useState(false);
  const [motivo, setMotivo] = useState('');

  const showGuestModal = useCallback((textoMotivo) => {
    setMotivo(
      textoMotivo ||
        'Para avaliar, comentar e participar do CineLog, crie uma conta ou faça login.'
    );
    setModalAberto(true);
  }, []);

  const fecharModal = useCallback(() => setModalAberto(false), []);

  return (
    <GuestPromptContext.Provider value={{ showGuestModal, fecharModal }}>
      {children}
      <GuestModal aberto={modalAberto} motivo={motivo} onFechar={fecharModal} />
    </GuestPromptContext.Provider>
  );
}

export function useGuestPrompt() {
  const ctx = useContext(GuestPromptContext);
  if (!ctx) throw new Error('useGuestPrompt deve estar dentro de GuestPromptProvider (dentro do Router)');
  return ctx;
}
