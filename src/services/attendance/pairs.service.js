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

    const pairsList = [];
    let currentPair = null;

    records.forEach(record => {
      if (record.tipo === RECORD_TYPES.ENTRADA) {
        if (currentPair) {
          pairsList.push(currentPair);
        }
        currentPair = {
          fecha: record.fecha,
          dia: record.dia,
          entrada: {
            id: record.id,
            hora: record.hora,
            timestamp: record.timestamp
          },
          salida: null,
          observaciones: record.observaciones || '',
          tiempo_almuerzo: record.tiempo_almuerzo || '02:00',
          tiempo_almuerzo_editado: record.tiempo_almuerzo_editado || false,
          licencia_remunerada: record.licencia_remunerada || false
        };
      } else if (record.tipo === RECORD_TYPES.SALIDA && currentPair) {
        currentPair.salida = {
          id: record.id,
          hora: record.hora,
          timestamp: record.timestamp
        };
        pairsList.push(currentPair);
        currentPair = null;
      }
    });

    if (currentPair) {
      pairsList.push(currentPair);
    }

    let pairs = pairsList.sort((a, b) => {
      const tsA = a.entrada?.timestamp || '';
      const tsB = b.entrada?.timestamp || '';
      return tsB.localeCompare(tsA);
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
 * Calcula el total de horas trabajadas con formato HH:MM
 * 
 * @param {string} horaEntrada - Formato "HH:MM" o "HH:MM:SS"
 * @param {string} horaSalida - Formato "HH:MM" o "HH:MM:SS"
 * @param {string} tiempoAlmuerzo - Formato "HH:MM"
 * @returns {Object} { total_horas, total_horas_decimal }
 */
const calcularHorasTrabajadas = (horaEntrada, horaSalida, tiempoAlmuerzo = '02:00') => {
  try {
    const parseTime = (timeStr) => {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      return hours * 60 + minutes;
    };

    const entradaMin = parseTime(horaEntrada);
    const salidaMin = parseTime(horaSalida);
    const almuerzoMin = parseTime(tiempoAlmuerzo);
    
    let diffMin = salidaMin - entradaMin;
    
    if (diffMin < 0) {
      diffMin += 24 * 60;
    }

    diffMin -= almuerzoMin;

    if (diffMin < 0) {
      diffMin = 0;
    }

    const hours = Math.floor(diffMin / 60);
    const minutes = diffMin % 60;

    const total_horas = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    const total_horas_decimal = hours + (minutes / 60);

    return {
      total_horas,
      total_horas_decimal: parseFloat(total_horas_decimal.toFixed(2))
    };

  } catch (error) {
    return {
      total_horas: '00:00',
      total_horas_decimal: 0.00
    };
  }
};

/**
 * Actualiza el tiempo de almuerzo (EDITABLE UNA SOLA VEZ)
 * 
 * @param {string} fecha - Fecha en formato DD/MM/YYYY
 * @param {number} employeeId - ID del empleado
 * @param {string} nuevoTiempo - Formato "HH:MM"
 * @returns {Object} { success, error? }
 */
export const updateTiempoAlmuerzo = async (fecha, employeeId, nuevoTiempo) => {
  try {
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(nuevoTiempo)) {
      return { success: false, error: 'Formato invalido. Use HH:MM' };
    }

    const [hours, minutes] = nuevoTiempo.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    if (totalMinutes < 0 || totalMinutes > 120) {
      return { 
        success: false, 
        error: 'Tiempo debe estar entre 00:00 y 02:00' 
      };
    }

    const { data: record, error: fetchError } = await supabase
      .from('time_records')
      .select('id, tiempo_almuerzo_editado')
      .eq('employee_id', employeeId)
      .eq('fecha', fecha)
      .eq('tipo', RECORD_TYPES.ENTRADA)
      .is('deleted_at', null)
      .single();

    if (fetchError) {
      return { success: false, error: 'Registro no encontrado' };
    }

    if (record.tiempo_almuerzo_editado) {
      return { 
        success: false, 
        error: 'Tiempo de almuerzo ya fue editado' 
      };
    }

    const { error: updateError } = await supabase
      .from('time_records')
      .update({
        tiempo_almuerzo: nuevoTiempo,
        tiempo_almuerzo_editado: true
      })
      .eq('id', record.id);

    if (updateError) {
      return { 
        success: false, 
        error: 'Error al actualizar' 
      };
    }

    return { 
      success: true, 
      message: 'Actualizado correctamente' 
    };

  } catch (error) {
    return { success: false, error: 'Error procesando' };
  }
};
