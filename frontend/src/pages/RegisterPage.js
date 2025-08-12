import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Modal from '../components/Modal';
import { Link } from 'react-router-dom'; // Importamos Link

function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setMessage("Error: Debes aceptar los términos y condiciones.");
      return;
    }
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("¡Registro exitoso! Revisa tu correo para verificar la cuenta.");
    }
    setLoading(false);
  };

  return (
    <div className="form-container">
      <h2>Crear Cuenta</h2>
      <form onSubmit={handleRegister}>
        <input type="text" placeholder="Nombre Completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <input type="text" placeholder="Teléfono (con prefijo)" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        
        <div style={{ textAlign: 'center', margin: '15px 0', color: 'var(--text-secondary)' }}>
          <input 
            type="checkbox" 
            id="terms" 
            checked={termsAccepted} 
            onChange={(e) => setTermsAccepted(e.target.checked)}
            style={{ marginRight: '10px', cursor: 'pointer' }}
          />
          <label htmlFor="terms">
            Acepto los{' '}
            <button type="button" className="link-style" onClick={() => setIsTermsModalOpen(true)}>
              Términos y Condiciones
            </button>
          </label>
        </div>
        
        <button type="submit" disabled={loading || !termsAccepted}>
          {loading ? 'Creando...' : 'Crear Cuenta'}
        </button>
      </form>
      
      {message && (
        <p className={`form-message ${message.startsWith('Error') ? 'error' : 'success'}`}>
          {message}
        </p>
      )}

      <p className="form-footer">
        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
      </p>

      {/* El componente Modal no necesita cambios */}
      <Modal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)}>
        <>
          <h2>Términos y Condiciones de Uso</h2>
          <p><em>Última actualización: 11 de Agosto de 2025</em></p>
          
          <h4>1. Aceptación de los Términos</h4>
          <p>Al registrarte y utilizar esta aplicación, aceptas de manera voluntaria e inequívoca cumplir con los presentes términos y condiciones. Si no estás de acuerdo, por favor no utilices el servicio.</p>
          
          <h4>2. Finalidad del Servicio</h4>
          <p>Esta aplicación es una herramienta diseñada para facilitar la solicitud de citas. El envío de una solicitud no constituye una reserva final ni garantiza la disponibilidad. Todas las citas están sujetas a la confirmación manual y explícita por parte de la manicurista, la cual se realizará principalmente a través de WhatsApp u otro medio de contacto directo.</p>
          
          <h4>3. Privacidad y Tratamiento de Datos</h4>
          <p>Tus datos personales (nombre, correo electrónico, número de teléfono) se recopilan y utilizan con el único y exclusivo propósito de gestionar tus citas, confirmar horarios, enviar recordatorios y mantener un historial de los servicios prestados. Tus datos no serán vendidos, cedidos ni compartidos con terceros para fines comerciales.</p>
          
          <h4>4. Obligaciones del Usuario</h4>
          <p>Como usuario, te comprometes a proporcionar información veraz y actual. Eres responsable de la seguridad de tu contraseña y de mantener la confidencialidad de tu cuenta.</p>

          <h4>5. Cancelaciones y Puntualidad</h4>
          <p>Se ruega notificar cualquier cancelación o necesidad de reprogramar una cita con un mínimo de 24 horas de antelación para permitir que otra persona pueda ocupar el espacio. Las demoras pueden afectar la calidad del servicio y la agenda del día.</p>
        </>
      </Modal>
    </div>
  );
}

export default RegisterPage;