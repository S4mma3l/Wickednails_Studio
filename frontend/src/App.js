import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Importamos nuestro hook de autenticación

// Importa tus páginas
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
// Crearemos esta página a continuación como un placeholder
import DashboardPage from './pages/DashboardPage'; 

import './App.css';

// Componente para la página de inicio
function HomePage() {
  return (
    <div>
      <h2>Bienvenida a tu espacio de citas</h2>
      <p>Por favor, inicia sesión o regístrate para poder solicitar una cita.</p>
    </div>
  );
}

// Componente de Navegación principal
function Navigation() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login'); // Redirige al login después de cerrar sesión
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

            {/* Añadimos la ruta al dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

// Estilos para el botón de logout y otros detalles
const styles = `
  .App-header nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
  }
  .link-style-logout {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 1em;
    font-family: inherit;
    margin-left: 10px;
    text-decoration: underline;
  }
  .link-style-logout:hover {
    color: #61dafb;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default App;