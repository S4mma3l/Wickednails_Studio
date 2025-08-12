import React, { useState } from 'react';
import Modal from './Modal'; // Reutilizamos nuestro componente de Modal

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
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="admin-button reject" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="admin-button approve" disabled={loading}>
            {loading ? 'Aprobando...' : 'Aprobar y Confirmar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ApproveModal;