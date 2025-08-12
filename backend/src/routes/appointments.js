const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const verifyToken = require('../middleware/auth.js'); // Importamos nuestro guardián
const router = express.Router();

// Configura el cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Ruta POST para /api/appointments
// Usamos el middleware verifyToken. Si el token no es válido, el código de abajo nunca se ejecutará.
router.post('/', verifyToken, async (req, res) => {
  try {
    // req.user es el usuario que nos proporcionó el middleware
    const clientId = req.user.id; 

    // Extraemos los datos del cuerpo de la petición
    const { service_id, requested_day, requested_block, client_notes } = req.body;

    // Validación básica de los datos
    if (!service_id || !requested_day || !requested_block) {
      return res.status(400).json({ message: 'Faltan datos para crear la cita.' });
    }

    // Insertar la nueva cita en la tabla 'appointments'
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        { 
          client_id: clientId,
          service_id: service_id,
          requested_day: requested_day,
          requested_block: requested_block,
          client_notes: client_notes || null, // Acepta notas opcionales
          status: 'pendiente' // El estado inicial es siempre pendiente
        }
      ])
      .select(); // .select() devuelve el registro creado

    if (error) {
      console.error('Supabase error creating appointment:', error);
      return res.status(500).json({ message: 'Error al registrar la solicitud de cita.', error: error.message });
    }

    res.status(201).json({ message: 'Solicitud de cita registrada con éxito.', data: data[0] });

  } catch (err) {
    console.error('Unexpected server error:', err);
    res.status(500).json({ message: 'Error interno del servidor.', error: err.message });
  }
});

module.exports = router;