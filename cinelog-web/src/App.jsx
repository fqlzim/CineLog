/**
 * App.jsx — Raiz do CineLog
 *
 * ORDEM DOS PROVIDERS (corrigida v2.2):
 *   AuthProvider → Router → GuestPromptProvider → páginas
 *   GuestPrompt PRECISA estar dentro do Router (useNavigate no modal).
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GuestPromptProvider } from './context/GuestPromptContext';
import Header from './components/Header';
import GuestWelcomeBanner from './components/GuestWelcomeBanner';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Buscar from './pages/Buscar';
import Feed from './pages/Feed';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import FilmeDetalhe from './pages/FilmeDetalhe';
import Perfil from './pages/Perfil';
import EditarPerfil from './pages/EditarPerfil';
import Dashboard from './pages/admin/Dashboard';
import GerenciarFilmes from './pages/admin/GerenciarFilmes';
import GerenciarUsuarios from './pages/admin/GerenciarUsuarios';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <GuestPromptProvider>
          <Header />
          <GuestWelcomeBanner />

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/buscar" element={<Buscar />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/filme/:id" element={<FilmeDetalhe />} />
              <Route path="/filme/tmdb/:tmdbId" element={<FilmeDetalhe />} />
              <Route path="/perfil/editar" element={
                <ProtectedRoute><EditarPerfil /></ProtectedRoute>
              } />
              <Route path="/perfil/:id" element={<Perfil />} />
              <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
              <Route path="/admin/filmes" element={<AdminRoute><GerenciarFilmes /></AdminRoute>} />
              <Route path="/admin/usuarios" element={<AdminRoute><GerenciarUsuarios /></AdminRoute>} />
            </Routes>
          </main>
        </GuestPromptProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
