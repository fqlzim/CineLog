/**
 * components/GuestWelcomeBanner.jsx — Banner para visitantes (não invasivo)
 *
 * Exibido apenas quando:
 *   - Usuário NÃO está logado (useAuth().isLoggedIn === false)
 *   - Banner ainda não foi fechado nesta sessão (sessionStorage)
 *
 * sessionStorage vs localStorage:
 *   sessionStorage apaga ao fechar o navegador → banner reaparece na próxima visita.
 *   localStorage persistiria para sempre — seria mais invasivo.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const STORAGE_KEY = 'cinelog_guest_banner_dismissed';

function GuestWelcomeBanner() {
  const { isLoggedIn, carregando } = useAuth();
  const [fechado, setFechado] = useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');

  if (carregando || isLoggedIn || fechado) return null;

  const handleFechar = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setFechado(true);
  };

  return (
    <aside className="guest-banner" role="note">
      <div className="guest-banner-content">
        <span className="guest-banner-icon">✨</span>
        <p>
          Você pode explorar os filmes, mas para <strong>avaliar</strong>,{' '}
          <strong>comentar</strong> e participar do CineLog é necessário{' '}
          <strong>criar uma conta</strong> ou <strong>fazer login</strong>.
        </p>
        <div className="guest-banner-actions">
          <Link to="/login" className="btn-sm">Entrar</Link>
          <Link to="/cadastro" className="btn-sm outline">Criar conta</Link>
          <button type="button" className="btn-sm ghost" onClick={handleFechar}>
            Entendi
          </button>
        </div>
      </div>
    </aside>
  );
}

export default GuestWelcomeBanner;
