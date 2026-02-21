/**
 * SERVICIO DE REGISTROS DE TIEMPO
 * 
 * CRUD para la tabla 'time_records' de Supabase.
 * Implementa soft delete, ordenamiento DESC (Requisito 3) y validaciones.
 */

import { supabase } from '../../../config/supabase.config.js';
import { validateTimeRecordData, validateTimeFormat } from '../../../utils/validation.util.js';
import { getTimeRecords, saveTimeRecords } from '../../../utils/localStorage.util.js';
import { compareRecordsByTime } from '../../../utils/dateTime.util.js';
import { LOG_ACTIONS } from '../../../utils/constants.util.js';
import { logActivity } from './activityLog.service.js';
import { logger } from '../../../utils/logger.util.js';
import { withSupabaseQuery } from '../../../utils/supabaseWrapper.util.js';

/**
 * REQUISITO 3: Obtiene todos los registros ordenados por timestamp DESC
 * @returns {Object} { success, data, error? }
 */
export const getAllTimeRecords = async () => {
  const result = await withSupabaseQuery(
    () => supabase
      .from('time_records')
      .select('*')
      .is('deleted_at', null)
      .order('timestamp', { ascending: false }),
    []
  );

  if (!result.success) {
    const localRecords = getTimeRecords();
    localRecords.sort((a, b) => compareRecordsByTime(b, a));
    return {
      success: true,
      data: localRecords,
      source: 'localStorage'
    };
  }

  const data = result.data || [];
  saveTimeRecords(data);
  return {
    success: true,
    data,
    source: 'supabase'
  };
};

/**
 * Obtiene registros de un empleado específico
 * @param {number} employeeId - ID del empleado
 * @param {number} limit - Límite de registros (opcional)
 * @returns {Object} { success, data, error? }
 */
export const getRecordsByEmployeeId = async (employeeId, limit = null) => {
  try {
    let query = supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .is('deleted_at', null)
      .order('timestamp', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      logger.warn('Usando localStorage');
      const localRecords = getTimeRecords()
        .filter(r => r.employeeId === employeeId)
        .sort((a, b) => compareRecordsByTime(b, a));

      return {
        success: true,
        data: limit ? localRecords.slice(0, limit) : localRecords
      };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    logger.error('Error obteniendo registros del empleado:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene registros en un rango de fechas
 * @param {string} startDate - Fecha inicio (formato ISO)
 * @param {string} endDate - Fecha fin (formato ISO)
 * @returns {Object} { success, data, error? }
 */
export const getRecordsByDateRange = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .is('deleted_at', null)
      .order('timestamp', { ascending: false });

    if (error) {
      logger.warn('Usando localStorage');
      const localRecords = getTimeRecords()
        .filter(r => {
          const recordDate = new Date(r.timestamp);
          return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        })
        .sort((a, b) => compareRecordsByTime(b, a));

      return { success: true, data: localRecords };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    logger.error('Error obteniendo registros por rango:', error);
    return { success: false, error: error.message };
  }
};

/**
 * REQUISITO 1: Obtiene el último registro de un empleado
 * Usado para determinar si la próxima marcación es ENTRADA o SALIDA
 * 
 * @param {number} employeeId - ID del empleado
 * @returns {Object} { success, data?, error? }
 */
export const getLastRecordByEmployee = async (employeeId) => {
  try {
    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .is('deleted_at', null)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No hay registros
        return { success: true, data: null };
      }

      logger.warn('Usando localStorage');
      const localRecords = getTimeRecords()
        .filter(r => r.employeeId === employeeId)
        .sort((a, b) => compareRecordsByTime(b, a));

      return {
        success: true,
        data: localRecords.length > 0 ? localRecords[0] : null
      };
    }

    return { success: true, data };

  } catch (error) {
    logger.error('Error obteniendo último registro:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Crea un nuevo registro de tiempo
 * @param {Object} recordData - Datos del registro
 * @param {Object} currentUser - Usuario que crea el registro (opcional)
 * @returns {Object} { success, data?, error? }
 */
export const createTimeRecord = async (recordData, currentUser = null) => {
  try {
    // Validar datos
    const validation = validateTimeRecordData(recordData);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Preparar datos para inserción
    const newRecord = {
      employee_id: recordData.employeeId,
      employee_name: recordData.employeeName,
      fecha: recordData.fecha,
      dia: recordData.dia,
      tipo: recordData.tipo,
      hora: recordData.hora,
      timestamp: recordData.timestamp || new Date().toISOString()
    };

    // Intentar guardar en Supabase
    let savedRecord = null;

    try {
      const { data, error } = await supabase
        .from('time_records')
        .insert([newRecord])
        .select()
        .single();

      if (error) throw error;
      savedRecord = data;
    } catch (supabaseError) {
      logger.warn('Error en Supabase, generando ID local:', supabaseError.message);
      savedRecord = {
        ...newRecord,
        id: Date.now()
      };
    }

    // Guardar en localStorage
    const records = getTimeRecords();
    records.push(savedRecord);
    saveTimeRecords(records);

    // Registrar en log
    const logAction = recordData.tipo === 'ENTRADA' 
      ? LOG_ACTIONS.REGISTRO_ENTRADA 
      : LOG_ACTIONS.REGISTRO_SALIDA;

    await logActivity(
      logAction,
      `Registro de ${recordData.tipo.toLowerCase()} a las ${recordData.hora}`,
      recordData.employeeName
    );

    return {
      success: true,
      data: savedRecord
    };

  } catch (error) {
    logger.error('Error creando registro:', error);
    return {
      success: false,
      error: 'Error al crear el registro'
    };
  }
};

/**
 * REQUISITO 4: Actualiza un registro de tiempo
 * Requiere motivo obligatorio para edición
 * 
 * @param {number} id - ID del registro
 * @param {Object} updates - Datos a actualizar
 * @param {string} reason - Motivo de la edición (obligatorio)
 * @param {Object} currentUser - Usuario que edita
 * @returns {Object} { success, data?, error? }
 */
export const updateTimeRecord = async (id, updates, reason, currentUser) => {
  try {
    // Validar motivo obligatorio
    if (!reason || reason.trim().length === 0) {
      return {
        success: false,
        error: 'Debe especificar el motivo de la edición'
      };
    }

    // Validar formato de hora si se proporciona
    if (updates.hora && !validateTimeFormat(updates.hora)) {
      return {
        success: false,
        error: 'Formato de hora inválido. Use HH:MM:SS'
      };
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Obtener registro original
    const records = getTimeRecords();
    const originalRecord = records.find(r => r.id === id);

    if (!originalRecord) {
      return { success: false, error: 'Registro no encontrado' };
    }

    // Actualizar en Supabase
    try {
      const { error } = await supabase
        .from('time_records')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    } catch (supabaseError) {
      logger.warn('Error actualizando en Supabase:', supabaseError.message);
    }

    // Actualizar en localStorage
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      records[index] = { ...records[index], ...updateData };
      saveTimeRecords(records);

      // Registrar en log con detalle
      const logDetails = `Registro editado: ${originalRecord.employeeName} - ${originalRecord.tipo} - ` +
        `Hora anterior: ${originalRecord.hora}, Nueva: ${updates.hora || originalRecord.hora} - ` +
        `Motivo: ${reason}`;

      await logActivity(
        LOG_ACTIONS.RECORD_EDITED,
        logDetails,
        currentUser?.name || 'Sistema'
      );

      return { success: true, data: records[index] };
    }

    return { success: false, error: 'Registro no encontrado' };

  } catch (error) {
    logger.error('Error actualizando registro:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Soft delete de un registro
 * @param {number} id - ID del registro
 * @param {Object} currentUser - Usuario que elimina
 * @returns {Object} { success, error? }
 */
export const deleteTimeRecord = async (id, currentUser) => {
  try {
    const deletedAt = new Date().toISOString();

    // Soft delete en Supabase
    try {
      const { error } = await supabase
        .from('time_records')
        .update({ deleted_at: deletedAt })
        .eq('id', id);

      if (error) throw error;
    } catch (supabaseError) {
      logger.warn('Error en Supabase:', supabaseError.message);
    }

    // Remover de localStorage
    const records = getTimeRecords();
    const filtered = records.filter(r => r.id !== id);
    saveTimeRecords(filtered);

    return { success: true };

  } catch (error) {
    logger.error('Error eliminando registro:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Agrega o actualiza observaciones en un registro
 * @param {number} recordId - ID del registro
 * @param {string} observation - Observación a agregar
 * @param {Object} currentUser - Usuario que agrega la observación
 * @returns {Object} { success, error? }
 */
export const addObservation = async (recordId, observation, currentUser) => {
  try {
    // Actualizar en Supabase
    try {
      const { error } = await supabase
        .from('time_records')
        .update({ observaciones: observation })
        .eq('id', recordId);

      if (error) throw error;
    } catch (supabaseError) {
      logger.warn('Error en Supabase:', supabaseError.message);
    }

    // Actualizar en localStorage
    const records = getTimeRecords();
    const record = records.find(r => r.id === recordId);

    if (record) {
      record.observaciones = observation;
      saveTimeRecords(records);

      await logActivity(
        LOG_ACTIONS.COMMENT_ADDED,
        `Comentario en registro de ${record.employeeName}`,
        currentUser?.name || 'Sistema'
      );

      return { success: true };
    }

    return { success: false, error: 'Registro no encontrado' };

  } catch (error) {
    logger.error('Error agregando observación:', error);
    return { success: false, error: error.message };
  }
};
