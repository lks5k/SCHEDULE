import { supabase } from '@/config/supabase.config';
import { RECORD_TYPES } from '@/utils/constants.util';
import { snakeToCamel } from '@/utils/caseConverter.util';

export const getEmployeePairs = async (employeeId) => {
  try {
    const { data: records, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .is('deleted_at', null)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    if (!records || records.length === 0) {
      return { success: true, pairs: [] };
    }

    const recordsCamel = snakeToCamel(records);
    const pairs = [];
    let i = 0;

    while (i < recordsCamel.length) {
      const current = recordsCamel[i];

      if (current.tipo === RECORD_TYPES.ENTRADA) {
        let nextSalida = null;

        for (let j = i + 1; j < recordsCamel.length; j++) {
          if (recordsCamel[j].tipo === RECORD_TYPES.SALIDA) {
            nextSalida = recordsCamel[j];
            i = j;
            break;
          }
        }

        const pair = {
          fecha: current.fecha,
          dia: current.dia,
          entrada: {
            id: current.id,
            hora: current.hora,
            timestamp: current.timestamp
          },
          salida: nextSalida ? {
            id: nextSalida.id,
            hora: nextSalida.hora,
            timestamp: nextSalida.timestamp
          } : null,
          observaciones: current.observaciones || '',
          tiempo_almuerzo: current.tiempoAlmuerzo || '02:00',
          tiempo_almuerzo_editado: current.tiempoAlmuerzoEditado || false,
          licencia_remunerada: current.licenciaRemunerada || false
        };

        if (pair.salida) {
          const calc = calcularHorasTrabajadas(
            pair.entrada.hora,
            pair.salida.hora,
            pair.tiempo_almuerzo
          );
          pair.total_horas = calc.total_horas;
          pair.total_horas_decimal = calc.total_horas_decimal;
        } else {
          pair.total_horas = null;
          pair.total_horas_decimal = null;
        }

        pairs.push(pair);
      }

      i++;
    }

  pairs.reverse();
  const limitedPairs = pairs.slice(0, 10);

  return { success: true, pairs: limitedPairs };

  } catch (error) {
    return { success: false, error: 'Error procesando parejas', pairs: [] };
  }
};

export const getAllEmployeePairs = async (employeeId) => {
  try {
    const { data: records, error } = await supabase
      .from('time_records')
      .select('*')
      .eq('employee_id', employeeId)
      .is('deleted_at', null)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    if (!records || records.length === 0) return { success: true, pairs: [] };

    const recordsCamel = snakeToCamel(records);
    const pairs = [];
    let i = 0;

    while (i < recordsCamel.length) {
      const current = recordsCamel[i];

      if (current.tipo === RECORD_TYPES.ENTRADA) {
        let nextSalida = null;

        for (let j = i + 1; j < recordsCamel.length; j++) {
          if (recordsCamel[j].tipo === RECORD_TYPES.SALIDA) {
            nextSalida = recordsCamel[j];
            i = j;
            break;
          }
        }

        const pair = {
          fecha: current.fecha,
          dia: current.dia,
          entrada: { id: current.id, hora: current.hora, timestamp: current.timestamp },
          salida: nextSalida
            ? { id: nextSalida.id, hora: nextSalida.hora, timestamp: nextSalida.timestamp }
            : null,
          observaciones: current.observaciones || '',
          tiempo_almuerzo: current.tiempoAlmuerzo || '02:00',
          tiempo_almuerzo_editado: current.tiempoAlmuerzoEditado || false,
          licencia_remunerada: current.licenciaRemunerada || false,
        };

        if (pair.salida) {
          const calc = calcularHorasTrabajadas(
            pair.entrada.hora,
            pair.salida.hora,
            pair.tiempo_almuerzo
          );
          pair.total_horas = calc.total_horas;
          pair.total_horas_decimal = calc.total_horas_decimal;
        } else {
          pair.total_horas = null;
          pair.total_horas_decimal = null;
        }

        pairs.push(pair);
      }

      i++;
    }

    pairs.reverse();
    return { success: true, pairs };
  } catch (error) {
    return { success: false, error: 'Error procesando parejas', pairs: [] };
  }
};

const parseTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
};

const calcularHorasTrabajadas = (horaEntrada, horaSalida, tiempoAlmuerzo = '02:00') => {
  try {

    const entradaMin = parseTime(horaEntrada);
    const salidaMin = parseTime(horaSalida);
    const almuerzoMin = parseTime(tiempoAlmuerzo);
    
    let diffMin = salidaMin - entradaMin;
    
    if (diffMin < 0) {
      diffMin += 24 * 60;
    }

    if (diffMin < almuerzoMin) {
      return {
        total_horas: '00:00',
        total_horas_decimal: 0.00,
        invalido: true
      };
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
      total_horas_decimal: parseFloat(total_horas_decimal.toFixed(2)),
      invalido: false
    };

  } catch (error) {
    return {
      total_horas: '00:00',
      total_horas_decimal: 0.00,
      invalido: true
    };
  }
};

export const updateTiempoAlmuerzo = async (entradaId, nuevoTiempo) => {
  try {
    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(nuevoTiempo)) {
      return { success: false, error: 'Formato invalido' };
    }

    const [hours, minutes] = nuevoTiempo.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    
    if (totalMinutes > 120) {
      return { 
        success: false, 
        error: 'Maximo 02:00' 
      };
    }

    const { data: record, error: fetchError } = await supabase
      .from('time_records')
      .select('tiempo_almuerzo_editado, tipo')
      .eq('id', entradaId)
      .single();

    if (fetchError) {
      return { success: false, error: 'Registro no encontrado' };
    }

    if (record.tipo !== RECORD_TYPES.ENTRADA) {
      return { success: false, error: 'Solo editable en ENTRADA' };
    }

    if (record.tiempo_almuerzo_editado) {
      return { 
        success: false, 
        error: 'Ya fue editado' 
      };
    }

    const { error: updateError } = await supabase
      .from('time_records')
      .update({
        tiempo_almuerzo: nuevoTiempo,
        tiempo_almuerzo_editado: true
      })
      .eq('id', entradaId);

    if (updateError) throw updateError;

    return { 
      success: true, 
      message: 'Actualizado' 
    };

  } catch (error) {
    return { success: false, error: 'Error actualizando' };
  }
};
