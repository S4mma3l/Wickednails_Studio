import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MaterialButton from './MaterialButton';

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
  const [actionLoading, setActionLoading] = useState(null); // Para saber qué cita se está procesando

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

  const handleCancel = async (appointmentId) => {
    const confirmationText = "Atención: Si cancelas con menos de 24 horas de antelación, se aplicará un cargo a tu cuenta que deberás abonar en tu próxima visita.\n\n¿Estás segura de que quieres cancelar esta cita?";
    if (window.confirm(confirmationText)) {
      setActionLoading(appointmentId);
      try {
        const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}/cancel`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Error al cancelar la cita.');
        
        // Actualizamos el estado local para que el cambio se vea al instante
        setHistory(prevHistory => prevHistory.map(app => 
            app.id === appointmentId ? { ...app, status: 'cancelada' } : app
        ));

      } catch (error) {
        alert(error.message);
      } finally {
        setActionLoading(null);
      }
    }
  };

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
              <div style={{textAlign: 'right'}}>
                {app.status === 'confirmada' && (
                  <MaterialButton 
                    variant="danger" 
                    onClick={() => handleCancel(app.id)}
                    disabled={actionLoading === app.id}
                  >
                    {actionLoading === app.id ? 'Cancelando...' : 'Cancelar Cita'}
                  </MaterialButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AppointmentHistory;