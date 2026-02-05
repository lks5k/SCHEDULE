/**
 * SERVICIO DE LOG DE ACTIVIDAD
 * 
 * Gestión de la tabla 'activity_log' para auditoría del sistema.
 * Registra todas las acciones importantes para trazabilidad.
 */

import { supabase } from '../../../config/supabase.config.js';
import { getActivityLog, saveActivityLog } from '../../../utils/localStorage.util.js';

/**
 * Registra una actividad en el log
 * @param {string} action - Acción realizada (usar constantes de LOG_ACTIONS)
 * @param {string} details - Detalles de la acción
 * @param {string} userName - Nombre del usuario que realizó la acción
 * @returns {Object} { success, error? }
 */
export const logActivity = async (action, details, userName = 'Sistema') => {
  try {
    const activity = {
      timestamp: new Date().toISOString(),
      user_name: userName,
      action,
      details,
      created_at: new Date().toISOString()
    };

    // Intentar guardar en Supabase
    try {
      const { error } = await supabase
        .from('activity_log')
        .insert([activity]);

      if (error) throw error;
    } catch (supabaseError) {
      console.warn('Error guardando en Supabase:', supabaseError.message);
    }

    // Guardar en localStorage
    const log = getActivityLog();
    
    // Agregar nueva actividad al inicio
    log.unshift({
      ...activity,
      id: Date.now()
    });

    // Limitar a últimas 500 entradas para no saturar memoria
    const limitedLog = log.slice(0, 500);
    saveActivityLog(limitedLog);

    return { success: true };

  } catch (error) {
    console.error('Error registrando actividad:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene el log de actividad ordenado por timestamp DESC
 * @param {number} limit - Límite de registros a obtener (default: 100)
 * @returns {Object} { success, data, error? }
 */
export const getActivityLogData = async (limit = 100) => {
  try {
    // Intentar desde Supabase
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Error consultando Supabase, usando localStorage:', error.message);
      const localLog = getActivityLog();
      return {
        success: true,
        data: localLog.slice(0, limit),
        source: 'localStorage'
      };
    }

    // Sincronizar con localStorage
    saveActivityLog(data || []);

    return {
      success: true,
      data: data || [],
      source: 'supabase'
    };

  } catch (error) {
    console.error('Error obteniendo log de actividad:', error);
    const localLog = getActivityLog();
    return {
      success: true,
      data: localLog.slice(0, limit),
      source: 'localStorage'
    };
  }
};

/**
 * Obtiene actividades de un usuario específico
 * @param {string} userName - Nombre del usuario
 * @param {number} limit - Límite de registros
 * @returns {Object} { success, data, error? }
 */
export const getActivityByUser = async (userName, limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_name', userName)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Usando localStorage');
      const localLog = getActivityLog()
        .filter(a => a.user === userName || a.user_name === userName);

      return {
        success: true,
        data: localLog.slice(0, limit)
      };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    console.error('Error obteniendo actividad por usuario:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene actividades en un rango de fechas
 * @param {string} startDate - Fecha inicio (ISO)
 * @param {string} endDate - Fecha fin (ISO)
 * @returns {Object} { success, data, error? }
 */
export const getActivityByDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false });

    if (error) {
      console.warn('Usando localStorage');
      const localLog = getActivityLog()
        .filter(a => {
          const activityDate = new Date(a.timestamp);
          return activityDate >= new Date(startDate) && activityDate <= new Date(endDate);
        });

      return { success: true, data: localLog };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    console.error('Error obteniendo actividad por rango:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Limpia el log de actividad más antiguo que X días
 * @param {number} days - Días de antigüedad
 * @returns {Object} { success, deletedCount?, error? }
 */
export const cleanOldLogs = async (days = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffISO = cutoffDate.toISOString();

    // Eliminar de Supabase
    try {
      const { error } = await supabase
        .from('activity_log')
        .delete()
        .lt('timestamp', cutoffISO);

      if (error) throw error;
    } catch (supabaseError) {
      console.warn('Error limpiando en Supabase:', supabaseError.message);
    }

    // Limpiar de localStorage
    const log = getActivityLog();
    const filtered = log.filter(a => new Date(a.timestamp) >= cutoffDate);
    const deletedCount = log.length - filtered.length;
    saveActivityLog(filtered);

    console.log(`✅ Se eliminaron ${deletedCount} registros antiguos del log`);

    return {
      success: true,
      deletedCount
    };

  } catch (error) {
    console.error('Error limpiando logs antiguos:', error);
    return { success: false, error: error.message };
  }
};
