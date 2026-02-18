/**
 * UTILIDADES DE LOCALSTORAGE
 * 
 * Wrapper para operaciones de localStorage con manejo de errores.
 * Provee funciones para persistir datos localmente como fallback.
 */

import { LOCAL_STORAGE_KEYS } from './constants.util.js';
import { logger } from './logger.util.js';

/**
 * Guarda datos en localStorage de forma segura
 * @param {string} key - Clave de almacenamiento
 * @param {*} data - Datos a guardar
 * @returns {boolean} true si se guardó exitosamente
 */
const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    logger.error(`Error guardando en localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Obtiene datos de localStorage de forma segura
 * @param {string} key - Clave de almacenamiento
 * @param {*} defaultValue - Valor por defecto si no existe
 * @returns {*} Datos parseados o valor por defecto
 */
const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    logger.error(`Error leyendo de localStorage (${key}):`, error);
    return defaultValue;
  }
};

// ============================================
// EMPLEADOS
// ============================================

/**
 * Obtiene todos los empleados de localStorage
 * @returns {Array} Lista de empleados
 */
export const getEmployees = () => {
  return getFromLocalStorage(LOCAL_STORAGE_KEYS.EMPLOYEES, []);
};

/**
 * Guarda empleados en localStorage
 * @param {Array} employees - Lista de empleados
 * @returns {boolean}
 */
export const saveEmployees = (employees) => {
  return saveToLocalStorage(LOCAL_STORAGE_KEYS.EMPLOYEES, employees);
};

// ============================================
// REGISTROS DE TIEMPO
// ============================================

/**
 * Obtiene todos los registros de tiempo de localStorage
 * @returns {Array} Lista de registros
 */
export const getTimeRecords = () => {
  return getFromLocalStorage(LOCAL_STORAGE_KEYS.TIME_RECORDS, []);
};

/**
 * Guarda registros de tiempo en localStorage
 * @param {Array} records - Lista de registros
 * @returns {boolean}
 */
export const saveTimeRecords = (records) => {
  return saveToLocalStorage(LOCAL_STORAGE_KEYS.TIME_RECORDS, records);
};

// ============================================
// LOG DE ACTIVIDAD
// ============================================

/**
 * Obtiene el log de actividad de localStorage
 * @returns {Array} Lista de actividades
 */
export const getActivityLog = () => {
  return getFromLocalStorage(LOCAL_STORAGE_KEYS.ACTIVITY_LOG, []);
};

/**
 * Guarda el log de actividad en localStorage
 * @param {Array} log - Lista de actividades
 * @returns {boolean}
 */
export const saveActivityLog = (log) => {
  return saveToLocalStorage(LOCAL_STORAGE_KEYS.ACTIVITY_LOG, log);
};

// ============================================
// CONTRASEÑAS DEL SISTEMA
// ============================================

/**
 * Obtiene las contraseñas del sistema
 * @returns {Object} { master, admin }
 */
export const getSystemPasswords = () => {
  return {
    master: localStorage.getItem(LOCAL_STORAGE_KEYS.MASTER_PASSWORD) || 'Master2024',
    admin: localStorage.getItem(LOCAL_STORAGE_KEYS.ADMIN_PASSWORD) || 'Admin2024'
  };
};

/**
 * Guarda las contraseñas del sistema
 * @param {Object} passwords - { master, admin }
 * @returns {boolean}
 */
export const saveSystemPasswords = (passwords) => {
  try {
    if (passwords.master) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.MASTER_PASSWORD, passwords.master);
    }
    if (passwords.admin) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ADMIN_PASSWORD, passwords.admin);
    }
    return true;
  } catch (error) {
    logger.error('Error guardando contraseñas del sistema:', error);
    return false;
  }
};

// ============================================
// LIMPIEZA
// ============================================

/**
 * Limpia todos los datos de localStorage
 * @returns {boolean}
 */
export const clearAllData = () => {
  try {
    Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    logger.info('localStorage limpiado');
    return true;
  } catch (error) {
    logger.error('Error limpiando localStorage:', error);
    return false;
  }
};

/**
 * Verifica si localStorage está disponible
 * @returns {boolean}
 */
export const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};
