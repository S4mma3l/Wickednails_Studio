const { createClient } = require('@supabase/supabase-js');

// Cliente público para verificar el token del usuario (usa la anon key)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Cliente de servicio, privilegiado, para leer roles (usa la service key)
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Middleware 1: Verifica si el token es válido (sin cambios)
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ message: 'Token inválido.', error: error.message });
    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor al verificar el token.' });
  }
};

// Middleware 2: Verifica si el usuario es admin (USA EL CLIENTE ADMIN)
const checkAdminRole = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Autenticación requerida.' });
  }
  try {
    // Usamos el cliente 'supabaseAdmin' que ignora las políticas RLS
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !data) {
      // Este error ahora sí significa que la fila no existe
      return res.status(404).json({ message: 'Perfil de usuario no encontrado.' });
    }
    if (data.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Error interno del servidor al verificar el rol.' });
  }
};

module.exports = { verifyToken, checkAdminRole };