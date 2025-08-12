const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Configura el cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Ruta GET para /api/availability
router.get('/', async (req, res) => {
  try {
    // 1. Obtener el horario de trabajo general
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('work_schedules')
      .select('day_of_week, block_name')
      .eq('is_active', true);

    if (scheduleError) throw scheduleError;

    // 2. Obtener los bloqueos personales (vacaciones, etc.)
    const { data: blockoutData, error: blockoutError } = await supabase
      .from('personal_blockouts')
      .select('start_time, end_time');

    if (blockoutError) throw blockoutError;

    // 3. Procesar la disponibilidad para los próximos 60 días
    const availableSlots = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a la medianoche

    for (let i = 0; i < 60; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dayOfWeek = currentDate.getDay(); // 0=Domingo, 6=Sábado

      // Filtrar los bloques disponibles para este día de la semana
      const blocksForDay = scheduleData
        .filter(rule => rule.day_of_week === dayOfWeek)
        .map(rule => rule.block_name);

      if (blocksForDay.length > 0) {
        // Verificar si la fecha cae dentro de un bloqueo personal
        const isBlockedOut = blockoutData.some(blockout => {
          const startDate = new Date(blockout.start_time);
          const endDate = new Date(blockout.end_time);
          return currentDate >= startDate && currentDate <= endDate;
        });

        if (!isBlockedOut) {
          const dateString = currentDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
          availableSlots[dateString] = blocksForDay;
        }
      }
    }
    
    res.status(200).json(availableSlots);

  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

module.exports = router;