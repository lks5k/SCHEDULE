/**
 * SERVICIO DE AUTENTICACIÓN V3.0
 * 
 * Implementa autenticación determinista consultando ÚNICAMENTE Supabase.
 * SIN datos hardcoded, SIN localStorage para validación.
 */

import { supabase } from '../../../config/supabase.config.js';
import { LOG_ACTIONS, MESSAGES } from '../../../utils/constants.util.js';
import { logActivity } from '../../schedule/services/activityLog.service.js';
import { logger } from '../../../utils/logger.util.js';

/**
 * Realiza el login de un usuario
 * Consulta ÚNICAMENTE la tabla employees en Supabase
 * 
 * @param {string} cedula - Cédula del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Object} { success, user?, error? }
 */
export const login = async (cedula, password) => {
  try {
    // Validar entrada
    if (!cedula || cedula.trim().length === 0) {
      return {
        success: false,
        error: 'La cédula es requerida'
      };
    }

    if (!password || password.trim().length === 0) {
      return {
        success: false,
        error: 'La contraseña es requerida'
      };
    }

    // Asegurar tipado como String para evitar error 406
    const trimmedCedula = String(cedula).trim();
    const trimmedPassword = String(password).trim();

    // Consultar empleado en Supabase por cédula
    // Usar maybeSingle() para evitar error PGRST116 cuando no existe el usuario
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('cedula', trimmedCedula)
      .is('deleted_at', null)
      .maybeSingle();

    // Si hay error en la consulta (problema de conexión o permisos RLS)
    if (error) {
      await logActivity(LOG_ACTIONS.LOGIN_FAILED, `Error de consulta para cédula: ${trimmedCedula}`);
      return {
        success: false,
        error: 'Error al conectar con el servidor. Verifique su conexión.'
      };
    }

    // Si no se encontró ningún usuario (data es null)
    if (!data) {
      await logActivity(LOG_ACTIONS.LOGIN_FAILED, `Intento de acceso fallido (cédula: ${trimmedCedula})`);
      return {
        success: false,
        error: 'Cédula o contraseña incorrecta'
      };
    }

    // Verificar si el usuario está bloqueado
    if (data.blocked === true) {
      await logActivity(
        LOG_ACTIONS.LOGIN_BLOCKED,
        `Intento de acceso de usuario bloqueado: ${data.name}`
      );
      return {
        success: false,
        error: MESSAGES.ERROR.USER_BLOCKED
      };
    }

    // Verificar contraseña
    if (data.password !== trimmedPassword) {
      await logActivity(LOG_ACTIONS.LOGIN_FAILED, `Contraseña incorrecta para cédula: ${trimmedCedula}`);
      return {
        success: false,
        error: 'Cédula o contraseña incorrecta'
      };
    }

    // Login exitoso
    await logActivity(LOG_ACTIONS.LOGIN, `Inicio de sesión exitoso (${data.role})`, data.name);

    return {
      success: true,
      user: {
        id: data.id,
        name: data.name,
        cedula: data.cedula,
        role: data.role,
        blocked: data.blocked
      }
    };

  } catch (error) {
    logger.error('Error en login:', error);
    return {
      success: false,
      error: 'Error al conectar con el servidor. Intente nuevamente.'
    };
  }
};

/**
 * Cierra la sesión de un usuario
 * @param {Object} user - Usuario actual
 * @returns {Object} { success }
 */
export const logout = async (user) => {
  try {
    if (user) {
      await logActivity(LOG_ACTIONS.LOGOUT, 'Cierre de sesión', user.name);
    }

    return { success: true };
  } catch (error) {
    logger.error('Error en logout:', error);
    return { success: false, error: error.message };
  }
};

/**
 * REQUISITO 1: Verifica el último registro de un empleado para determinar
 * si su próxima marcación debe ser ENTRADA o SALIDA
 * 
 * Lógica:
 * - Último registro ENTRADA → próximo debe ser SALIDA
 * - Último registro SALIDA → próximo debe ser ENTRADA
 * - Sin registros → próximo debe ser ENTRADA
 * 
 * @param {number} employeeId - ID del empleado
 * @returns {Object} { success, nextAction: 'ENTRADA' | 'SALIDA', lastRecord?, error? }
 */
export const checkLastRecord = async (employeeId) => {
  try {
    // Intentar obtener de Supabase primero
    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .is('deleted_at', null)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Si no hay registros, el próximo es ENTRADA
    if (!data || data.length === 0) {
      return {
        success: true,
        nextAction: 'ENTRADA',
        lastRecord: null
      };
    }

    const lastRecord = data[0];

    // Determinar próxima acción basada en el último registro
    const nextAction = lastRecord.tipo === 'ENTRADA' ? 'SALIDA' : 'ENTRADA';

    return {
      success: true,
      nextAction,
      lastRecord
    };

  } catch (error) {
    logger.error('Error verificando último registro:', error);
    return {
      success: false,
      error: 'Error verificando último registro'
    };
  }
};

/**
 * Logout automático por inactividad
 * @param {Object} user - Usuario actual
 * @returns {Object}
 */
export const autoLogout = async (user) => {
  try {
    if (user) {
      await logActivity(
        LOG_ACTIONS.AUTO_LOGOUT,
        'Cierre de sesión automático por inactividad',
        user.name
      );
    }

    return { success: true };
  } catch (error) {
    logger.error('Error en auto-logout:', error);
    return { success: false, error: error.message };
  }
};
