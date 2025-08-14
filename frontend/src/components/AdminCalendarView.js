import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import { useAuth } from '../context/AuthContext';
import EditAppointmentModal from './EditAppointmentModal';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Lunes
  getDay,
  locales,
});

function AdminCalendarView() {
  const { session } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!session) return;
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:3001/api/appointments/all', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'No se pudieron cargar los datos del calendario.');
        }
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error("El servidor no devolvió un formato de datos válido.");
        }

        const formattedEvents = data
          .filter(app => app.confirmed_time && app.service && app.client)
          .map(app => {
            const startTime = new Date(app.confirmed_time);
            const endTime = new Date(startTime.getTime() + app.service.duration_minutes * 60000);
            return {
              title: `${app.service.name} - ${app.client.full_name}`,
              start: startTime,
              end: endTime,
              resource: { id: app.id, status: app.status },
            };
        });
        setEvents(formattedEvents);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [session]);

  const eventStyleGetter = (event) => {
    const style = {
      className: event.resource.status === 'pendiente' ? 'pending' : '',
    };
    return style;
  };

  const handleSelectEvent = (event) => {
    if (event.resource.status === 'confirmada') {
        setSelectedEvent(event);
        setIsEditModalOpen(true);
    }
  };

  const handleSaveChanges = async (appointmentId, newTime) => {
    const response = await fetch(`http://localhost:3001/api/appointments/${appointmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ confirmed_time: newTime })
    });
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || 'Error al actualizar la cita.');
    }
    window.location.reload();
  };

  const { views, messages } = useMemo(() => ({
    views: {
      month: true,
      week: true,
      day: true,
    },
    messages: {
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      today: 'Hoy',
      previous: '‹',
      next: '›',
      agenda: 'Agenda',
      date: 'Fecha',
      time: 'Hora',
      event: 'Evento',
      noEventsInRange: 'No hay citas en este rango.',
    }
  }), []);

  if (loading) return <p>Cargando calendario...</p>;
  if (error) return <p className="form-message error">{error}</p>;

  return (
    <div style={{ height: '80vh' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        views={views}
        defaultView={Views.WEEK}
        messages={messages}
        defaultDate={new Date()} // Asegura que el calendario se inicie en la fecha actual
      />
      {isEditModalOpen && selectedEvent && (
        <EditAppointmentModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          appointment={selectedEvent}
          onSave={handleSaveChanges}
        />
      )}
    </div>
  );
}

export default AdminCalendarView;