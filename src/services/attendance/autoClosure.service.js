/**
 * SERVICIO DE AUTO-CIERRE DE MARCACIONES
 *
 * Detecta entradas sin salida y genera registros de cierre automático:
 * - midnightCleanup: cierra entradas con más de 24h sin salida (cambio de día).
 * - blockLimitCheck: cierra entradas con más de 8h sin salida (olvido de marcación).
 *
 * Se ejecuta periódicamente desde AuthContext mientras hay sesión activa.
 */

import { supabase } from '@/config/supabase.config';
import { RECORD_TYPES } from '@/utils/constants.util';
import { differenceInHours, addHours, format } from 'date-fns';

const buildExitRecord = (record, exitTime, observacion) => ({
  employee_id: record.employee_id,
  employee_name: record.employee_name,
  fecha: format(exitTime, 'dd/MM/yyyy'),
  dia: format(exitTime, 'EEEE').toLowerCase(),
  tipo: RECORD_TYPES.SALIDA,
  hora: format(exitTime, 'HH:mm'),
  timestamp: exitTime.toISOString(),
  observacion_1: observacion,
  observacion_1_editado: true,
});

const hasExitAfter = async (employeeId, entryTimestamp) => {
  const { data } = await supabase
    .from('time_records')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('tipo', RECORD_TYPES.SALIDA)
    .gt('timestamp', entryTimestamp)
    .limit(1)
    .single();
  return !!data;
};

const fetchOpenEntries = async () => {
  const { data } = await supabase
    .from('time_records')
    .select('*')
    .eq('tipo', RECORD_TYPES.ENTRADA)
    .is('deleted_at', null)
    .order('timestamp', { ascending: false });
  return data || [];
};

/**
 * Cierra entradas que llevan más de 24 horas abiertas (cambio de día sin salida).
 * Genera salida 4 horas después de la entrada original.
 */
export const midnightCleanup = async () => {
  try {
    const openRecords = await fetchOpenEntries();
    if (openRecords.length === 0) return { success: true, closed: 0 };

    const now = new Date();
    const closures = [];

    for (const record of openRecords) {
      const entryTime = new Date(record.timestamp);
      const hoursSince = differenceInHours(now, entryTime);
      if (hoursSince < 24) continue;

      const alreadyClosed = await hasExitAfter(record.employee_id, record.timestamp);
      if (alreadyClosed) continue;

      closures.push(
        buildExitRecord(
          record,
          addHours(entryTime, 4),
          'Cierre de cambio de dia. Para correcciones contacte al administrador.'
        )
      );
    }

    if (closures.length > 0) {
      await supabase.from('time_records').insert(closures);
    }

    return { success: true, closed: closures.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Cierra entradas que llevan más de 8 horas abiertas (olvido de marcación de salida).
 * Genera salida 4 horas después de la entrada, con mensaje según jornada.
 */
export const blockLimitCheck = async () => {
  try {
    const openRecords = await fetchOpenEntries();
    if (openRecords.length === 0) return { success: true, closed: 0 };

    const now = new Date();
    const closures = [];

    for (const record of openRecords) {
      const entryTime = new Date(record.timestamp);
      const hoursSince = differenceInHours(now, entryTime);
      if (hoursSince < 8) continue;

      const alreadyClosed = await hasExitAfter(record.employee_id, record.timestamp);
      if (alreadyClosed) continue;

      const hour = entryTime.getHours();
      let jornada = 'Mañana';
      if (hour >= 13 && hour < 19) jornada = 'Tarde';
      if (hour >= 19 || hour < 6) jornada = 'Noche';

      closures.push(
        buildExitRecord(
          record,
          addHours(entryTime, 4),
          `Cierre por olvido de marcacion de SALIDA de jornada ${jornada}. Para correcciones contacte al administrador.`
        )
      );
    }

    if (closures.length > 0) {
      await supabase.from('time_records').insert(closures);
    }

    return { success: true, closed: closures.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
