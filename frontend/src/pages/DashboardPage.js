import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AvailabilitySelector from '../components/AvailabilitySelector';
import BookingSuccess from '../components/BookingSuccess';
import AppointmentHistory from '../components/AppointmentHistory';

// --- COMPONENTE SERVICESDISPLAY (ACTUALIZADO) ---
const ServicesDisplay = ({ onSelectService, availability }) => {
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

  // Función para determinar si un servicio está disponible
  const isServiceAvailable = (serviceDuration) => {
    // Si no hay datos de disponibilidad (o está vacío), asumimos que sí está disponible para evitar bloquear todo
    if (!availability || Object.keys(availability).length === 0) return true;
    
    // Buscamos si existe AL MENOS UN bloque en AL MENOS UN día con suficiente espacio
    return Object.values(availability).some(dayBlocks => 
      Object.values(dayBlocks).some(maxGap => maxGap >= serviceDuration)
    );
  };

  if (loading) return <p>Cargando servicios...</p>;
  if (error) return <p className="form-message error">{error}</p>;

  return (
    <div className="services-grid">
      {services.map((service) => {
        const available = isServiceAvailable(service.duration_minutes);
        return (
          <div 
            key={service.id} 
            className={`service-card ${!available ? 'disabled' : ''}`}
            onClick={() => available && onSelectService(service)}
          >
            <h3>{service.name}</h3>
            <p>{service.description}</p>
            {!available && <small className="form-message error" style={{margin: '0 0 1rem 0'}}>No hay suficiente tiempo disponible para este servicio en los próximos 60 días.</small>}
            <div className="service-footer">
              <span className="service-duration">{service.duration_minutes} min</span>
              <span className="service-price">${Number(service.price).toFixed(2)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- COMPONENTE DASHBOARDPAGE (ACTUALIZADO) ---
function DashboardPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('book');
  const [selectedService, setSelectedService] = useState(null);
  const [availability, setAvailability] = useState(null); // Nuevo estado para guardar la disponibilidad
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  // Cargamos la disponibilidad general cuando el componente se monta
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoadingAvailability(true);
        const response = await fetch('http://localhost:3001/api/availability/');
        if (!response.ok) throw new Error('No se pudo cargar la disponibilidad.');
        const data = await response.json();
        setAvailability(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAvailability(false);
      }
    };
    fetchAvailability();
  }, []);

  const handleSelectService = (service) => {
    setSelectedService(service);
    setActiveView('availability');
  };

  const resetToServices = () => {
    setSelectedService(null);
    setActiveView('book');
  };

  const handleBookingComplete = () => {
    // Forzamos un refresco completo para recalcular la disponibilidad
    window.location.reload(); 
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
            {loadingAvailability ? <p>Calculando disponibilidad...</p> : <ServicesDisplay onSelectService={handleSelectService} availability={availability} />}
          </>
        );
    }
  };

  return (
    <div>
      <h2 style={{textAlign: 'left'}}>¡Hola, {user?.user_metadata?.full_name || user?.email}!</h2>
      
      {(activeView === 'book' || activeView === 'history') && (
        <div className="tabs-nav">
          <button className={`tab-button ${activeView === 'book' ? 'active' : ''}`} onClick={() => setActiveView('book')}>
            Solicitar Cita
          </button>
          <button className={`tab-button ${activeView === 'history' ? 'active' : ''}`} onClick={() => setActiveView('history')}>
            Mis Citas
          </button>
        </div>
      )}

      {renderContent()}
    </div>
  );
}

export default DashboardPage;