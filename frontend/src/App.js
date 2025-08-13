import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Importa tus componentes y páginas
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/ProtectedRoute'; // El nuevo guardián
import AdminRoute from './components/AdminRoute';

import './App.css';

// Componente para la página de inicio (sin cambios)
function HomePage() {
  return (
    <div>
      <h2>Bienvenida a tu espacio de citas</h2>
      <p>Por favor, inicia sesión o regístrate para poder solicitar una cita.</p>
    </div>
  );
}

// Componente de Navegación principal (LÓGICA DE LOGOUT MEJORADA)
function Navigation() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // La función de logout ahora es asíncrona para esperar a que Supabase termine
  const handleLogout = async () => {
    try {
      await signOut();
      // La navegación ocurre DESPUÉS de que el logout se ha completado
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
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

// Componente App principal (RUTAS ACTUALIZADAS)
function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Navigation />
        <main style={{ padding: '20px' }}>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas Protegidas para Clientes y Admin */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
            
            {/* Rutas Protegidas solo para Admin */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            </Route>

          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

// Estilos (sin cambios)
const styles = `
  .App-header nav { display: flex; justify-content: space-between; align-items: center; width: 90%; max-width: 1200px; margin: 0 auto; }
  .link-style-logout { background: none; border: none; color: white; cursor: pointer; font-size: 1em; font-family: inherit; margin-left: 10px; text-decoration: underline; }
  .link-style-logout:hover { color: #61dafb; }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default App;