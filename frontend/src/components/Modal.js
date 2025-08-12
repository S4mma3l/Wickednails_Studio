import React from 'react';
import './Modal.css'; // Crearemos este archivo de estilos a continuación

function Modal({ isOpen, onClose, children }) {
  // Si el modal no está abierto, no renderizamos nada
  if (!isOpen) {
    return null;
  }

  return (
    // El fondo oscuro semitransparente
    <div className="modal-backdrop" onClick={onClose}>
      {/* El contenedor del contenido del modal. Evitamos que se cierre al hacer clic dentro de él */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* El contenido que pasemos al modal (en este caso, los términos) */}
        {children}
        
        {/* El botón para cerrar el modal */}
        <button className="modal-close-button" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default Modal;