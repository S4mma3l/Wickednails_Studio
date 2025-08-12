import { createClient } from '@supabase/supabase-js';

// 1. Lee las variables de entorno de React
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// 2. Exporta el cliente de Supabase inicializado con esas variables
export const supabase = createClient(supabaseUrl, supabaseAnonKey);