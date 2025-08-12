const { createClient } = require('@supabase/supabase-js');

// Configura el cliente de Supabase una sola vez
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// El middleware de verificación de token
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Si no hay cabecera de autorización, denegar acceso
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  // Extraer el token
  const token = authHeader.split(' ')[1];

  try {
    // Verificar el token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      // Si el token es inválido o ha expirado
      return res.status(401).json({ message: 'Token inválido.', error: error.message });
    }

    // Si el token es válido, adjuntar el usuario a la petición y continuar
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor al verificar el token.' });
  }
};

module.exports = verifyToken;