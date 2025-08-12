import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

// 1. Crear el Contexto
const AuthContext = createContext();

// 2. Crear el Proveedor del Contexto (un componente que envolverá nuestra app)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Intenta obtener la sesión activa al cargar la aplicación por primera vez
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Escucha los cambios en el estado de autenticación (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Limpia el listener cuando el componente se desmonte
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 3. Define los valores que serán accesibles por toda la app
  const value = {
    session,
    user,
    signOut: () => supabase.auth.signOut(),
  };

  // Retorna el proveedor con los valores, solo si no está cargando
  // Esto evita parpadeos en la UI mientras se verifica la sesión
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 4. Crear un "hook" personalizado para usar el contexto fácilmente
export function useAuth() {
  return useContext(AuthContext);
}