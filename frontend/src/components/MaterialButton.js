import React from 'react';
import './MaterialButton.css';

// Ya no necesitamos la librería externa, solo el CSS
function MaterialButton({ children, onClick, type = 'button', variant = 'primary', disabled = false, fullWidth = false }) {
  const buttonClasses = `
    material-button 
    ${variant} 
    ${fullWidth ? 'full-width' : ''}
  `;

  const createRipple = (event) => {
    const button = event.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add("ripple");

    // Limpiar ripples anteriores para evitar acumulación
    const ripple = button.getElementsByClassName("ripple")[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);
  };

  const handleClick = (event) => {
    if (!disabled) {
      createRipple(event);
      if (onClick) {
        onClick(event);
      }
    }
  };

  return (
    // Ya no necesitamos el contenedor <Ripple>
    <button 
      type={type} 
      className={buttonClasses} 
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default MaterialButton;