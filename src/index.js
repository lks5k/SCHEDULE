/**
 * PUNTO DE ENTRADA PRINCIPAL
 * 
 * Exports centralizados de todos los módulos del sistema.
 * Facilita las importaciones en componentes React.
 */

// ============================================
// CONFIGURACIÓN
// ============================================
export { supabase, testConnection } from './config/supabase.config.js';

// ============================================
// UTILIDADES
// ============================================
export * from './utils/constants.util.js';
export * from './utils/validation.util.js';
export * from './utils/dateTime.util.js';
export * from './utils/localStorage.util.js';

// ============================================
// MÓDULO DE AUTENTICACIÓN
// ============================================
export * from './modules/auth/index.js';

// ============================================
// MÓDULO DE SCHEDULE
// ============================================
export * from './modules/schedule/index.js';

// ============================================
// MÓDULO DE REPORTES
// ============================================
export * from './modules/reports/index.js';

// ============================================
// SERVICIOS DE ASISTENCIA
// ============================================
export * from './services/attendance/index.js';
