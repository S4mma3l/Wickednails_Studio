import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Helper para formatear la fecha
const formatDate = (dateString) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
}

function AdminDashboardPage() {
  const { user, session } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPendingAppointments = async () => {
      if (!session) return;
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:3001/api/appointments/pending', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Error al cargar las solicitudes.');
        }
        const data = await response.json();
        setAppointments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingAppointments();
  }, [session]);

  return (
    <div className="admin-dashboard-container">
      <h1>Panel de Administración</h1>
      <h2>Bienvenida, {user?.user_metadata?.full_name || user?.email}</h2>
      <p style={{color: 'var(--text-secondary)'}}>
        Aquí están las solicitudes de citas pendientes de aprobación.
      </p>

      {loading && <p>Cargando solicitudes...</p>}
      {error && <p className="form-message error">{error}</p>}
      
      {!loading && !error && (
        <div className="appointments-list">
          {appointments.length > 0 ? (
            appointments.map(app => (
              <div key={app.id} className="appointment-card">
                <div className="appointment-card-info">
                  <h4>Cliente</h4>
                  <p>{app.client?.full_name || 'No disponible'}</p>
                </div>
                <div className="appointment-card-info">
                  <h4>Servicio</h4>
                  <p>{app.service?.name || 'No disponible'}</p>
                </div>
                <div className="appointment-card-info">
                  <h4>Fecha y Bloque Solicitado</h4>
                  <p>{formatDate(app.requested_day)} - {app.requested_block}</p>
                </div>
                <div className="appointment-actions">
                  <button className="admin-button approve">Aprobar</button>
                  <button className="admin-button reject">Rechazar</button>
                </div>
              </div>
            ))
          ) : (
            <p>No hay solicitudes pendientes por el momento. ¡Buen trabajo!</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboardPage;