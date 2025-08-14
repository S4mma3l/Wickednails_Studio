import React, { useState } from 'react';
import Modal from './Modal';
import MaterialButton from './MaterialButton';

function EditAppointmentModal({ isOpen, onClose, appointment, onSave }) {
  // Inicializamos la hora a partir del objeto 'start' del evento del calendario
  const [time, setTime] = useState(appointment.start.toTimeString().substring(0, 5));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      // Pasamos el ID de la cita (almacenado en 'resource') y la nueva hora
      await onSave(appointment.resource.id, time);
      onClose(); // Cierra el modal si el guardado es exitoso
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Editar Cita</h2>
      <h4 style={{color: 'var(--text-secondary)', fontFamily: 'var(--font-body)'}}>{appointment.title}</h4>
      <p><strong>Fecha:</strong> {appointment.start.toLocaleDateString('es-ES', { dateStyle: 'full' })}</p>
      
      <div style={{ margin: '2rem 0' }}>
        <label style={{display: 'block', marginBottom: '10px'}}>Cambiar hora de la cita:</label>
        <input 
          type="time" 
          value={time} 
          onChange={(e) => setTime(e.target.value)}
          style={{ 
            padding: '10px', 
            fontSize: '1.5rem', 
            fontFamily: 'var(--font-body)',
            backgroundColor: 'var(--background-dark)',
            color: 'var(--text-primary)',
            border: '1px solid var(--primary-accent)',
            borderRadius: '5px'
          }} 
        />
      </div>
      
      {error && <p className="form-message error">{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
        <MaterialButton onClick={onClose} variant="secondary">Cancelar</MaterialButton>
        <MaterialButton onClick={handleSave} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </MaterialButton>
      </div>
    </Modal>
  );
}

export default EditAppointmentModal;