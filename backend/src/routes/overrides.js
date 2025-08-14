const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken, checkAdminRole } = require('../middleware/auth.js');
const router = express.Router();

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// RUTA GET: Obtener todas las anulaciones existentes
router.get('/', [verifyToken, checkAdminRole], async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin.from('availability_overrides').select('*');
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las anulaciones.', details: error.message });
  }
});

// RUTA POST: Guardar una nueva anulación (o actualizar una existente)
router.post('/', [verifyToken, checkAdminRole], async (req, res) => {
  const { override_date, block_name, is_available } = req.body;

  if (!override_date || !block_name || is_available === undefined) {
    return res.status(400).json({ message: 'Faltan datos para guardar la anulación.' });
  }

  try {
    // 'upsert' inserta si no existe, o actualiza si ya existe una regla para esa fecha/bloque
    const { data, error } = await supabaseAdmin
      .from('availability_overrides')
      .upsert({ override_date, block_name, is_available }, { onConflict: 'override_date, block_name' })
      .select();
    
    if (error) throw error;
    res.status(201).json({ message: 'Disponibilidad actualizada.', data: data[0] });
  } catch (error) {
    console.error('Error saving override:', error);
    res.status(500).json({ message: 'Error al guardar la anulación.', details: error.message });
  }
});

module.exports = router;