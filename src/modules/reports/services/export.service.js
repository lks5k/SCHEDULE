/**
 * SERVICIO DE EXPORTACIÓN
 * 
 * Implementa Requisito 9: Modal de opciones para exportar a Excel
 * con filtros personalizados.
 */

import { getAllTimeRecords, getRecordsByDateRange } from '../../schedule/services/timeRecords.service.js';
import { calculateHoursBetweenRecords, compareRecordsByTime } from '../../../utils/dateTime.util.js';
import { validateDateRange } from '../../../utils/validation.util.js';
import { EXPORT_TYPES, LOG_ACTIONS } from '../../../utils/constants.util.js';
import { logActivity } from '../../schedule/services/activityLog.service.js';

/**
 * REQUISITO 9: Exporta registros a Excel según opciones
 * 
 * @param {Object} options - Opciones de exportación
 *   - type: 'filtered' | 'all' | 'dateRange'
 *   - records: Array de registros (si type === 'filtered')
 *   - startDate: Fecha inicio (si type === 'dateRange')
 *   - endDate: Fecha fin (si type === 'dateRange')
 * @param {Object} currentUser - Usuario que exporta
 * @returns {Object} { success, data?, fileName?, error? }
 */
export const exportToExcel = async (options, currentUser) => {
  try {
    let records = [];
    let fileName = '';

    // Determinar qué registros exportar según el tipo
    switch (options.type) {
      case EXPORT_TYPES.FILTERED:
        if (!options.records || !Array.isArray(options.records)) {
          return {
            success: false,
            error: 'Registros filtrados no proporcionados'
          };
        }
        records = options.records;
        fileName = `Horarios_Filtrados_${getCurrentDateForFileName()}`;
        break;

      case EXPORT_TYPES.ALL:
        const allResult = await getAllTimeRecords();
        if (!allResult.success) {
          return allResult;
        }
        records = allResult.data;
        fileName = `Horarios_Completo_${getCurrentDateForFileName()}`;
        break;

      case EXPORT_TYPES.DATE_RANGE:
        // Validar rango de fechas
        const validation = validateDateRange(options.startDate, options.endDate);
        if (!validation.valid) {
          return {
            success: false,
            error: validation.error
          };
        }

        const rangeResult = await getRecordsByDateRange(options.startDate, options.endDate);
        if (!rangeResult.success) {
          return rangeResult;
        }
        records = rangeResult.data;

        // Formatear fechas para nombre de archivo
        const startFormatted = new Date(options.startDate).toLocaleDateString('es-CO').replace(/\//g, '-');
        const endFormatted = new Date(options.endDate).toLocaleDateString('es-CO').replace(/\//g, '-');
        fileName = `Horarios_${startFormatted}_a_${endFormatted}`;
        break;

      default:
        return {
          success: false,
          error: 'Tipo de exportación inválido'
        };
    }

    // Preparar datos para Excel
    const excelData = prepareExportData(records);

    // Registrar en log
    await logActivity(
      LOG_ACTIONS.EXPORT_EXCEL,
      `${fileName}.xlsx - ${excelData.length} registros`,
      currentUser?.name || 'Sistema'
    );

    return {
      success: true,
      data: excelData,
      fileName: `${fileName}.xlsx`,
      recordCount: records.length,
      rowCount: excelData.length
    };

  } catch (error) {
    console.error('Error exportando a Excel:', error);
    return {
      success: false,
      error: 'Error al preparar la exportación'
    };
  }
};

/**
 * Prepara los datos de registros para exportación
 * Agrupa ENTRADA-SALIDA y calcula horas trabajadas
 * 
 * @param {Array} records - Registros a exportar
 * @returns {Array} Datos formateados para Excel
 */
export const prepareExportData = (records) => {
  try {
    const data = [];

    // Agrupar registros por empleado y fecha
    const groupedRecords = {};

    records.forEach(record => {
      const key = `${record.employeeId || record.employee_id}-${record.fecha}`;
      if (!groupedRecords[key]) {
        groupedRecords[key] = [];
      }
      groupedRecords[key].push(record);
    });

    // Ordenar grupos por fecha (más recientes primero)
    const sortedKeys = Object.keys(groupedRecords).sort().reverse();

    sortedKeys.forEach(key => {
      const dayRecords = groupedRecords[key].sort(compareRecordsByTime);

      // Emparejar ENTRADA-SALIDA
      for (let i = 0; i < dayRecords.length; i += 2) {
        const entrada = dayRecords[i]?.tipo === 'ENTRADA' ? dayRecords[i] : null;
        const salida = dayRecords[i + 1]?.tipo === 'SALIDA' ? dayRecords[i + 1] : null;

        const hours = (entrada && salida) 
          ? calculateHoursBetweenRecords(entrada, salida) 
          : '00:00:00';

        // Formato para Excel
        data.push({
          'FECHA': entrada?.fecha || salida?.fecha || '',
          'DÍA': entrada?.dia || salida?.dia || '',
          'COLABORADOR': entrada?.employeeName || entrada?.employee_name || 
                         salida?.employeeName || salida?.employee_name || '',
          'ENTRADA': entrada?.hora || '',
          'SALIDA': salida?.hora || '',
          'HORAS (hh:mm:ss)': hours,
          'OBSERVACIONES': entrada?.observaciones || salida?.observaciones || ''
        });
      }
    });

    return data;

  } catch (error) {
    console.error('Error preparando datos:', error);
    return [];
  }
};

/**
 * Obtiene la fecha actual formateada para nombre de archivo
 * @returns {string} Fecha en formato DD-MM-YYYY
 */
const getCurrentDateForFileName = () => {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Genera estadísticas resumen de los datos exportados
 * @param {Array} records - Registros exportados
 * @returns {Object} Estadísticas
 */
export const generateExportStats = (records) => {
  try {
    const employees = new Set();
    const dates = new Set();
    let totalEntradas = 0;
    let totalSalidas = 0;

    records.forEach(record => {
      employees.add(record.employeeId || record.employee_id);
      dates.add(record.fecha);

      if (record.tipo === 'ENTRADA') totalEntradas++;
      if (record.tipo === 'SALIDA') totalSalidas++;
    });

    return {
      totalRecords: records.length,
      uniqueEmployees: employees.size,
      uniqueDates: dates.size,
      totalEntradas,
      totalSalidas
    };

  } catch (error) {
    console.error('Error generando estadísticas:', error);
    return null;
  }
};
