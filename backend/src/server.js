const express = require('express');
const cors = require('cors');
require('dotenv').config();

const servicesRouter = require('./routes/services.js');
const appointmentsRouter = require('./routes/appointments.js');
const availabilityRouter = require('./routes/availability.js');
const overridesRouter = require('./routes/overrides.js'); // <-- NUEVA RUTA

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => { res.status(200).json({ message: "API funcionando!" }); });
app.use('/api/services', servicesRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/overrides', overridesRouter); // <-- USAR LA NUEVA RUTA

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});