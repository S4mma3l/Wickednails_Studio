const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { zonedTimeToUtc } = require('date-fns-tz');
const { verifyToken, checkAdminRole } = require('../middleware/auth.js');
const { sendConfirmationEmail, sendUpdateEmail, sendCancellationEmail } = require('../services/notificationService.js');
const router = express.Router();

// --- Clientes de Supabase ---
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// --- RUTA POST: Crear una solicitud de cita ---
router.post('/', verifyToken, async (req, res) => {
  try {
    const clientId = req.user.id; 
    const { service_id, requested_day, requested_block, client_notes } = req.body;
    if (!service_id || !requested_day || !requested_block) {
      return res.status(400).json({ message: 'Faltan datos para crear la cita.' });
    }
    const { data, error } = await supabase.from('appointments').insert([{ client_id: clientId, service_id: service_id, requested_day: requested_day, requested_block: requested_block, client_notes: client_notes || null, status: 'pendiente' }]).select();
    if (error) { return res.status(500).json({ message: 'Error al registrar la solicitud de cita.', error: error.message }); }
    res.status(201).json({ message: 'Solicitud de cita registrada con éxito.', data: data[0] });
  } catch (err) {
    return res.status(500).json({ message: 'Error interno del servidor.', error: err.message });
  }
});

// --- RUTA GET: Obtener citas pendientes para Admin ---
router.get('/pending', [verifyToken, checkAdminRole], async (req, res) => {
  try {
    let { data: appointments, error: appointmentsError } = await supabaseAdmin.from('appointments').select('*').eq('status', 'pendiente').order('created_at', { ascending: true });
    if (appointmentsError) throw appointmentsError;
    if (!appointments || appointments.length === 0) { return res.status(200).json([]); }
    const clientIds = appointments.map(app => app.client_id);
    const serviceIds = appointments.map(app => app.service_id);
    const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('id, full_name, phone').in('id', clientIds);
    if (profilesError) throw profilesError;
    const { data: services, error: servicesError } = await supabaseAdmin.from('services').select('id, name, duration_minutes').in('id', serviceIds);
    if (servicesError) throw servicesError;
    const combinedData = appointments.map(app => {
      const clientProfile = profiles.find(p => p.id === app.client_id);
      const serviceInfo = services.find(s => s.id === app.service_id);
      return { ...app, client: clientProfile || { full_name: 'Desconocido', phone: 'N/A' }, service: serviceInfo || { name: 'Servicio eliminado', duration_minutes: 0 } };
    });
    res.status(200).json(combinedData);
  } catch (error) {
    console.error('Error fetching pending appointments (manual join):', error);
    res.status(500).json({ message: 'Error al obtener las solicitudes.', details: error.message });
  }
});

// --- RUTA PATCH: Aprobar una cita ---
router.patch('/:id/approve', [verifyToken, checkAdminRole], async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed_time } = req.body;
    const timeZone = process.env.TIMEZONE;
    if (!confirmed_time || !timeZone) { return res.status(400).json({ message: 'Faltan datos de hora o zona horaria en la configuración.' }); }
    const { data: originalAppointment, error: fetchError } = await supabaseAdmin.from('appointments').select('requested_day, client_id, service_id').eq('id', id).eq('status', 'pendiente').single();
    if (fetchError || !originalAppointment) { return res.status(404).json({ message: 'No se encontró una cita pendiente con ese ID.' }); }
    const localDateTimeString = `${originalAppointment.requested_day}T${confirmed_time}`;
    const finalTimestampUTC = zonedTimeToUtc(localDateTimeString, timeZone);
    const { data: updatedAppointment, error: updateError } = await supabaseAdmin.from('appointments').update({ status: 'confirmada', confirmed_time: finalTimestampUTC.toISOString() }).eq('id', id).select().single();
    if (updateError) throw updateError;
    const { data: clientProfile, error: profileError } = await supabaseAdmin.from('profiles').select('full_name, phone').eq('id', originalAppointment.client_id).single();
    if (profileError) throw profileError;
    const { data: serviceInfo, error: serviceError } = await supabaseAdmin.from('services').select('name, duration_minutes').eq('id', originalAppointment.service_id).single();
    if (serviceError) throw serviceError;
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(originalAppointment.client_id);
    if(userError) throw userError;
    const fullAppointmentDetails = { ...updatedAppointment, client: clientProfile, service: serviceInfo };
    if (user && fullAppointmentDetails) { sendConfirmationEmail(fullAppointmentDetails, user.email); }
    res.status(200).json({ message: 'Cita aprobada con éxito.', data: fullAppointmentDetails });
  } catch (error) {
    console.error('Error approving appointment (tz-aware):', error);
    res.status(500).json({ message: 'Error interno del servidor al aprobar la cita.', details: error.message });
  }
});

// --- RUTA PATCH: Rechazar una cita pendiente (Admin) ---
router.patch('/:id/reject', [verifyToken, checkAdminRole], async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin.from('appointments').update({ status: 'rechazada' }).eq('id', id).eq('status', 'pendiente').select();
    if (error) { throw error; }
    if (data.length === 0) { return res.status(404).json({ message: 'No se encontró una cita pendiente con ese ID para rechazar.' }); }
    res.status(200).json({ message: 'Cita rechazada con éxito.', data: data[0] });
  } catch (error) {
    console.error('Error rejecting appointment:', error);
    res.status(500).json({ message: 'Error interno del servidor al rechazar la cita.', details: error.message });
  }
});

// --- RUTA GET: Obtener historial del cliente ---
router.get('/mine', verifyToken, async (req, res) => {
    try {
      const clientId = req.user.id;
      const { data: appointments, error: appointmentsError } = await supabaseAdmin.from('appointments').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
      if (appointmentsError) throw appointmentsError;
      if (!appointments || appointments.length === 0) { return res.status(200).json([]); }
      const serviceIds = appointments.map(app => app.service_id);
      const { data: services, error: servicesError } = await supabaseAdmin.from('services').select('id, name').in('id', serviceIds);
      if (servicesError) throw servicesError;
      const combinedHistory = appointments.map(app => {
        const serviceInfo = services.find(s => s.id === app.service_id);
        return { ...app, service: serviceInfo || { name: 'Servicio Desconocido' } };
      });
      res.status(200).json(combinedHistory);
    } catch (error) {
      console.error('Error fetching user appointment history (manual join):', error);
      res.status(500).json({ message: 'Error al obtener tu historial de citas.', details: error.message });
    }
});

// --- RUTA GET: Obtener todas las citas para el calendario de Admin ---
router.get('/all', [verifyToken, checkAdminRole], async (req, res) => {
    try {
      const { data: appointments, error: appointmentsError } = await supabaseAdmin.from('appointments').select('*').in('status', ['confirmada', 'pendiente']);
      if (appointmentsError) throw appointmentsError;
      if (!appointments || appointments.length === 0) { return res.status(200).json([]); }
      const clientIds = appointments.map(app => app.client_id);
      const serviceIds = appointments.map(app => app.service_id);
      const { data: profiles, error: profilesError } = await supabaseAdmin.from('profiles').select('id, full_name').in('id', clientIds);
      if (profilesError) throw profilesError;
      const { data: services, error: servicesError } = await supabaseAdmin.from('services').select('id, name, duration_minutes').in('id', serviceIds);
      if (servicesError) throw servicesError;
      const combinedData = appointments.map(app => {
        const clientProfile = profiles.find(p => p.id === app.client_id);
        const serviceInfo = services.find(s => s.id === app.service_id);
        return { ...app, client: clientProfile || { full_name: 'Desconocido' }, service: serviceInfo || { name: 'Servicio Desconocido', duration_minutes: 60 } };
      });
      res.status(200).json(combinedData);
    } catch (error) {
      console.error('Error fetching all appointments (manual join):', error);
      res.status(500).json({ message: 'Error al obtener todas las citas.', details: error.message });
    }
});

// --- RUTA PATCH: Editar una cita existente (Admin) ---
router.patch('/:id', [verifyToken, checkAdminRole], async (req, res) => {
    try {
      const { id } = req.params;
      const { confirmed_time } = req.body;
      const timeZone = process.env.TIMEZONE;
      if (!confirmed_time || !timeZone) { return res.status(400).json({ message: 'Faltan datos de hora o zona horaria.' }); }
      const { data: originalAppointment, error: fetchError } = await supabaseAdmin.from('appointments').select('requested_day, client_id, service_id').eq('id', id).single();
      if (fetchError || !originalAppointment) { return res.status(404).json({ message: 'No se encontró la cita.' }); }
      const localDateTimeString = `${originalAppointment.requested_day}T${confirmed_time}`;
      const finalTimestampUTC = zonedTimeToUtc(localDateTimeString, timeZone);
      const { data: updatedAppointment, error: updateError } = await supabaseAdmin.from('appointments').update({ confirmed_time: finalTimestampUTC.toISOString() }).eq('id', id).select().single();
      if (updateError) throw updateError;
      const { data: clientProfile } = await supabaseAdmin.from('profiles').select('full_name, phone').eq('id', originalAppointment.client_id).single();
      const { data: serviceInfo } = await supabaseAdmin.from('services').select('name, duration_minutes').eq('id', originalAppointment.service_id).single();
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(originalAppointment.client_id);
      const fullAppointmentDetails = { ...updatedAppointment, client: clientProfile, service: serviceInfo };
      if (user && fullAppointmentDetails) { sendUpdateEmail(fullAppointmentDetails, user.email); }
      res.status(200).json({ message: 'Cita actualizada con éxito.', data: fullAppointmentDetails });
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ message: 'Error al actualizar la cita.', details: error.message });
    }
});

// --- RUTA PATCH: CLIENTA CANCELA SU CITA (LÓGICA CORREGIDA) ---
router.patch('/:id/cancel', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const clientId = req.user.id;
      const CANCELLATION_FEE = 20.00;
  
      // 1. Obtenemos la cita BÁSICA y verificamos que pertenece al usuario
      const { data: appointmentBase, error: fetchError } = await supabaseAdmin
        .from('appointments')
        .select('*') // Seleccionamos todo, pero sin joins
        .eq('id', id)
        .eq('client_id', clientId)
        .eq('status', 'confirmada')
        .single();
      
      if (fetchError || !appointmentBase) {
        return res.status(404).json({ message: 'No se encontró una cita confirmada para cancelar.' });
      }
  
      // 2. Lógica de las 24 horas
      let feeApplied = false;
      const now = new Date();
      const appointmentTime = new Date(appointmentBase.confirmed_time);
      const hoursDifference = (appointmentTime - now) / (1000 * 60 * 60);
  
      if (hoursDifference < 24) {
        feeApplied = true;
        // Obtenemos el perfil para saber la deuda actual
        const { data: clientProfileFee, error: feeError } = await supabaseAdmin.from('profiles').select('cancellation_fee').eq('id', clientId).single();
        if (feeError) throw feeError;
        // Aplicar el cargo en el perfil del cliente
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ cancellation_fee: (Number(clientProfileFee.cancellation_fee) || 0) + CANCELLATION_FEE })
          .eq('id', clientId);
        if (profileError) throw profileError;
      }
  
      // 3. Actualizar el estado de la cita a 'cancelada'
      const { data: updatedAppointment, error: updateError } = await supabaseAdmin
        .from('appointments')
        .update({ status: 'cancelada' })
        .eq('id', id)
        .select()
        .single();
      if (updateError) throw updateError;
      
      // 4. Obtenemos datos relacionados para la notificación
      const { data: clientProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', clientId).single();
      const { data: serviceInfo } = await supabaseAdmin.from('services').select('*').eq('id', appointmentBase.service_id).single();
      const appointmentForEmail = { ...appointmentBase, client: clientProfile, service: serviceInfo };
  
      // 5. Enviar notificaciones
      const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(clientId);
      if (user) {
        sendCancellationEmail(appointmentForEmail, user.email, feeApplied);
      }
  
      res.status(200).json({ message: 'Cita cancelada con éxito.', data: updatedAppointment });
  
    } catch (error) {
      console.error('Error canceling appointment (manual join):', error);
      res.status(500).json({ message: 'Error al cancelar la cita.', details: error.message });
    }
});

module.exports = router;