/**
 * components/Header.jsx — Navegação principal do CineLog
 *
 * RESPONSIVIDADE:
 *   Desktop → links horizontais na barra
 *   Mobile  → botão hamburger abre menu vertical (menuAberto)
 *
 * Adapta links conforme login:
 *   Visitante → Login / Cadastro
 *   Usuário   → Perfil / Logout
 *   Admin     → link extra para /admin
 */

import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Header() {
  const { usuario, isLoggedIn, isAdmin, logout } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);

  const fecharMenu = () => setMenuAberto(false);

  const linkClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <header className="site-header">
      <div className="header-top">
        <Link to="/" className="logo" onClick={fecharMenu}>
          Cine<span>log</span>
        </Link>

        <button
          type="button"
          className={`nav-toggle ${menuAberto ? 'open' : ''}`}
          onClick={() => setMenuAberto((v) => !v)}
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <nav className={`header-nav ${menuAberto ? 'open' : ''}`}>
        <ul className="nav-links">
          <li>
            <NavLink to="/" end className={linkClass} onClick={fecharMenu}>
              Catálogo
            </NavLink>
          </li>
          <li>
            <NavLink to="/buscar" className={linkClass} onClick={fecharMenu}>
              Buscar
            </NavLink>
          </li>
          <li>
            <NavLink to="/feed" className={linkClass} onClick={fecharMenu}>
              Feed
            </NavLink>
          </li>

          {isAdmin && (
            <li>
              <NavLink to="/admin" className={linkClass} onClick={fecharMenu}>
                Admin
              </NavLink>
            </li>
          )}

          {isLoggedIn ? (
            <>
              <li>
                <NavLink
                  to={`/perfil/${usuario.id}`}
                  className={linkClass}
                  onClick={fecharMenu}
                >
                  @{usuario.nome_usuario}
                </NavLink>
              </li>
              <li>
                <NavLink to="/perfil/editar" className={linkClass} onClick={fecharMenu}>
                  Configurações
                </NavLink>
              </li>
              <li>
                <button
                  type="button"
                  className="nav-btn"
                  onClick={() => { logout(); fecharMenu(); }}
                >
                  Sair
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className={linkClass} onClick={fecharMenu}>
                  Entrar
                </NavLink>
              </li>
              <li>
                <NavLink to="/cadastro" className={linkClass} onClick={fecharMenu}>
                  Cadastrar
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
