import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import MaterialButton from '../components/MaterialButton'; // Importamos el nuevo botón

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(`Error: Usuario o contraseña incorrectos.`);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="card-container">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="Correo Electrónico" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <div style={{marginTop: '1.5rem'}}>
          <MaterialButton type="submit" disabled={loading} fullWidth>
            {loading ? 'Verificando...' : 'Entrar'}
          </MaterialButton>
        </div>
      </form>
      {message && <p className="form-message error">{message}</p>}
      <p className="form-footer">
        ¿Aún no tienes una cuenta? <Link to="/register">Regístrate aquí</Link>
      </p>
    </div>
  );
}

export default LoginPage;