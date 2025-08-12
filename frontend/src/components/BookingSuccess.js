import React from 'react';

// Estilos para la pantalla de éxito
const styles = `
.booking-success-container {
  background-color: var(--surface-color);
  padding: 3rem;
  border-radius: 8px;
  border: 1px solid var(--secondary-accent);
  max-width: 600px;
  margin: 3rem auto;
  text-align: center;
  box-shadow: 0 0 25px rgba(197, 165, 61, 0.2);
}
.success-icon {
  font-size: 4rem;
  color: var(--color-success);
}
.success-button {
  width: auto;
  padding: 12px 30px;
  margin-top: 2rem;
  font-family: var(--font-headings);
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--background-dark);
  background: var(--primary-accent);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.success-button:hover {
  background-color: var(--secondary-accent);
}
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


function BookingSuccess({ onReset }) {
  return (
    <div className="booking-success-container">
      <div className="success-icon">✧</div>
      <h2>¡Solicitud Enviada!</h2>
      <p style={{ color: 'var(--text-secondary)' }}>
        Tu petición ha sido recibida correctamente. En breve recibirás un mensaje por <strong>WhatsApp</strong>
        con la confirmación y la hora exacta de tu cita.
      </p>
      <button onClick={onReset} className="success-button">
        Solicitar Otra Cita
      </button>
    </div>
  );
}

export default BookingSuccess;