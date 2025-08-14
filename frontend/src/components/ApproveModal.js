import React, { useState } from 'react';
import Modal from './Modal';
import MaterialButton from './MaterialButton';

function ApproveModal({ isOpen, onClose, onSubmit, loading, availableTimes }) {
  // El estado ahora se inicializa con el primer horario disponible, si existe
  const [time, setTime] = useState(availableTimes.length > 0 ? availableTimes[0] : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (time) {
      onSubmit(time);
    } else {
      alert("Por favor, selecciona un horario disponible.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2>Seleccionar Hora de la Cita</h2>
        <p>Los siguientes horarios están disponibles considerando la duración del servicio y otras citas ya agendadas.</p>
        
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          {availableTimes.length > 0 ? (
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              style={{ 
                padding: '12px', 
                fontSize: '1.2rem', 
                fontFamily: 'var(--font-body)',
                backgroundColor: 'var(--background-dark)',
                color: 'var(--text-primary)',
                border: '1px solid var(--primary-accent)',
                borderRadius: '5px',
                width: '100%'
              }}
            >
              {availableTimes.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          ) : (
            <p className="form-message error">No hay huecos disponibles en este bloque para este servicio.</p>
          )}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <MaterialButton onClick={onClose} variant="secondary">
            Cancelar
          </MaterialButton>
          <MaterialButton 
            type="submit" 
            disabled={loading || availableTimes.length === 0} 
            variant="success"
          >
            {loading ? 'Aprobando...' : 'Aprobar y Confirmar'}
          </MaterialButton>
        </div>
      </form>
    </Modal>
  );
}

export default ApproveModal;