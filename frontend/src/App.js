import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Importa tus páginas
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage'; // Nueva página
import AdminRoute from './components/AdminRoute'; // Nuevo componente de ruta protegida

import './App.css';

function HomePage() { /* ... (Sin cambios) ... */ }

// Componente de Navegación principal (Actualizado)
function Navigation() {
  const { user, profile, signOut } = useAuth(); // Obtenemos el perfil
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="App-header">
      <nav>
        <Link to={user ? "/dashboard" : "/"} style={{textDecoration: 'none', color: 'white'}}>
          <h1>Wickednails Studio</h1>
        </Link>
        <div>
          {user ? (
            <>
              {/* Si es admin, muestra el enlace al panel de admin */}
              {profile?.role === 'admin' && (
                <Link to="/admin/dashboard" style={{ margin: '0 10px' }}>Admin</Link>
              )}
              <Link to="/dashboard" style={{ margin: '0 10px' }}>Mi Panel</Link>
              <button onClick={handleLogout} className="link-style-logout">Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ margin: '0 10px' }}>Iniciar Sesión</Link>
              <Link to="/register" style={{ margin: '0 10px' }}>Registrarse</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

// Componente App principal (Actualizado)
function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navigation />
        <main style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Nueva ruta de Admin protegida */}
            <Route path="/admin/dashboard" element={<AdminRoute />}>
              <Route index element={<AdminDashboardPage />} />
            </Route>

          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

// ... Estilos (Sin cambios) ...

export default App;