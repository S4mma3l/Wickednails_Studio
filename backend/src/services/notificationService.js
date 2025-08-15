const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const ics = require('ics');
const { formatInTimeZone } = require('date-fns-tz');
const { es } = require('date-fns/locale');

// Configuración del transportador de Nodemailer
const options = {
  auth: { api_key: process.env.SENDGRID_API_KEY }
};
const mailer = nodemailer.createTransport(sgTransport(options));

// Función para crear el evento de calendario
const createCalendarEvent = (appointment) => {
  const { service, confirmed_time, client } = appointment;
  const timeZone = process.env.TIMEZONE;
  const startTimeUTC = new Date(confirmed_time);
  const endTimeUTC = new Date(startTimeUTC.getTime() + service.duration_minutes * 60000);
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
    start: [startLocal.year, startLocal.month, startLocal.day, startLocal.hour, startLocal.minute],
    end: [endLocal.year, endLocal.month, endLocal.day, endLocal.hour, endLocal.minute],
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
  let icsString = value;
  icsString = icsString.replace(/DTSTART/g, `DTSTART;TZID=${timeZone}`);
  icsString = icsString.replace(/DTEND/g, `DTEND;TZID=${timeZone}`);
  return icsString;
};

// Función para enviar el correo de confirmación inicial
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

// Función para enviar correo de actualización
const sendUpdateEmail = async (appointment, clientEmail) => {
  const { client, service, confirmed_time } = appointment;
  const timeZone = process.env.TIMEZONE;
  const formattedDateTime = formatInTimeZone(confirmed_time, timeZone, "eeee, d 'de' LLLL 'de' yyyy 'a las' HH:mm", { locale: es });
  const calendarEvent = createCalendarEvent(appointment);
  const mailToClient = {
    to: clientEmail,
    from: process.env.SENDER_EMAIL,
    subject: `❗️ Actualización de tu cita - Wickednails Studio`,
    html: `<h1>¡Hola ${client.full_name}!</h1><p>Hubo una actualización en tu cita para <strong>${service.name}</strong>.</p><p><strong>NUEVA Fecha y Hora:</strong> ${formattedDateTime}</p><p>Por favor, revisa los detalles. Si esta nueva hora no te funciona, no dudes en contactarme para buscar otra opción.</p>`,
    attachments: calendarEvent ? [{ filename: "invitacion_actualizada.ics", content: calendarEvent, contentType: "text/calendar" }] : []
  };
  const mailToAdmin = {
    to: process.env.ADMIN_EMAIL,
    from: process.env.SENDER_EMAIL,
    subject: `🔄 Cita Modificada: ${client.full_name}`,
    html: `<h1>Cita Modificada</h1><p>Has modificado una cita. Nuevos detalles:</p><ul><li><strong>Cliente:</strong> ${client.full_name}</li><li><strong>Servicio:</strong> ${service.name}</li><li><strong>NUEVA Fecha y Hora:</strong> ${formattedDateTime}</li></ul>`,
    attachments: calendarEvent ? [{ filename: "cita_actualizada.ics", content: calendarEvent, contentType: "text/calendar" }] : []
  };
  try {
    await mailer.sendMail(mailToClient);
    await mailer.sendMail(mailToAdmin);
    console.log("Correos de actualización enviados con éxito.");
  } catch (error) {
    console.error("Error al enviar correos de actualización:", error);
  }
};

// --- NUEVA FUNCIÓN ---
/**
 * Envía un correo de cancelación al cliente y al administrador
 * @param {object} appointment - El objeto de la cita cancelada
 * @param {string} clientEmail - El correo del cliente
 * @param {boolean} feeApplied - True si se aplicó un cargo por cancelación
 */
const sendCancellationEmail = async (appointment, clientEmail, feeApplied) => {
  const { client, service } = appointment;
  const cancellationFee = 20; // Define aquí el monto del cargo

  // --- Correo para la Cliente ---
  let clientHtml = `
    <h1>Hola ${client.full_name},</h1>
    <p>Hemos recibido tu solicitud de cancelación para la cita del servicio <strong>${service.name}</strong>.</p>
    <p>La cita ha sido cancelada exitosamente en nuestro sistema.</p>
  `;

  if (feeApplied) {
    clientHtml += `
      <p style="color: #e94560;"><strong>Importante:</strong> Debido a que la cancelación se realizó con menos de 24 horas de antelación, 
      se ha generado un cargo de <strong>$${cancellationFee.toFixed(2)}</strong>. Este monto quedará registrado 
      y deberá ser cubierto para poder agendar futuras citas.</p>
    `;
  }
  clientHtml += `<p>Gracias por tu comprensión.</p>`;

  const mailToClient = {
    to: clientEmail,
    from: process.env.SENDER_EMAIL,
    subject: `😢 Cancelación de Cita - Wickednails Studio`,
    html: clientHtml
  };

  // --- Correo para la Administradora ---
  const mailToAdmin = {
    to: process.env.ADMIN_EMAIL,
    from: process.env.SENDER_EMAIL,
    subject: `❌ Cita Cancelada por Cliente: ${client.full_name}`,
    html: `
      <h1>Cita Cancelada</h1>
      <p>La clienta <strong>${client.full_name}</strong> ha cancelado su cita para el servicio <strong>${service.name}</strong>.</p>
      ${feeApplied ? `<p style="background-color: #e94560; color: white; padding: 10px; border-radius: 5px;"><strong>SE HA APLICADO UN CARGO DE $${cancellationFee.toFixed(2)} POR CANCELACIÓN TARDÍA.</strong></p>` : '<p>La cancelación se realizó a tiempo y no se aplicaron cargos.</p>'}
      <p>El espacio en tu agenda ha sido liberado.</p>
    `
  };

  try {
    await mailer.sendMail(mailToClient);
    await mailer.sendMail(mailToAdmin);
    console.log("Correos de cancelación enviados con éxito.");
  } catch (error) {
    console.error("Error al enviar correos de cancelación:", error);
  }
};

module.exports = { sendConfirmationEmail, sendUpdateEmail, sendCancellationEmail };