const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Configura el cliente de Supabase dentro de la ruta
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Definir la ruta GET para /api/services
router.get('/', async (req, res) => {
  try {
    // Consulta a la tabla 'services' en Supabase
    const { data, error } = await supabase
      .from('services')
      .select('*') // Selecciona todas las columnas
      .order('price', { ascending: true }); // Ordena por precio, por ejemplo

    if (error) {
      // Si Supabase devuelve un error, lo enviamos en la respuesta
      console.error('Error fetching services from Supabase:', error);
      return res.status(500).json({ message: 'Error en la base de datos', error: error.message });
    }

    // Si todo va bien, enviamos los datos
    res.status(200).json(data);

  } catch (err) {
    // Para cualquier otro error inesperado en el servidor
    console.error('Unexpected server error:', err);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  }
});

module.exports = router;