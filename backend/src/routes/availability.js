const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { verifyToken, checkAdminRole } = require('../middleware/auth.js');
const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- RUTA PARA LA CLIENTA (LÓGICA MEJORADA CON CÁLCULO DE HUECO MÁXIMO) ---
router.get('/', async (req, res) => {
  try {
    const { data: scheduleData, error: scheduleError } = await supabase.from('work_schedules').select('*').eq('is_active', true);
    if (scheduleError) throw scheduleError;

    const { data: overridesData, error: overridesError } = await supabase.from('availability_overrides').select('*');
    if (overridesError) throw overridesError;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: allAppointments, error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .select('status, confirmed_time, requested_day, requested_block, service:services(duration_minutes)')
        .in('status', ['confirmada', 'pendiente'])
        .gte('requested_day', todayStr);
    if(appointmentsError) throw appointmentsError;

    const availabilityResult = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 60; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dayOfWeek = currentDate.getDay();
      const dateString = currentDate.toISOString().split('T')[0];

      let baseBlocksForDay = scheduleData.filter(r => r.day_of_week === dayOfWeek).map(r => r.block_name);
      
      const overridesForDay = overridesData.filter(ov => ov.override_date === dateString);
      if (overridesForDay.length > 0) {
        overridesForDay.forEach(override => {
          if (override.is_available) {
            if (!baseBlocksForDay.includes(override.block_name)) baseBlocksForDay.push(override.block_name);
          } else {
            baseBlocksForDay = baseBlocksForDay.filter(block => block !== override.block_name);
          }
        });
      }

      const dayAvailability = {};
      for (const block of baseBlocksForDay) {
        const blockLimits = { Mañana: { start: 9, end: 12 }, Tarde: { start: 12, end: 19 } };
        const currentBlockLimits = blockLimits[block];
        if (!currentBlockLimits) continue;

        const appointmentsForDay = allAppointments.filter(app => app.requested_day === dateString);
        
        const confirmedInBlock = appointmentsForDay
            .filter(app => app.status === 'confirmada' && app.confirmed_time)
            .map(app => ({
                start: new Date(app.confirmed_time),
                end: new Date(new Date(app.confirmed_time).getTime() + app.service.duration_minutes * 60000)
            }))
            .filter(app => app.start.getHours() >= currentBlockLimits.start && app.start.getHours() < currentBlockLimits.end)
            .sort((a, b) => a.start - b.start);

        const pendingDuration = appointmentsForDay
            .filter(app => app.status === 'pendiente' && app.requested_block === block)
            .reduce((total, app) => total + app.service.duration_minutes, 0);

        let maxGap = 0;
        let lastEndTime = new Date(`${dateString}T${String(currentBlockLimits.start).padStart(2, '0')}:00:00`);

        if (confirmedInBlock.length > 0) {
            const firstGap = (confirmedInBlock[0].start - lastEndTime) / 60000;
            if (firstGap > maxGap) maxGap = firstGap;
        }

        for (let j = 0; j < confirmedInBlock.length; j++) {
            const currentAppointment = confirmedInBlock[j];
            const gap = (currentAppointment.start - lastEndTime) / 60000;
            if (gap > maxGap) maxGap = gap;
            lastEndTime = currentAppointment.end;
        }

        const blockEndTime = new Date(`${dateString}T${String(currentBlockLimits.end).padStart(2, '0')}:00:00`);
        const finalGap = (blockEndTime - lastEndTime) / 60000;
        if (finalGap > maxGap) maxGap = finalGap;

        const effectiveMaxGap = maxGap - pendingDuration;

        if (effectiveMaxGap > 0) {
            dayAvailability[block] = effectiveMaxGap;
        }
      }
      
      if (Object.keys(dayAvailability).length > 0) {
        availabilityResult[dateString] = dayAvailability;
      }
    }
    
    res.status(200).json(availabilityResult);

  } catch (error) {
    console.error('Error fetching general availability for client:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// --- RUTA PARA LA ADMINISTRADORA (SIN CAMBIOS) ---
router.get('/:date/:block', [verifyToken, checkAdminRole], async (req, res) => {
    try {
        const { date, block } = req.params;
        const { serviceId } = req.query;
        if (!serviceId) {
          return res.status(400).json({ message: 'Se requiere el ID del servicio.' });
        }
        const { data: serviceData, error: serviceError } = await supabaseAdmin.from('services').select('duration_minutes').eq('id', serviceId).single();
        if (serviceError) throw serviceError;
        const newAppointmentDuration = serviceData.duration_minutes;
        const blockLimits = { Mañana: { start: 9, end: 12 }, Tarde: { start: 12, end: 19 } };
        const currentBlock = blockLimits[block];
        if (!currentBlock) {
          return res.status(400).json({ message: 'Bloque horario no válido.' });
        }
        const { data: confirmedAppointments, error: appointmentsError } = await supabaseAdmin.from('appointments').select('confirmed_time, service_id').eq('status', 'confirmada').gte('confirmed_time', `${date}T00:00:00Z`).lte('confirmed_time', `${date}T23:59:59Z`);
        if (appointmentsError) throw appointmentsError;
        const serviceIds = confirmedAppointments.map(app => app.service_id);
        const servicesData = serviceIds.length > 0 ? (await supabaseAdmin.from('services').select('id, duration_minutes').in('id', serviceIds)).data : [];
        const occupiedSlots = confirmedAppointments.map(app => {
          const service = servicesData.find(s => s.id === app.service_id);
          const start = new Date(app.confirmed_time);
          const duration = service ? service.duration_minutes : 60;
          const end = new Date(start.getTime() + duration * 60000);
          return { start, end };
        });
        const availableSlots = [];
        const interval = 15;
        let potentialStartTime = new Date(`${date}T${String(currentBlock.start).padStart(2, '0')}:00:00`);
        const blockEndTime = new Date(`${date}T${String(currentBlock.end).padStart(2, '0')}:00:00`);
        while (potentialStartTime < blockEndTime) {
          const potentialEndTime = new Date(potentialStartTime.getTime() + newAppointmentDuration * 60000);
          if (potentialEndTime > blockEndTime) break;
          const isOverlapping = occupiedSlots.some(slot => (potentialStartTime < slot.end) && (potentialEndTime > slot.start));
          if (!isOverlapping) {
            const hours = String(potentialStartTime.getHours()).padStart(2, '0');
            const minutes = String(potentialStartTime.getMinutes()).padStart(2, '0');
            availableSlots.push(`${hours}:${minutes}`);
          }
          potentialStartTime.setMinutes(potentialStartTime.getMinutes() + interval);
        }
        res.status(200).json(availableSlots);
      } catch (error) {
        console.error('Error fetching available slots for admin:', error);
        res.status(500).json({ message: 'Error interno del servidor.', details: error.message });
      }
});

module.exports = router;