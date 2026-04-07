/**
 * Auth Module - Manejo de autenticación con Supabase
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

const AuthModule = (() => {
  const supabase = createClient(API_CONFIG.SUPABASE_URL, API_CONFIG.SUPABASE_ANON_KEY);
  let currentUser = null;
  const STORAGE_KEY = 'de_altura_user';

  // Obtener usuario actual del localStorage
  const getUser = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  };

  // Guardar usuario
  const saveUser = (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    currentUser = user;
    return user;
  };

  // Limpiar usuario (logout)
  const clearUser = () => {
    localStorage.removeItem(STORAGE_KEY);
    currentUser = null;
  };

  // Validar email
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Login con Supabase
  const login = async (email, password) => {
    if (!isValidEmail(email) || password.length < 6) {
      return { error: 'Credenciales inválidas' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = {
        id: data.user.id,
        email: data.user.email,
        role: 'customer',
        discount_percent: 0
      };

      saveUser(user);
      return { user, session: data.session };
    } catch (error) {
      return { error: error.message || 'Error al iniciar sesión' };
    }
  };

  // Signup con Supabase
  const signup = async (email, password) => {
    if (!isValidEmail(email) || password.length < 6) {
      return { error: 'Email o contraseña inválidos' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const user = {
        id: data.user.id,
        email: data.user.email,
        role: 'customer',
        discount_percent: 0
      };

      // Crear perfil en tabla users
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: data.user.id,
          email: email,
          role: 'customer',
          discount_percent: 0
        }]);

      if (profileError) console.warn('Error creando perfil:', profileError);

      saveUser(user);
      return { user, session: data.session };
    } catch (error) {
      return { error: error.message || 'Error al registrarse' };
    }
  };

  // Logout
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearUser();
      return { success: true };
    } catch (error) {
      return { error: error.message || 'Error al cerrar sesión' };
    }
  };

  // Obtener usuario actual
  const getCurrentUser = () => currentUser || getUser();

  // Verificar si usuario está autenticado
  const isAuthenticated = () => !!getCurrentUser();

  // Obtener descuento del usuario
  const getUserDiscount = () => {
    const user = getCurrentUser();
    return user?.discount_percent || 0;
  };

  // Verificar sesión actual
  const checkSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) {
        currentUser = { id: data.session.user.id, email: data.session.user.email };
        return { user: currentUser };
      }
      return { user: null };
    } catch (error) {
      console.error('Error verificando sesión:', error);
      return { user: null };
    }
  };

  return {
    login,
    signup,
    logout,
    getUser,
    saveUser,
    clearUser,
    getCurrentUser,
    isAuthenticated,
    getUserDiscount,
    isValidEmail,
    checkSession,
    supabase // Exportar para acceso directo
  };
})();
