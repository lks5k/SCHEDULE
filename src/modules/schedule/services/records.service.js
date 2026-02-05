/**
 * SERVICIO DE MARCACIONES
 * 
 * Lógica de negocio para registrar entradas/salidas de empleados.
 * Implementa Requisito 1 (validación última marcación) y Requisito 2 (visualización).
 */

import { checkLastRecord } from '../../auth/services/auth.service.js';
import { createTimeRecord, getRecordsByEmployeeId } from './timeRecords.service.js';
import { getCurrentDateCO, getCurrentTimeCO, getDayOfWeekCO, calculateHoursBetweenRecords } from '../../../utils/dateTime.util.js';
import { RECORD_TYPES } from '../../../utils/constants.util.js';

/**
 * REQUISITO 1 y 2: Registra entrada/salida de un empleado
 * - Determina automáticamente si es ENTRADA o SALIDA basándose en el último registro
 * - Crea el registro en la base de datos
 * 
 * @param {number} employeeId - ID del empleado
 * @param {string} employeeName - Nombre del empleado
 * @param {string} device - Dispositivo desde el que se registra (opcional)
 * @returns {Object} { success, data?, nextAction?, error? }
 */
export const recordAttendance = async (employeeId, employeeName, device = null) => {
  try {
    // REQUISITO 1: Verificar último registro para determinar tipo
    const lastRecordCheck = await checkLastRecord(employeeId);

    if (!lastRecordCheck.success) {
      return {
        success: false,
        error: 'Error al verificar el último registro'
      };
    }

    const actionType = lastRecordCheck.nextAction; // 'ENTRADA' o 'SALIDA'

    // Preparar datos del registro
    const now = new Date();
    const recordData = {
      employeeId,
      employeeName,
      fecha: getCurrentDateCO(),
      dia: getDayOfWeekCO(now),
      tipo: actionType,
      hora: getCurrentTimeCO(),
      timestamp: now.toISOString(),
      observaciones: '',
      dispositivo: device || navigator?.platform || 'Unknown'
    };

    // Crear el registro
    const result = await createTimeRecord(recordData);

    if (!result.success) {
      return result;
    }

    // Determinar la próxima acción (opuesto a la actual)
    const nextAction = actionType === RECORD_TYPES.ENTRADA 
      ? RECORD_TYPES.SALIDA 
      : RECORD_TYPES.ENTRADA;

    return {
      success: true,
      data: result.data,
      currentAction: actionType,
      nextAction
    };

  } catch (error) {
    console.error('Error registrando asistencia:', error);
    return {
      success: false,
      error: 'Error al registrar la asistencia'
    };
  }
};

/**
 * REQUISITO 2: Obtiene los registros recientes de un empleado para visualización
 * Muestra últimos N días (por defecto 2: hoy y ayer)
 * 
 * @param {number} employeeId - ID del empleado
 * @param {number} days - Cantidad de días hacia atrás (default: 2)
 * @returns {Object} { success, data, error? }
 */
export const getEmployeeRecentRecords = async (employeeId, days = 2) => {
  try {
    // Obtener todos los registros del empleado
    const result = await getRecordsByEmployeeId(employeeId);

    if (!result.success) {
      return result;
    }

    const records = result.data;

    // Filtrar por días recientes
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= cutoffDate;
    });

    // Agrupar por fecha
    const recordsByDate = {};

    recentRecords.forEach(record => {
      if (!recordsByDate[record.fecha]) {
        recordsByDate[record.fecha] = [];
      }
      recordsByDate[record.fecha].push(record);
    });

    // Formatear para visualización
    const formattedData = [];

    Object.keys(recordsByDate).sort().reverse().forEach(fecha => {
      const dayRecords = recordsByDate[fecha].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Emparejar ENTRADA-SALIDA
      for (let i = 0; i < dayRecords.length; i += 2) {
        const entrada = dayRecords[i]?.tipo === 'ENTRADA' ? dayRecords[i] : null;
        const salida = dayRecords[i + 1]?.tipo === 'SALIDA' ? dayRecords[i + 1] : null;

        formattedData.push({
          fecha,
          entrada: entrada?.hora || '--:--:--',
          salida: salida?.hora || '--:--:--',
          horas: (entrada && salida) ? calculateHoursBetweenRecords(entrada, salida) : '00:00:00'
        });
      }
    });

    return {
      success: true,
      data: formattedData
    };

  } catch (error) {
    console.error('Error obteniendo registros recientes:', error);
    return {
      success: false,
      error: 'Error al obtener los registros'
    };
  }
};

/**
 * Calcula las horas trabajadas de un empleado en un período
 * @param {number} employeeId - ID del empleado
 * @param {string} startDate - Fecha inicio (ISO)
 * @param {string} endDate - Fecha fin (ISO)
 * @returns {Object} { success, totalHours?, data?, error? }
 */
export const calculateWorkedHours = async (employeeId, startDate, endDate) => {
  try {
    const result = await getRecordsByEmployeeId(employeeId);

    if (!result.success) {
      return result;
    }

    const records = result.data;

    // Filtrar por rango de fechas
    const filteredRecords = records.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
    });

    // Agrupar por fecha y calcular horas
    const recordsByDate = {};

    filteredRecords.forEach(record => {
      if (!recordsByDate[record.fecha]) {
        recordsByDate[record.fecha] = [];
      }
      recordsByDate[record.fecha].push(record);
    });

    let totalMinutes = 0;
    const dailyData = [];

    Object.keys(recordsByDate).sort().forEach(fecha => {
      const dayRecords = recordsByDate[fecha].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );

      let dayMinutes = 0;

      for (let i = 0; i < dayRecords.length; i += 2) {
        const entrada = dayRecords[i]?.tipo === 'ENTRADA' ? dayRecords[i] : null;
        const salida = dayRecords[i + 1]?.tipo === 'SALIDA' ? dayRecords[i + 1] : null;

        if (entrada && salida) {
          const entradaTime = new Date(entrada.timestamp).getTime();
          const salidaTime = new Date(salida.timestamp).getTime();
          const minutesWorked = Math.floor((salidaTime - entradaTime) / 60000);
          
          dayMinutes += minutesWorked;
        }
      }

      totalMinutes += dayMinutes;

      dailyData.push({
        fecha,
        minutesWorked: dayMinutes,
        hoursFormatted: formatMinutesToHours(dayMinutes)
      });
    });

    return {
      success: true,
      totalMinutes,
      totalHours: formatMinutesToHours(totalMinutes),
      dailyData
    };

  } catch (error) {
    console.error('Error calculando horas trabajadas:', error);
    return {
      success: false,
      error: 'Error al calcular las horas'
    };
  }
};

/**
 * Formatea minutos a formato HH:MM:SS
 * @param {number} minutes - Minutos
 * @returns {string}
 */
const formatMinutesToHours = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const secs = 0; // No contamos segundos en totales

  const pad = (n) => String(n).padStart(2, '0');

  return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
};

/**
 * Obtiene estadísticas de asistencia de un empleado
 * @param {number} employeeId - ID del empleado
 * @param {number} days - Días hacia atrás (default: 30)
 * @returns {Object} { success, stats?, error? }
 */
export const getAttendanceStats = async (employeeId, days = 30) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const hoursResult = await calculateWorkedHours(
      employeeId,
      startDate.toISOString(),
      endDate.toISOString()
    );

    if (!hoursResult.success) {
      return hoursResult;
    }

    const recordsResult = await getRecordsByEmployeeId(employeeId);

    if (!recordsResult.success) {
      return recordsResult;
    }

    const recentRecords = recordsResult.data.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= startDate;
    });

    const entradas = recentRecords.filter(r => r.tipo === RECORD_TYPES.ENTRADA).length;
    const salidas = recentRecords.filter(r => r.tipo === RECORD_TYPES.SALIDA).length;
    const daysWorked = new Set(recentRecords.map(r => r.fecha)).size;

    return {
      success: true,
      stats: {
        daysWorked,
        totalRecords: recentRecords.length,
        entradas,
        salidas,
        totalHours: hoursResult.totalHours,
        averageHoursPerDay: daysWorked > 0 
          ? formatMinutesToHours(Math.floor(hoursResult.totalMinutes / daysWorked))
          : '00:00:00'
      }
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      success: false,
      error: 'Error al obtener estadísticas'
    };
  }
};
