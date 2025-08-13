const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const ics = require('ics');
const { formatInTimeZone } = require('date-fns-tz');
const { es } = require('date-fns/locale');

// Configuración del transportador (sin cambios)
const options = {
  auth: { api_key: process.env.SENDGRID_API_KEY }
};
const mailer = nodemailer.createTransport(sgTransport(options));

/**
 * Genera un evento de calendario en formato iCal (.ics)
 * @param {object} appointment - El objeto de la cita
 * @returns {string} El contenido del archivo .ics
 */
const createCalendarEvent = (appointment) => {
  const { service, confirmed_time, client } = appointment;
  const timeZone = process.env.TIMEZONE;

  // 1. Tomamos el timestamp UTC de la base de datos
  const startTimeUTC = new Date(confirmed_time);
  // 2. Calculamos el timestamp de fin sumando la duración
  const endTimeUTC = new Date(startTimeUTC.getTime() + service.duration_minutes * 60000);

  // 3. Extraemos los componentes NUMÉRICOS de la hora local a partir de las fechas UTC
  const startLocal = {
    year: parseInt(formatInTimeZone(startTimeUTC, timeZone, 'yyyy')),
    month: parseInt(formatInTimeZone(startTimeUTC, timeZone, 'M')),
    day: parseInt(formatInTimeZone(startTimeUTC, timeZone, 'd')),
    hour: parseInt(formatInTimeZone(startTimeUTC, timeZone, 'H')),
    minute: parseInt(formatInTimeZone(startTimeUTC, timeZone, 'm'))
  };

  const endLocal = {
    year: parseInt(formatInTimeZone(endTimeUTC, timeZone, 'yyyy')),
    month: parseInt(formatInTimeZone(endTimeUTC, timeZone, 'M')),
    day: parseInt(formatInTimeZone(endTimeUTC, timeZone, 'd')),
    hour: parseInt(formatInTimeZone(endTimeUTC, timeZone, 'H')),
    minute: parseInt(formatInTimeZone(endTimeUTC, timeZone, 'm'))
  };

  const event = {
    // 4. Pasamos los números directamente a la librería 'ics'
    start: [startLocal.year, startLocal.month, startLocal.day, startLocal.hour, startLocal.minute],
    end: [endLocal.year, endLocal.month, endLocal.day, endLocal.hour, endLocal.minute],
    // 5. Le decimos a 'ics' que estos números representan una hora local
    startInputType: 'local',
    endInputType: 'local',
    title: `Cita de Manicura: ${service.name}`,
    description: `Tu cita para ${service.name} con Wickednails Studio ha sido confirmada.`,
    location: 'Wickednails Studio',
    organizer: { name: 'Wickednails Studio', email: process.env.SENDER_EMAIL },
    attendees: [
      { name: client.full_name, email: client.email, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
    ]
  };

  const { error, value } = ics.createEvent(event);
  if (error) {
    console.error("Error creando el evento .ics:", error);
    return null;
  }
  
  // 6. Inyectamos el TZID para máxima compatibilidad
  let icsString = value;
  icsString = icsString.replace(/DTSTART/g, `DTSTART;TZID=${timeZone}`);
  icsString = icsString.replace(/DTEND/g, `DTEND;TZID=${timeZone}`);

  return icsString;
};

/**
 * Envía un correo de confirmación de cita (sin cambios en esta función)
 */
const sendConfirmationEmail = async (appointment, clientEmail) => {
  const { client, service, confirmed_time } = appointment;
  const timeZone = process.env.TIMEZONE;
  
  const formattedDateTime = formatInTimeZone(confirmed_time, timeZone, "eeee, d 'de' LLLL 'de' yyyy 'a las' HH:mm", { locale: es });

  const calendarEvent = createCalendarEvent(appointment);
  const whatsappMessage = encodeURIComponent(`¡Hola! Te confirmo tu cita para ${service.name} el ${formattedDateTime}. ¡Gracias!`);
  const whatsappUrl = `https://wa.me/${client.phone}?text=${whatsappMessage}`;

  const mailToClient = {
    to: clientEmail, from: process.env.SENDER_EMAIL, subject: `💜 ¡Tu cita está confirmada! - Wickednails Studio`,
    html: `<h1>¡Hola ${client.full_name}!</h1><p>Tu cita para <strong>${service.name}</strong> ha sido confirmada con éxito.</p><p><strong>Fecha y Hora:</strong> ${formattedDateTime}</p><p>¡Te espero!</p><p>---</p><p>Puedes confirmar por WhatsApp aquí: <a href="${whatsappUrl}">Confirmar por WhatsApp</a></p>`,
    attachments: calendarEvent ? [{ filename: "invitacion.ics", content: calendarEvent, contentType: "text/calendar" }] : []
  };

  const mailToAdmin = {
    to: process.env.ADMIN_EMAIL, from: process.env.SENDER_EMAIL, subject: `✅ Nueva Cita Confirmada: ${client.full_name} - ${service.name}`,
    html: `<h1>Nueva Cita Confirmada</h1><ul><li><strong>Cliente:</strong> ${client.full_name}</li><li><strong>Email:</strong> ${clientEmail}</li><li><strong>Teléfono:</strong> ${client.phone}</li><li><strong>Servicio:</strong> ${service.name}</li><li><strong>Fecha y Hora:</strong> ${formattedDateTime}</li></ul>`,
    attachments: calendarEvent ? [{ filename: "cita.ics", content: calendarEvent, contentType: "text/calendar" }] : []
  };

  try {
    await mailer.sendMail(mailToClient);
    await mailer.sendMail(mailToAdmin);
    console.log("Correos de confirmación enviados con éxito.");
  } catch (error) {
    console.error("Error al enviar correos de confirmación:", error);
  }
};

module.exports = { sendConfirmationEmail };