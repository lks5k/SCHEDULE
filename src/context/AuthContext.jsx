/**
 * CONTEXTO DE AUTENTICACIÓN V3.0
 * 
 * Maneja el estado global de autenticación de la aplicación.
 * Implementa timer de inactividad de 60 segundos.
 */

import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { login, logout, autoLogout } from '@/modules/auth/services/auth.service';

const AuthContext = createContext(null);

// Agregar displayName para Fast Refresh
AuthContext.displayName = 'AuthContext';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restaurar sesión de sessionStorage al cargar
  useEffect(() => {
    const restoreSession = () => {
      try {
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (err) {
        sessionStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const handleInactivityLogout = useCallback(async () => {
    if (!currentUser) return;

    try {
      await autoLogout(currentUser);
      await logout(currentUser);
    } catch (err) {
      // Silent fail
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('currentUser');
  }, [currentUser]);

  // Timer inactividad: timeouts configurables desde Config (localStorage)
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    let inactivityTimer;

    const employeeTimeout = parseInt(
      localStorage.getItem('employeeLogoutTimeout') || '10000',
      10
    );
    const adminTimeout = parseInt(
      localStorage.getItem('adminLogoutTimeout') || '10000',
      10
    );

    const timeout =
      currentUser.role === 'employee' ? employeeTimeout : adminTimeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleInactivityLogout();
      }, timeout);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isAuthenticated, currentUser?.role, handleInactivityLogout]);

  const handleLogin = async (cedula, password) => {
    setLoading(true);
    setError(null);

    try {
      // Llamar login() del servicio con cédula y contraseña
      const result = await login(cedula, password);

      if (result.success) {
        setCurrentUser(result.user);
        setIsAuthenticated(true);
        sessionStorage.setItem('currentUser', JSON.stringify(result.user));
      } else {
        setError(result.error);
      }

      setLoading(false);
      return result;
    } catch (err) {
      console.error('Error en handleLogin:', err);
      const errorMsg = 'Error al procesar el login';
      setError(errorMsg);
      setLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const handleLogout = async () => {
    try {
      await logout(currentUser);
      
      // Limpiar estado
      setCurrentUser(null);
      setIsAuthenticated(false);
      sessionStorage.removeItem('currentUser');
    } catch (err) {
      console.error('Error en logout:', err);
    }
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    handleLogin,
    handleLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Agregar displayName para Fast Refresh
AuthProvider.displayName = 'AuthProvider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
