/**
 * CONSTANTES DEL SISTEMA
 * 
 * Valores constantes utilizados en toda la aplicación.
 */

// Roles de usuario
export const ROLES = {
  EMPLOYEE: 'employee',
  ADMIN: 'admin',
  MASTER: 'master'
};

// Tipos de registro de tiempo
export const RECORD_TYPES = {
  ENTRADA: 'ENTRADA',
  SALIDA: 'SALIDA'
};

// Acciones para el log de actividad
export const LOG_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGIN_BLOCKED: 'LOGIN_BLOCKED',
  LOGOUT: 'LOGOUT',
  AUTO_LOGOUT: 'AUTO_LOGOUT',
  REGISTRO_ENTRADA: 'REGISTRO_ENTRADA',
  REGISTRO_SALIDA: 'REGISTRO_SALIDA',
  EMPLOYEE_ADDED: 'EMPLOYEE_ADDED',
  EMPLOYEE_EDITED: 'EMPLOYEE_EDITED',
  EMPLOYEE_DELETED: 'EMPLOYEE_DELETED',
  EMPLOYEE_BLOCKED: 'EMPLOYEE_BLOCKED',
  EMPLOYEE_UNBLOCKED: 'EMPLOYEE_UNBLOCKED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  RECORD_EDITED: 'RECORD_EDITED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  EXPORT_EXCEL: 'EXPORT_EXCEL'
};

// Configuración de tiempo
export const TIME_CONFIG = {
  INACTIVITY_TIMEOUT: 60000, // 60 segundos
  EMPLOYEE_RECORDS_DISPLAY_TIME: 10000, // 10 segundos
  TOAST_DURATION: 3000 // 3 segundos
};

// Contraseñas débiles prohibidas (blacklist)
export const WEAK_PASSWORDS = [
  '123456',
  'password',
  'qwerty',
  'abc123',
  '111111',
  '123123',
  'admin123',
  '654321',
  'password1',
  '000000'
];

// Validación de contraseñas
export const PASSWORD_RULES = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 20,
  REQUIRE_LETTER: true,
  REQUIRE_NUMBER: true
};

// Configuración de exportación
export const EXPORT_TYPES = {
  FILTERED: 'filtered',
  ALL: 'all',
  DATE_RANGE: 'dateRange'
};

// Mensajes del sistema
export const MESSAGES = {
  ERROR: {
    EMPTY_PASSWORD: 'Ingrese una contraseña',
    INCORRECT_PASSWORD: 'Contraseña incorrecta',
    USER_BLOCKED: 'Usuario bloqueado. Contacte al administrador',
    LOADING_DATA: 'Cargando datos, intente de nuevo en un momento...',
    INVALID_DATA: 'Datos inválidos',
    CONNECTION_ERROR: 'Error de conexión. Usando modo local',
    NO_SUPABASE: 'Supabase no disponible. Usando almacenamiento local'
  },
  SUCCESS: {
    LOGIN: 'Inicio de sesión exitoso',
    LOGOUT: 'Sesión cerrada correctamente',
    RECORD_SAVED: 'Registro guardado exitosamente',
    PASSWORD_CHANGED: 'Contraseña cambiada exitosamente',
    EMPLOYEE_ADDED: 'Colaborador agregado exitosamente',
    EMPLOYEE_DELETED: 'Colaborador eliminado',
    RECORD_EDITED: 'Registro editado exitosamente',
    COMMENT_SAVED: 'Comentario guardado'
  }
};

// Configuración de localStorage
export const LOCAL_STORAGE_KEYS = {
  EMPLOYEES: 'employees',
  TIME_RECORDS: 'timeRecords',
  ACTIVITY_LOG: 'activityLog',
  MASTER_PASSWORD: 'masterPassword',
  ADMIN_PASSWORD: 'adminPassword'
};
