import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  // Mientras se verifica la sesión, no mostramos nada para evitar parpadeos
  if (loading) {
    return <p>Cargando...</p>;
  }

  // Si no hay un usuario logueado, redirigimos a la página de inicio de sesión
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay un usuario, permitimos el acceso a la ruta solicitada
  return <Outlet />;
}

export default ProtectedRoute;