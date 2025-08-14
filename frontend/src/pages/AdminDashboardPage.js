import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminCalendarView from '../components/AdminCalendarView';
import AdminAvailabilityManager from '../components/AdminAvailabilityManager';
import ApproveModal from '../components/ApproveModal';
import MaterialButton from '../components/MaterialButton';

// Componente hijo para la vista de Solicitudes Pendientes
// Contiene toda la lógica relacionada con la gestión de solicitudes
const PendingRequestsView = ({ session, appointments, setAppointments, setError, actionLoading, setActionLoading }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [availableTimes, setAvailableTimes] = useState([]);
    
    // Helper de formato de fecha
    const formatDate = (dateString) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString.replace(/-/g, '/'));
        return date.toLocaleDateString('es-ES', options);
    };
    
    // Lógica para abrir el modal de aprobación
    const handleOpenApproveModal = async (appointment) => {
        setSelectedAppointment(appointment);
        setActionLoading(true);
        setError('');
        try {
            const { requested_day, requested_block, service } = appointment;
            const response = await fetch(`http://localhost:3001/api/availability/${requested_day}/${requested_block}?serviceId=${service.id}`, { headers: { 'Authorization': `Bearer ${session.access_token}` } });
            if (!response.ok) { 
                const errData = await response.json(); 
                throw new Error(errData.message || 'Error al buscar horarios.'); 
            }
            const times = await response.json();
            setAvailableTimes(times);
            setIsModalOpen(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Lógica para cerrar el modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAppointment(null);
        setAvailableTimes([]);
    };

    // Lógica para enviar la aprobación
    const handleApproveSubmit = async (confirmedTime) => {
        if (!selectedAppointment) return;
        setActionLoading(true);
        setError('');
        try {
            const response = await fetch(`http://localhost:3001/api/appointments/${selectedAppointment.id}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ confirmed_time: confirmedTime })
            });
            if (!response.ok) { 
                const errData = await response.json(); 
                throw new Error(errData.message || 'Error al aprobar la cita.'); 
            }
            setAppointments(prev => prev.filter(app => app.id !== selectedAppointment.id));
            handleCloseModal();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    // Lógica para rechazar una cita
    const handleReject = async (appointmentId) => {
        const isConfirmed = window.confirm("¿Estás segura de que quieres rechazar esta solicitud?");
        if (isConfirmed) {
            setActionLoading(true);
            setError('');
            try {
                const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}/reject`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                if (!response.ok) { 
                    const errData = await response.json(); 
                    throw new Error(errData.message || 'Error al rechazar la cita.'); 
                }
                setAppointments(prev => prev.filter(app => app.id !== appointmentId));
            } catch (err) {
                setError(err.message);
            } finally {
                setActionLoading(false);
            }
        }
    };

    return (
        <div>
            <div className="appointments-list">
              {appointments.length > 0 ? (
                appointments.map(app => (
                  <div key={app.id} className="appointment-card">
                    <div className="appointment-card-info"><h4>Cliente</h4><p>{app.client?.full_name || 'N/A'}</p></div>
                    <div className="appointment-card-info"><h4>Servicio</h4><p>{app.service?.name || 'N/A'}</p></div>
                    <div className="appointment-card-info"><h4>Fecha y Bloque</h4><p>{formatDate(app.requested_day)} - {app.requested_block}</p></div>
                    <div className="appointment-actions">
                      <MaterialButton onClick={() => handleOpenApproveModal(app)} disabled={actionLoading} variant="success">
                        {actionLoading && selectedAppointment?.id === app.id ? 'Buscando...' : '✓ Aprobar'}
                      </MaterialButton>
                      <MaterialButton onClick={() => handleReject(app.id)} disabled={actionLoading} variant="danger">
                        ✗ Rechazar
                      </MaterialButton>
                    </div>
                  </div>
                ))
              ) : (
                <p>No hay solicitudes pendientes por el momento. ¡Buen trabajo!</p>
              )}
            </div>
            {isModalOpen && selectedAppointment && (
                <ApproveModal 
                    isOpen={isModalOpen} 
                    onClose={handleCloseModal} 
                    onSubmit={handleApproveSubmit} 
                    loading={actionLoading} 
                    availableTimes={availableTimes} 
                />
            )}
        </div>
    );
};


// Componente principal del Panel de Administrador (con sistema de pestañas)
function AdminDashboardPage() {
    const { user, session } = useAuth();
    const [activeView, setActiveView] = useState('requests');
    
    // Estados para la vista de solicitudes (se pasan como props al componente hijo)
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    
    // Carga las solicitudes pendientes solo una vez
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
    
    // Función para renderizar el contenido de la pestaña activa
    const renderContent = () => {
        switch(activeView) {
            case 'calendar': 
                return <AdminCalendarView />;
            case 'availability': 
                return <AdminAvailabilityManager />;
            case 'requests':
            default:
                // Pasamos los estados y sus setters al componente hijo
                return <PendingRequestsView 
                            session={session} 
                            appointments={appointments} 
                            setAppointments={setAppointments} 
                            setError={setError} 
                            actionLoading={actionLoading} 
                            setActionLoading={setActionLoading} 
                       />;
        }
    };
    
    return (
        <div className="admin-dashboard-container">
            <h1>Panel de Administración</h1>
            <h2>Bienvenida, {user?.user_metadata?.full_name || user?.email}</h2>

            <div className="tabs-nav">
                <button 
                    className={`tab-button ${activeView === 'requests' ? 'active' : ''}`} 
                    onClick={() => setActiveView('requests')}
                >
                    Solicitudes Pendientes ({appointments.length})
                </button>
                <button 
                    className={`tab-button ${activeView === 'calendar' ? 'active' : ''}`} 
                    onClick={() => setActiveView('calendar')}
                >
                    Mi Calendario
                </button>
                <button 
                    className={`tab-button ${activeView === 'availability' ? 'active' : ''}`} 
                    onClick={() => setActiveView('availability')}
                >
                    Ajustes de Disponibilidad
                </button>
            </div>

            {loading ? <p>Cargando...</p> : error ? <p className="form-message error">{error}</p> : renderContent()}
        </div>
    );
}

export default AdminDashboardPage;