/**
 * SERVICIO DE PAREJAS ENTRADA/SALIDA
 * 
 * Implementa requisitos del documento "Estructura y normas de SCHEDULE":
 * - Parejas ENTRADA/SALIDA en misma fila
 * - Últimos 10 registros ordenados DESC
 * - Tiempo de almuerzo editable una sola vez
 * - Cálculo automático de horas con fórmula Excel
 */

import { supabase } from '@/config/supabase.config.js';
import { RECORD_TYPES } from '@/utils/constants.util.js';

/**
 * Obtiene los últimos 10 PARES de registros ENTRADA/SALIDA de un empleado
 * 
 * @param {number} employeeId - ID del empleado
 * @returns {Object} { success, pairs?, error? }
 */
export const getEmployeePairs = async (employeeId) => {
  try {
    const { data: records, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .is('deleted_at', null)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error obteniendo registros:', error);
      return { success: false, error: 'Error al obtener registros' };
    }

    if (!records || records.length === 0) {
      return { success: true, pairs: [] };
    }

    const pairsByDate = {};
    
    records.forEach(record => {
      const fecha = record.fecha;
      
      if (!pairsByDate[fecha]) {
        pairsByDate[fecha] = {
          fecha: fecha,
          dia: record.dia,
          entrada: null,
          salida: null,
          observaciones: record.observaciones || '',
          tiempo_almuerzo: record.tiempo_almuerzo || '02:00',
          tiempo_almuerzo_editado: record.tiempo_almuerzo_editado || false,
          licencia_remunerada: record.licencia_remunerada || false
        };
      }

      if (record.tipo === RECORD_TYPES.ENTRADA) {
        pairsByDate[fecha].entrada = {
          id: record.id,
          hora: record.hora,
          timestamp: record.timestamp
        };
      } else if (record.tipo === RECORD_TYPES.SALIDA) {
        pairsByDate[fecha].salida = {
          id: record.id,
          hora: record.hora,
          timestamp: record.timestamp
        };
      }
    });

    let pairs = Object.values(pairsByDate)
      .sort((a, b) => {
        const dateA = a.fecha.split('/').reverse().join('');
        const dateB = b.fecha.split('/').reverse().join('');
        return dateB.localeCompare(dateA);
      });

    pairs = pairs.map(pair => {
      if (pair.entrada && pair.salida) {
        const calculos = calcularHorasTrabajadas(
          pair.entrada.hora,
          pair.salida.hora,
          pair.tiempo_almuerzo
        );
        
        return {
          ...pair,
          total_horas: calculos.total_horas,
          total_horas_decimal: calculos.total_horas_decimal
        };
      }
      
      return pair;
    });

    pairs = pairs.slice(0, 10);

    return { success: true, pairs };

  } catch (error) {
    console.error('Error en getEmployeePairs:', error);
    return { success: false, error: 'Error al procesar pares' };
  }
};

/**
 * Calcula el total decimal sumando las horas, los minutos divididos por 60 y los segundos divididos por 3600. Ejemplo: 08:30:00 debe dar 8.50
 * 
 * @param {string} horaEntrada - Formato "HH:MM:SS"
 * @param {string} horaSalida - Formato "HH:MM:SS"
 * @param {string} tiempoAlmuerzo - Formato "HH:MM"
 * @returns {Object} { total_horas, total_horas_decimal }
 */
const calcularHorasTrabajadas = (horaEntrada, horaSalida, tiempoAlmuerzo = '02:00') => {
  try {
    const parseTime = (timeStr) => {
      const [hours, minutes, seconds = '00'] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      date.setSeconds(parseInt(seconds, 10));
      return date;
    };

    const entrada = parseTime(horaEntrada);
    const salida = parseTime(horaSalida);
    
    let diffMs = salida - entrada;
    
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const [almuerzoHoras, almuerzoMinutos] = tiempoAlmuerzo.split(':');
    const almuerzoMs = (parseInt(almuerzoHoras, 10) * 60 + parseInt(almuerzoMinutos, 10)) * 60 * 1000;
    
    diffMs -= almuerzoMs;

    if (diffMs < 0) {
      diffMs = 0;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    const total_horas = 
      String(hours).padStart(2, '0') + ':' +
      String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0');

    const total_horas_decimal = hours + (minutes / 60) + (seconds / 3600);

    return {
      total_horas,
      total_horas_decimal: parseFloat(total_horas_decimal.toFixed(2))
    };

  } catch (error) {
    console.error('Error calculando horas:', error);
    return {
      total_horas: '00:00:00',
      total_horas_decimal: 0.00
    };
  }
};

/**
 * Actualiza el tiempo de almuerzo (EDITABLE UNA SOLA VEZ)
 * 
 * @param {number} recordId - ID del registro ENTRADA
 * @param {string} nuevoTiempo - Formato "HH:MM"
 * @returns {Object} { success, error? }
 */
export const updateTiempoAlmuerzo = async (recordId, nuevoTiempo) => {
  try {
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(nuevoTiempo)) {
      return { success: false, error: 'Formato inválido. Use HH:MM' };
    }

    const [hours, minutes] = nuevoTiempo.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    if (totalMinutes < 0 || totalMinutes > 120) {
      return { 
        success: false, 
        error: 'El tiempo debe estar entre 00:00 y 02:00' 
      };
    }

    const { data: record, error: fetchError } = await supabase
      .from('time_records')
      .select('tiempo_almuerzo_editado, tipo')
      .eq('id', recordId)
      .single();

    if (fetchError) {
      return { success: false, error: 'Registro no encontrado' };
    }

    if (record.tiempo_almuerzo_editado) {
      return { 
        success: false, 
        error: 'El tiempo de almuerzo ya fue editado anteriormente' 
      };
    }

    if (record.tipo !== RECORD_TYPES.ENTRADA) {
      return { 
        success: false, 
        error: 'Solo se puede editar en registros de ENTRADA' 
      };
    }

    const { error: updateError } = await supabase
      .from('time_records')
      .update({
        tiempo_almuerzo: nuevoTiempo,
        tiempo_almuerzo_editado: true
      })
      .eq('id', recordId);

    if (updateError) {
      return { 
        success: false, 
        error: 'Error al actualizar tiempo de almuerzo' 
      };
    }

    return { 
      success: true, 
      message: 'Tiempo de almuerzo actualizado correctamente' 
    };

  } catch (error) {
    console.error('Error en updateTiempoAlmuerzo:', error);
    return { success: false, error: 'Error al procesar solicitud' };
  }
};
