const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importamos nuestras rutas
const servicesRouter = require('./routes/services.js');
const availabilityRouter = require('./routes/availability.js');
const appointmentsRouter = require('./routes/appointments.js'); // Nueva ruta de citas

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// --- Rutas de la API ---
app.get('/api', (req, res) => {
  res.status(200).json({ message: "¡La API del backend para Wickednails Studio está funcionando!" });
});

app.use('/api/services', servicesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/appointments', appointmentsRouter); // Usamos la nueva ruta


// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});