import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ApproveModal from '../components/ApproveModal';
import MaterialButton from '../components/MaterialButton'; // Importamos el nuevo botón

const formatDate = (dateString) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString.replace(/-/g, '/'));
  return date.toLocaleDateString('es-ES', options);
};

function AdminDashboardPage() {
  const { user, session } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchPendingAppointments = async () => {
      if (!session) return;
      setLoading(true); setError('');
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
      } finally { setLoading(false); }
    };
    fetchPendingAppointments();
  }, [session]);

  const handleOpenApproveModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };
  const handleApproveSubmit = async (confirmedTime) => {
    if (!selectedAppointment) return;
    setActionLoading(true); setError('');
    try {
      const response = await fetch(`http://localhost:3001/api/appointments/${selectedAppointment.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ confirmed_time: confirmedTime })
      });
      if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Error al aprobar.'); }
      setAppointments(prev => prev.filter(app => app.id !== selectedAppointment.id));
      handleCloseModal();
    } catch (err) { setError(err.message); } finally { setActionLoading(false); }
  };
  const handleReject = async (appointmentId) => {
    const isConfirmed = window.confirm("¿Estás segura de que quieres rechazar esta solicitud?");
    if (isConfirmed) {
      setActionLoading(true); setError('');
      try {
        const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}/reject`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (!response.ok) { const errData = await response.json(); throw new Error(errData.message || 'Error al rechazar.'); }
        setAppointments(prev => prev.filter(app => app.id !== appointmentId));
      } catch (err) { setError(err.message); } finally { setActionLoading(false); }
    }
  };

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
                  <h4>Fecha y Bloque</h4>
                  <p>{formatDate(app.requested_day)} - {app.requested_block}</p>
                </div>
                <div className="appointment-actions">
                  <MaterialButton 
                    onClick={() => handleOpenApproveModal(app)} 
                    disabled={actionLoading}
                    variant="success"
                  >
                    &#x2713; Aprobar
                  </MaterialButton>
                  <MaterialButton 
                    onClick={() => handleReject(app.id)} 
                    disabled={actionLoading}
                    variant="danger"
                  >
                    &#x2717; Rechazar
                  </MaterialButton>
                </div>
              </div>
            ))
          ) : (
            <p>No hay solicitudes pendientes por el momento. ¡Buen trabajo!</p>
          )}
        </div>
      )}
      
      {selectedAppointment && (
        <ApproveModal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleApproveSubmit} loading={actionLoading} />
      )}
    </div>
  );
}

export default AdminDashboardPage;