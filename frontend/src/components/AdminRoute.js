import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

function AdminRoute() {
  const { profile, loading } = useAuth();

  // Si aún está cargando la información, no renderizamos nada para evitar parpadeos
  if (loading) {
    return <p>Verificando permisos...</p>;
  }

  // Si el perfil existe y el rol es 'admin', permite el acceso
  if (profile && profile.role === 'admin') {
    return <Outlet />; // Outlet renderiza el componente hijo de la ruta
  }

  // Si no es admin, lo redirige al dashboard de cliente
  return <Navigate to="/dashboard" replace />;
}

export default AdminRoute;