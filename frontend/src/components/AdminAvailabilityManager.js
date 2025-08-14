import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import Modal from './Modal';
import MaterialButton from './MaterialButton';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay, locales,
});

// Componente para el modal de edición de un día
const EditDayModal = ({ date, availability, onClose, onSave }) => {
  const [morning, setMorning] = useState(availability.Mañana);
  const [afternoon, setAfternoon] = useState(availability.Tarde);

  const handleSave = () => {
    onSave({ Mañana: morning, Tarde: afternoon });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <h2>Editar Disponibilidad</h2>
      <h3>{format(date, 'eeee, d \'de\' MMMM', { locale: es })}</h3>
      <div style={{ margin: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <input type="checkbox" checked={morning} onChange={(e) => setMorning(e.target.checked)} style={{transform: 'scale(1.5)'}} />
          Bloque de Mañana (9:00 - 12:00)
        </label>
        <label style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <input type="checkbox" checked={afternoon} onChange={(e) => setAfternoon(e.target.checked)} style={{transform: 'scale(1.5)'}} />
          Bloque de Tarde (12:00 - 19:00)
        </label>
      </div>
      <div style={{display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
        <MaterialButton onClick={onClose} variant="secondary">Cancelar</MaterialButton>
        <MaterialButton onClick={handleSave}>Guardar Cambios</MaterialButton>
      </div>
    </Modal>
  );
};

// Componente principal del gestor
function AdminAvailabilityManager() {
  const { session } = useAuth();
  const [events, setEvents] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (!session) return;
    
    const fetchGeneralAvailability = async () => {
      const response = await fetch('http://localhost:3001/api/availability/');
      const data = await response.json();

      // --- LA CORRECCIÓN CLAVE ESTÁ AQUÍ ---
      // Usamos Object.keys() para obtener los nombres de los bloques y luego unirlos
      const calendarEvents = Object.entries(data).map(([date, blocks]) => ({
        title: Object.keys(blocks).join(' / '), // Convertimos el objeto de bloques a un array de sus claves
        start: new Date(date.replace(/-/g, '/')),
        end: new Date(date.replace(/-/g, '/')),
        allDay: true,
        resource: 'base'
      }));
      setEvents(calendarEvents);
    };
    
    const fetchOverrides = async () => {
        const response = await fetch('http://localhost:3001/api/overrides', {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        const data = await response.json();
        const newOverrides = {};
        data.forEach(ov => {
            if (!newOverrides[ov.override_date]) newOverrides[ov.override_date] = {};
            newOverrides[ov.override_date][ov.block_name] = ov.is_available;
        });
        setOverrides(newOverrides);
    };
    
    fetchGeneralAvailability();
    fetchOverrides();
  }, [session]);

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    setIsModalOpen(true);
  };

  const handleSaveOverride = async (newAvailability) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    for (const block in newAvailability) {
      const isAvailable = newAvailability[block];
      await fetch('http://localhost:3001/api/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          override_date: dateStr,
          block_name: block,
          is_available: isAvailable
        }),
      });
    }
    window.location.reload();
  };

  const getDayAvailability = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const baseEvent = events.find(e => format(e.start, 'yyyy-MM-dd') === dateStr);
    const baseAvailability = { Mañana: false, Tarde: false };
    if(baseEvent && baseEvent.title) {
        if(baseEvent.title.includes('Mañana')) baseAvailability.Mañana = true;
        if(baseEvent.title.includes('Tarde')) baseAvailability.Tarde = true;
    }
    const dayOverrides = overrides[dateStr] || {};
    return { ...baseAvailability, ...dayOverrides };
  };

  return (
    <div>
        <h3>Gestionar Disponibilidad Diaria</h3>
        <p>Haz clic en cualquier día para anular tu horario semanal por defecto. Puedes activar o desactivar bloques para días específicos.</p>
        <div style={{ height: '70vh', marginTop: '2rem' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            selectable
            onSelectSlot={handleSelectSlot}
            messages={{ next: "Sig", previous: "Ant", today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
          />
        </div>
        {isModalOpen && selectedDate && (
            <EditDayModal 
                date={selectedDate}
                availability={getDayAvailability(selectedDate)}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveOverride}
            />
        )}
    </div>
  );
}

export default AdminAvailabilityManager;