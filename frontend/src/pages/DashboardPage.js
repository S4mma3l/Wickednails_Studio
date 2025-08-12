import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AvailabilitySelector from '../components/AvailabilitySelector';
import BookingSuccess from '../components/BookingSuccess'; // Importamos la nueva pantalla

// --- Componente ServicesDisplay (sin cambios) ---
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

// --- Componente principal del Dashboard (Actualizado) ---
function DashboardPage() {
  const { user } = useAuth();
  const [view, setView] = useState('services'); // 'services', 'availability', 'success'
  const [selectedService, setSelectedService] = useState(null);

  const handleSelectService = (service) => {
    setSelectedService(service);
    setView('availability');
  };

  const resetToServices = () => {
    setSelectedService(null);
    setView('services');
  };

  const handleBookingComplete = () => {
    setView('success');
  };

  // Elige qué componente renderizar basado en el estado 'view'
  const renderContent = () => {
    switch(view) {
      case 'availability':
        return <AvailabilitySelector service={selectedService} onBack={resetToServices} onBookingComplete={handleBookingComplete} />;
      case 'success':
        return <BookingSuccess onReset={resetToServices} />;
      case 'services':
      default:
        return (
          <>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
              Elige un servicio para comenzar a solicitar tu cita.
            </p>
            <ServicesDisplay onSelectService={handleSelectService} />
          </>
        );
    }
  }

  return (
    <div>
      <h2>¡Hola, {user?.user_metadata?.full_name || user?.email}!</h2>
      {renderContent()}
    </div>
  );
}

export default DashboardPage;