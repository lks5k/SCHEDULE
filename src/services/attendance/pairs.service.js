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
 * Algoritmo FIFO temporal: ordena por timestamp ASC y empareja secuencialmente
 * 
 * @param {number} employeeId - ID del empleado
 * @returns {Object} { success, pairs?, error? }
 */
export const getEmployeePairs = async (employeeId) => {
  try {
    // 1. Fetch time_records ordenados por timestamp ASC
    const { data: records, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .is('deleted_at', null)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error obteniendo registros:', error);
      return { success: false, error: 'Error al obtener registros' };
    }

    if (!records || records.length === 0) {
      return { success: true, pairs: [] };
    }

    const pairsList = [];
    let i = 0;

    // 2. Iterar con algoritmo FIFO
    while (i < records.length) {
      const current = records[i];

      if (current.tipo === RECORD_TYPES.ENTRADA) {
        // Buscar siguiente SALIDA
        let nextSalida = null;
        let nextIndex = -1;

        for (let j = i + 1; j < records.length; j++) {
          if (records[j].tipo === RECORD_TYPES.SALIDA) {
            nextSalida = records[j];
            nextIndex = j;
            break;
          }
        }

        // Crear par
        const pair = {
          fecha: convertirFechaAFormatoYYYYMMDD(current.fecha),
          dia: current.dia,
          entrada: {
            id: current.id,
            hora: formatearHoraSinSegundos(current.hora),
            timestamp: current.timestamp
          },
          salida: nextSalida ? {
            id: nextSalida.id,
            hora: formatearHoraSinSegundos(nextSalida.hora),
            timestamp: nextSalida.timestamp
          } : null,
          observaciones: current.observaciones || '',
          tiempo_almuerzo_minutos: current.tiempo_almuerzo || 120, // BD almacena en minutos (int4)
          tiempo_almuerzo: convertirMinutosAHHMM(current.tiempo_almuerzo || 120), // Solo para UI
          tiempo_almuerzo_editado: current.tiempo_almuerzo_editado || false,
          licencia_remunerada: current.licencia_remunerada || false
        };

        // 4. Cálculo de horas (FÓRMULA DECIMAL: minutos_totales / 60)
        if (pair.salida) {
          const calculos = calcularHorasTrabajadas(
            pair.entrada.hora,
            pair.salida.hora,
            pair.tiempo_almuerzo_minutos // Pasar minutos directamente
          );
          pair.total_horas = calculos.total_horas;
          pair.total_horas_decimal = calculos.total_horas_decimal;
          
          // Saltar al siguiente después de la SALIDA
          i = nextIndex + 1;
        } else {
          // Sin SALIDA, TotalHoras = 0
          pair.total_horas = '00:00';
          pair.total_horas_decimal = 0.00;
          i++;
        }

        pairsList.push(pair);

      } else if (current.tipo === RECORD_TYPES.SALIDA) {
        // 3. Validar: SALIDA sin ENTRADA previa
        const pair = {
          fecha: convertirFechaAFormatoYYYYMMDD(current.fecha),
          dia: current.dia,
          entrada: null,
          salida: {
            id: current.id,
            hora: formatearHoraSinSegundos(current.hora),
            timestamp: current.timestamp
          },
          observaciones: current.observaciones || '',
          tiempo_almuerzo_minutos: 120, // BD almacena en minutos (int4)
          tiempo_almuerzo: '02:00', // Solo para UI
          tiempo_almuerzo_editado: false,
          licencia_remunerada: false,
          total_horas: '00:00',
          total_horas_decimal: 0.00
        };

        pairsList.push(pair);
        i++;
      } else {
        i++;
      }
    }

    // Ordenar por timestamp DESC (más reciente primero)
    pairsList.sort((a, b) => {
      const tsA = a.entrada?.timestamp || a.salida?.timestamp || '';
      const tsB = b.entrada?.timestamp || b.salida?.timestamp || '';
      return tsB.localeCompare(tsA);
    });

    // Tomar últimos 10 pares
    const pairs = pairsList.slice(0, 10);

    return { success: true, pairs };

  } catch (error) {
    console.error('Error en getEmployeePairs:', error);
    return { success: false, error: 'Error al procesar pares' };
  }
};

/**
 * Convierte fecha DD/MM/YYYY a formato YYYY/MM/DD
 * 
 * @param {string} fecha - Formato "DD/MM/YYYY"
 * @returns {string} Formato "YYYY/MM/DD"
 */
const convertirFechaAFormatoYYYYMMDD = (fecha) => {
  try {
    if (!fecha) return '';
    const parts = fecha.split('/');
    if (parts.length !== 3) return fecha;
    
    const [dia, mes, anio] = parts;
    return `${anio}/${mes}/${dia}`;
  } catch (error) {
    return fecha;
  }
};

/**
 * Formatea hora eliminando segundos (HH:MM:SS -> HH:MM)
 * 
 * @param {string} hora - Formato "HH:MM:SS" o "HH:MM"
 * @returns {string} Formato "HH:MM"
 */
const formatearHoraSinSegundos = (hora) => {
  try {
    if (!hora) return '';
    const parts = hora.split(':');
    if (parts.length < 2) return hora;
    
    return `${parts[0]}:${parts[1]}`;
  } catch (error) {
    return hora;
  }
};

/**
 * Convierte minutos (int4 de BD) a formato HH:MM para UI
 * CAPA DE PRESENTACIÓN: Conversión solo para renderizado
 * 
 * @param {number} minutos - Minutos totales (int4)
 * @returns {string} Formato "HH:MM"
 */
const convertirMinutosAHHMM = (minutos) => {
  try {
    const hours = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  } catch (error) {
    return '00:00';
  }
};

/**
 * PROTOCOLO QUIRÚRGICO: FÓRMULA DECIMAL (MODELO_DATOS_MAESTRO.md)
 * Calcula el total de horas trabajadas aplicando: minutos_totales / 60
 * 
 * @param {string} horaEntrada - Formato "HH:MM"
 * @param {string} horaSalida - Formato "HH:MM"
 * @param {number} tiempoAlmuerzoMinutos - Minutos de almuerzo (int4 de BD)
 * @returns {Object} { total_horas, total_horas_decimal }
 */
const calcularHorasTrabajadas = (horaEntrada, horaSalida, tiempoAlmuerzoMinutos = 120) => {
  try {
    const parseTime = (timeStr) => {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      return hours * 60 + minutes;
    };

    const entradaMin = parseTime(horaEntrada);
    const salidaMin = parseTime(horaSalida);
    
    // Cálculo: (minutosSALIDA - minutosENTRADA) - minutosALMUERZO
    let diffMin = salidaMin - entradaMin;
    
    // Manejar caso de cruce de medianoche
    if (diffMin < 0) {
      diffMin += 24 * 60;
    }

    // Restar tiempo de almuerzo (ya viene en minutos desde BD)
    diffMin -= tiempoAlmuerzoMinutos;

    // No permitir valores negativos
    if (diffMin < 0) {
      diffMin = 0;
    }

    const hours = Math.floor(diffMin / 60);
    const minutes = diffMin % 60;

    // Formato HH:MM (sin segundos) - SOLO PARA UI
    const total_horas = String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    
    // FÓRMULA DECIMAL: minutos_totales / 60 (MODELO_DATOS_MAESTRO.md)
    const total_horas_decimal = diffMin / 60;

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
 * MODELO_DATOS_MAESTRO.md: almuerzo: int4 (almacenado siempre en minutos)
 * 
 * @param {number} entradaId - ID del registro tipo ENTRADA
 * @param {string} nuevoTiempo - Formato "HH:MM" (desde UI)
 * @returns {Object} { success, error? }
 */
export const updateTiempoAlmuerzo = async (entradaId, nuevoTiempo) => {
  try {
    // Validar formato HH:MM
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(nuevoTiempo)) {
      return { success: false, error: 'Formato invalido. Use HH:MM' };
    }

    // Convertir HH:MM a minutos (int4 para BD)
    const [hours, minutes] = nuevoTiempo.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    // Validar rango: máximo 2 horas (120 minutos)
    if (totalMinutes > 120) {
      return { 
        success: false, 
        error: 'Maximo 2 horas' 
      };
    }

    if (totalMinutes < 0) {
      return { 
        success: false, 
        error: 'Tiempo debe estar entre 00:00 y 02:00' 
      };
    }

    // Verificar que el registro existe y es tipo ENTRADA
    const { data: record, error: fetchError } = await supabase
      .from('time_records')
      .select('id, tipo, tiempo_almuerzo_editado')
      .eq('id', entradaId)
      .eq('tipo', RECORD_TYPES.ENTRADA)
      .is('deleted_at', null)
      .single();

    if (fetchError || !record) {
      return { success: false, error: 'Registro no encontrado' };
    }

    // Verificar si ya fue editado (bloqueado)
    if (record.tiempo_almuerzo_editado) {
      return { 
        success: false, 
        error: 'Tiempo de almuerzo ya fue editado' 
      };
    }

    // Actualizar usando el ID del registro ENTRADA
    // CRÍTICO: Guardar en minutos (int4) según MODELO_DATOS_MAESTRO.md
    const { error: updateError } = await supabase
      .from('time_records')
      .update({
        tiempo_almuerzo: totalMinutes, // Almacenar como int4 (minutos)
        tiempo_almuerzo_editado: true
      })
      .eq('id', entradaId);

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
    console.error('Error en updateTiempoAlmuerzo:', error);
    return { success: false, error: 'Error procesando solicitud' };
  }
};
