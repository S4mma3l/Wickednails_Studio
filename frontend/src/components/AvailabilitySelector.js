import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AvailabilitySelector.css';

function AvailabilitySelector({ service, onBack, onBookingComplete }) {
  const { session } = useAuth(); // Obtenemos la sesión para acceder al token
  const [availability, setAvailability] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3001/api/availability');
        if (!response.ok) throw new Error('Error al cargar la disponibilidad.');
        const data = await response.json();
        setAvailability(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, []);

  const handleDayClick = (date) => setSelectedDate(date);

  const handleBlockClick = async (block) => {
    setBooking(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          service_id: service.id,
          requested_day: selectedDate,
          requested_block: block,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error al enviar la solicitud.');
      
      onBookingComplete(); // Notifica al componente padre que todo fue bien
    
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const renderCalendar = () => {
    const month = currentMonth.getMonth(), year = currentMonth.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day"></div>);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isAvailable = availability[dateStr];
      const isSelected = selectedDate === dateStr;
      days.push(
        <div key={i} className={`calendar-day ${isAvailable ? 'available' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => isAvailable && handleDayClick(dateStr)}>
          {i}
        </div>
      );
    }
    return days;
  };
  
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="availability-container">
      <div className="availability-header">
        <button onClick={onBack} className="back-button">← Volver a Servicios</button>
        <h2>Elige un Día</h2>
      </div>
      {loading && <p>Consultando agenda...</p>}
      {!loading && !error && (
        <>
          <h3>{currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
          <div className="calendar-grid">
            {daysOfWeek.map(day => <div key={day} className="calendar-header">{day}</div>)}
            {renderCalendar()}
          </div>
          {selectedDate && availability[selectedDate] && (
            <div className="time-blocks">
              <h4>Elige un bloque para el {selectedDate}:</h4>
              {availability[selectedDate].map(block => (
                <button key={block} className="time-block-button" onClick={() => handleBlockClick(block)} disabled={booking}>
                  {booking ? 'Enviando...' : block}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {error && <p className="form-message error" style={{marginTop: '1rem'}}>{error}</p>}
    </div>
  );
}

export default AvailabilitySelector;