import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', options);
};

function AppointmentHistory() {
  const { session } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!session) return;
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/appointments/mine', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        if (!response.ok) throw new Error('No se pudo cargar el historial.');
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [session]);

  if (loading) return <p>Cargando tu historial...</p>;

  return (
    <div className="history-container">
      <h3>Tu Historial de Citas</h3>
      {history.length === 0 ? (
        <p>Aún no has solicitado ninguna cita.</p>
      ) : (
        <div className="history-list">
          {history.map(app => (
            <div key={app.id} className="history-card">
              <div>
                <p style={{margin: 0, fontWeight: 'bold'}}>{app.service.name}</p>
                <small style={{color: 'var(--text-secondary)'}}>
                  {app.status === 'confirmada' ? `Confirmada para: ${formatDate(app.confirmed_time)}` : `Solicitada para: ${app.requested_day} (${app.requested_block})`}
                </small>
              </div>
              <span className={`status-badge ${app.status}`}>{app.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AppointmentHistory;