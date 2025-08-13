import React, { useState } from 'react';
import Modal from './Modal';
import MaterialButton from './MaterialButton'; // Importamos el nuevo botón

function ApproveModal({ isOpen, onClose, onSubmit, loading }) {
  const [time, setTime] = useState('10:00');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(time);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <h2>Confirmar Hora de la Cita</h2>
        <p>Por favor, introduce la hora exacta para esta cita.</p>
        
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
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
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
          <MaterialButton onClick={onClose} variant="secondary">
            Cancelar
          </MaterialButton>
          <MaterialButton type="submit" disabled={loading} variant="success">
            {loading ? 'Aprobando...' : 'Aprobar y Confirmar'}
          </MaterialButton>
        </div>
      </form>
    </Modal>
  );
}

export default ApproveModal;