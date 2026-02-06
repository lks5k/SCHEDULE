/**
 * EXPORTS CENTRALIZADOS - SERVICIO DE ASISTENCIA
 */

export { 
  recordAttendance, 
  getTodayRecords, 
  getAllRecordsRealtime,
  subscribeToRecords 
} from './attendance.service';

export { 
  getEmployeePairs, 
  updateTiempoAlmuerzo 
} from './pairs.service';
