import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AvailabilitySelector from '../components/AvailabilitySelector';
import BookingSuccess from '../components/BookingSuccess';
import AppointmentHistory from '../components/AppointmentHistory';

// Componente para mostrar la lista de servicios. Lo mantenemos aquí por cohesión.
const ServicesDisplay = ({ onSelectService }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/services');
        if (!response.ok) throw new Error('No se pudo conectar con el servidor.');
        const data = await response.json();
        setServices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading) return <p>Cargando servicios...</p>;
  if (error) return <p className="form-message error">{error}</p>;

  return (
    <div className="services-grid">
      {services.map((service) => (
        <div key={service.id} className="service-card" onClick={() => onSelectService(service)}>
          <h3>{service.name}</h3>
          <p>{service.description}</p>
          <div className="service-footer">
            <span className="service-duration">{service.duration_minutes} min</span>
            <span className="service-price">${Number(service.price).toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente principal del Dashboard con Pestañas
function DashboardPage() {
  const { user } = useAuth();
  // 'book' para solicitar, 'history' para ver historial, etc.
  const [activeView, setActiveView] = useState('book');
  const [selectedService, setSelectedService] = useState(null);

  const handleSelectService = (service) => {
    setSelectedService(service);
    setActiveView('availability');
  };

  const resetToServices = () => {
    setSelectedService(null);
    setActiveView('book');
  };

  const handleBookingComplete = () => {
    setActiveView('success');
  };

  const renderContent = () => {
    switch(activeView) {
      case 'availability':
        return <AvailabilitySelector service={selectedService} onBack={resetToServices} onBookingComplete={handleBookingComplete} />;
      case 'success':
        return <BookingSuccess onReset={resetToServices} />;
      case 'history':
        return <AppointmentHistory />;
      case 'book':
      default:
        return (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', textAlign: 'left' }}>
              Elige un servicio para comenzar a solicitar tu cita.
            </p>
            <ServicesDisplay onSelectService={handleSelectService} />
          </>
        );
    }
  };

  return (
    <div>
      <h2 style={{textAlign: 'left'}}>¡Hola, {user?.user_metadata?.full_name || user?.email}!</h2>
      
      {/* Pestañas de Navegación, solo se muestran en las vistas principales */}
      {(activeView === 'book' || activeView === 'history') && (
        <div className="tabs-nav">
          <button 
            className={`tab-button ${activeView === 'book' ? 'active' : ''}`} 
            onClick={() => setActiveView('book')}
          >
            Solicitar Cita
          </button>
          <button 
            className={`tab-button ${activeView === 'history' ? 'active' : ''}`} 
            onClick={() => setActiveView('history')}
          >
            Mis Citas
          </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
}

export default DashboardPage;