/**
 * CONTEXTO DE AUTENTICACIÓN V3.0
 * 
 * Maneja el estado global de autenticación de la aplicación.
 * Implementa timer de inactividad de 60 segundos.
 */

import { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { login, logout, autoLogout } from '@/modules/auth/services/auth.service';

const AuthContext = createContext(null);

// Agregar displayName para Fast Refresh
AuthContext.displayName = 'AuthContext';

// Configuración de tiempo de inactividad (60 segundos)
const INACTIVITY_TIMEOUT = 60000; // 60 segundos en milisegundos

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Referencias para timer de inactividad y auditoría
  const inactivityTimerRef = useRef(null);
  const auditTimerRef = useRef(null);
  const lastActivityTimeRef = useRef(Date.now());
  const throttleTimeoutRef = useRef(null);

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
        console.error('Error restaurando sesión:', err);
        sessionStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // Función pura para auto-logout (evita CSP eval)
  const handleInactivityLogout = useCallback(async () => {
    console.warn('🚨 LOGOUT AUTOMÁTICO: Sesión expirada por inactividad (60 segundos exactos)');
    
    // Limpiar timers de auditoría
    if (auditTimerRef.current) {
      clearInterval(auditTimerRef.current);
      auditTimerRef.current = null;
    }
    
    // Llamar autoLogout del servicio
    if (currentUser) {
      await autoLogout(currentUser);
    }
    
    // Limpiar estado local
    setCurrentUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('currentUser');
  }, [currentUser]);

  // Timer de inactividad - 60 segundos EXACTOS con auditoría
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      return; // No configurar timer si no hay sesión
    }

    // Función para resetear el timer con precisión
    const resetTimer = () => {
      // 1. Limpiar timer de inactividad anterior (CRÍTICO)
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }

      // 2. Limpiar timer de auditoría anterior
      if (auditTimerRef.current) {
        clearInterval(auditTimerRef.current);
        auditTimerRef.current = null;
      }

      // 3. Actualizar timestamp de última actividad
      lastActivityTimeRef.current = Date.now();

      // 4. Crear nuevo timer de 60 segundos EXACTOS
      inactivityTimerRef.current = setTimeout(handleInactivityLogout, INACTIVITY_TIMEOUT);

      // 5. Iniciar timer de auditoría (cada 10 segundos)
      let elapsed = 0;
      auditTimerRef.current = setInterval(() => {
        elapsed += 10;
        const remaining = 60 - elapsed;
        console.log(`⏱️ [AUDITORÍA] Timer de inactividad: ${remaining} segundos restantes (${elapsed}s transcurridos)`);
        
        if (remaining <= 0) {
          clearInterval(auditTimerRef.current);
          auditTimerRef.current = null;
        }
      }, 10000); // Cada 10 segundos
    };

    // Función throttled para actividad (máximo cada 500ms)
    const handleUserActivity = () => {
      // Si ya hay un throttle activo, ignorar
      if (throttleTimeoutRef.current) {
        return;
      }

      // Marcar throttle activo
      throttleTimeoutRef.current = setTimeout(() => {
        throttleTimeoutRef.current = null;
      }, 500); // 500ms de throttle

      // Resetear timer
      resetTimer();
    };

    // Listeners de actividad del usuario
    const handleMouseMove = () => handleUserActivity();
    const handleKeyDown = () => handleUserActivity();

    // Agregar listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    // Iniciar timer inicial
    resetTimer();

    // Cleanup al desmontar o cambiar dependencias
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      
      // Limpiar TODOS los timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      
      if (auditTimerRef.current) {
        clearInterval(auditTimerRef.current);
        auditTimerRef.current = null;
      }
      
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, currentUser, handleInactivityLogout]);

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
      // Limpiar timer de inactividad
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Llamar logout() del servicio
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
