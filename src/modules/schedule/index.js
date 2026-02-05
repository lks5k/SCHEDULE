/**
 * MÓDULO DE SCHEDULE
 * 
 * Exports centralizados del módulo schedule
 */

// Servicios de empleados
export {
  getAllEmployees,
  getEmployeeById,
  getEmployeeByCedula,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  blockEmployee
} from './services/employees.service.js';

// Servicios de registros de tiempo
export {
  getAllTimeRecords,
  getRecordsByEmployeeId,
  getRecordsByDateRange,
  getLastRecordByEmployee,
  createTimeRecord,
  updateTimeRecord,
  deleteTimeRecord,
  addObservation
} from './services/timeRecords.service.js';

// Servicios de log de actividad
export {
  logActivity,
  getActivityLogData,
  getActivityByUser,
  getActivityByDateRange,
  cleanOldLogs
} from './services/activityLog.service.js';

// Servicios de marcaciones
export {
  recordAttendance,
  getEmployeeRecentRecords,
  calculateWorkedHours,
  getAttendanceStats
} from './services/records.service.js';
