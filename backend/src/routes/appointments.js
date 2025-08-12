const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken, checkAdminRole } = require('../middleware/auth.js');
const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// RUTA POST: Crear una solicitud de cita (SIN CAMBIOS)
router.post('/', verifyToken, async (req, res) => { /* ...código existente... */ });

// RUTA GET: Obtener citas pendientes (SIN CAMBIOS)
router.get('/pending', [verifyToken, checkAdminRole], async (req, res) => { /* ...código existente... */ });

// --- NUEVA RUTA ---
// RUTA PATCH: Aprobar una cita pendiente
router.patch('/:id/approve', [verifyToken, checkAdminRole], async (req, res) => {
  try {
    const { id } = req.params; // El ID de la cita viene de la URL
    const { confirmed_time } = req.body; // La hora confirmada viene del cuerpo de la petición

    if (!confirmed_time) {
      return res.status(400).json({ message: 'Se requiere una hora de confirmación.' });
    }

    // Buscamos la cita para asegurarnos de que existe y está pendiente
    const { data: existingAppointment, error: findError } = await supabaseAdmin
      .from('appointments')
      .select('requested_day')
      .eq('id', id)
      .eq('status', 'pendiente')
      .single();

    if (findError || !existingAppointment) {
      return res.status(404).json({ message: 'No se encontró una cita pendiente con ese ID.' });
    }

    // Combinamos la fecha solicitada con la hora confirmada
    const finalTimestamp = new Date(`${existingAppointment.requested_day}T${confirmed_time}`);

    // Actualizamos la cita
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'confirmada',
        confirmed_time: finalTimestamp.toISOString(), // Guardamos en formato ISO
      })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    res.status(200).json({ message: 'Cita aprobada con éxito.', data: data[0] });

  } catch (error) {
    console.error('Error approving appointment:', error);
    res.status(500).json({ message: 'Error interno del servidor al aprobar la cita.', details: error.message });
  }
});


module.exports = router;