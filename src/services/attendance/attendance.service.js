/**
 * SERVICIO DE ASISTENCIA V3.0
 * 
 * Maneja el registro de marcaciones (ENTRADA/SALIDA) con validación en tiempo real.
 * RIGOR ABSOLUTO: Sin mocks, sin simulaciones, consultas directas a Supabase.
 * 
 * FLUJO CRÍTICO:
 * 1. Verificar última marcación ANTES de insertar
 * 2. Validar que la acción sea la esperada (ENTRADA después de SALIDA, etc.)
 * 3. Registrar con fecha/hora de Colombia
 * 4. Registrar en activity_log para auditoría
 */

import { differenceInDays, parseISO } from 'date-fns';
import { supabase } from '@/config/supabase.config';
import { checkLastRecord } from '@/modules/auth/services/auth.service';
import { RECORD_TYPES, LOG_ACTIONS } from '@/utils/constants.util';
import { getCurrentDateTimeColombia } from '@/utils/dateTime.util';
import { logActivity } from '@/modules/schedule/services/activityLog.service';

/**
 * Registra marcación de asistencia (ENTRADA o SALIDA)
 * 
 * VALIDACIÓN CRÍTICA: Consulta última marcación ANTES de insertar
 * para evitar duplicidad (dos ENTRADAS sin SALIDA)
 * 
 * @param {Object} employee - Usuario actual { id, name, cedula, role }
 * @param {string} tipo - 'ENTRADA' o 'SALIDA'
 * @returns {Object} { success, data?, error?, nextAction }
 */
export const recordAttendance = async (employee, tipo) => {
  try {
    // 1. Validar parámetros
    if (!employee || !employee.id) {
      return {
        success: false,
        error: 'Empleado no válido'
      };
    }

    if (tipo !== RECORD_TYPES.ENTRADA && tipo !== RECORD_TYPES.SALIDA) {
      return {
        success: false,
        error: 'Tipo de marcación no válido'
      };
    }

    // 2. VALIDACIÓN CRÍTICA: Verificar última marcación
    const lastRecordCheck = await checkLastRecord(employee.id);
    
    if (!lastRecordCheck.success) {
      return {
        success: false,
        error: 'Error verificando última marcación'
      };
    }

    // 3. Validar que la marcación sea la correcta
    if (lastRecordCheck.nextAction !== tipo) {
      return {
        success: false,
        error: `No puedes marcar ${tipo}. Debes marcar ${lastRecordCheck.nextAction}`,
        expectedAction: lastRecordCheck.nextAction
      };
    }

    // 3.1 NUEVA VALIDACIÓN: Si marca SALIDA, verificar días desde ENTRADA
    if (tipo === RECORD_TYPES.SALIDA) {
      const { data: lastEntrada } = await supabase
        .from('time_records')
        .select('fecha, timestamp')
        .eq('employee_id', employee.id)
        .eq('tipo', RECORD_TYPES.ENTRADA)
        .is('deleted_at', null)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastEntrada?.timestamp) {
        const daysDiff = differenceInDays(
          new Date(),
          parseISO(lastEntrada.timestamp)
        );

        if (daysDiff > 1) {
          return {
            success: false,
            error: `⚠️ Última ENTRADA fue hace ${daysDiff} días (${lastEntrada.fecha}). Por favor contacte administrador para corregir.`,
            requiresAdmin: true
          };
        }
      }
    }

    // 4. Obtener fecha/hora actual de Colombia
    const dateTime = getCurrentDateTimeColombia();

    // 5. Preparar datos para insertar
    const recordData = {
      employee_id: employee.id,
      employee_name: employee.name,
      fecha: dateTime.fecha,      // "DD/MM/YYYY"
      dia: dateTime.dia,          // "lunes", "martes", etc.
      tipo: tipo,                 // "ENTRADA" o "SALIDA"
      hora: dateTime.hora,        // "HH:MM:SS"
      timestamp: new Date().toISOString(),
      tiempo_almuerzo: tipo === RECORD_TYPES.ENTRADA ? '02:00' : null,
      tiempo_almuerzo_editado: false,
      licencia_remunerada: false,
      observaciones: ''
    };

    // 6. Insertar en Supabase
    const { data, error } = await supabase
      .from('time_records')
      .insert([recordData])
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: 'Error al registrar marcación en la base de datos'
      };
    }

    // 6.1 Si marcó SALIDA, bloquear almuerzo de la ENTRADA asociada
    if (tipo === RECORD_TYPES.SALIDA) {
      const { data: lastEntrada } = await supabase
        .from('time_records')
        .select('id')
        .eq('employee_id', employee.id)
        .eq('tipo', RECORD_TYPES.ENTRADA)
        .is('deleted_at', null)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastEntrada) {
        await supabase
          .from('time_records')
          .update({ tiempo_almuerzo_editado: true })
          .eq('id', lastEntrada.id);
      }
    }

    // 7. Registrar en activity_log
    const logAction = tipo === RECORD_TYPES.ENTRADA 
      ? LOG_ACTIONS.REGISTRO_ENTRADA 
      : LOG_ACTIONS.REGISTRO_SALIDA;
    
    await logActivity(logAction, `Marcación ${tipo} registrada`, employee.name);

    // 8. Calcular próxima acción
    const nextAction = tipo === RECORD_TYPES.ENTRADA 
      ? RECORD_TYPES.SALIDA 
      : RECORD_TYPES.ENTRADA;

    return {
      success: true,
      data,
      nextAction,
      message: `${tipo} registrada correctamente`
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error al procesar la marcación'
    };
  }
};

/**
 * Obtiene registros del día actual de un empleado
 * 
 * @param {number} employeeId - ID del empleado
 * @returns {Object} { success, data?, error? }
 */
export const getTodayRecords = async (employeeId) => {
  try {
    const dateTime = getCurrentDateTimeColombia();
    const today = dateTime.fecha; // "DD/MM/YYYY"

    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('fecha', today)
      .is('deleted_at', null)
      .order('timestamp', { ascending: false });

    if (error) {
      return {
        success: false,
        error: 'Error al obtener registros'
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error al procesar solicitud'
    };
  }
};

/**
 * Obtiene todos los registros recientes (últimos 50)
 * Para dashboard de Admin/Master
 * 
 * @returns {Object} { success, data?, error? }
 */
export const getAllRecordsRealtime = async () => {
  try {
    const { data, error } = await supabase
      .from('time_records')
      .select('*')
      .is('deleted_at', null)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      return {
        success: false,
        error: 'Error al obtener registros'
      };
    }

    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error al procesar solicitud'
    };
  }
};

/**
 * Suscripción a cambios en tiempo real de time_records
 * 
 * @param {Function} callback - Función a ejecutar cuando hay cambios
 * @returns {Object} Subscription object (para cleanup)
 */
export const subscribeToRecords = (callback) => {
  const subscription = supabase
    .channel('time_records_changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'time_records'
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
};
