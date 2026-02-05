/**
 * UTILIDADES DE VALIDACIÓN
 * 
 * Funciones de validación para datos del sistema.
 * Implementa las reglas de validación del Requisito 5 (Nivel 2).
 */

import { PASSWORD_RULES, WEAK_PASSWORDS } from './constants.util.js';

/**
 * Valida una contraseña según las especificaciones de seguridad Nivel 2
 * 
 * Requisitos:
 * - Longitud: 6-20 caracteres
 * - Al menos 1 letra (mayúscula o minúscula)
 * - Al menos 1 número (0-9)
 * - No puede estar en la lista de contraseñas débiles
 * 
 * @param {string} password - Contraseña a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      error: 'La contraseña es requerida'
    };
  }

  // Validar longitud
  if (password.length < PASSWORD_RULES.MIN_LENGTH || password.length > PASSWORD_RULES.MAX_LENGTH) {
    return {
      valid: false,
      error: `La contraseña debe tener entre ${PASSWORD_RULES.MIN_LENGTH} y ${PASSWORD_RULES.MAX_LENGTH} caracteres`
    };
  }

  // Validar que contenga al menos una letra
  if (PASSWORD_RULES.REQUIRE_LETTER && !/[a-zA-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Debe contener al menos una letra'
    };
  }

  // Validar que contenga al menos un número
  if (PASSWORD_RULES.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Debe contener al menos un número'
    };
  }

  // Validar contra blacklist de contraseñas débiles
  if (WEAK_PASSWORDS.includes(password.toLowerCase())) {
    return {
      valid: false,
      error: 'Esta contraseña es muy común. Use una más segura'
    };
  }

  return { valid: true };
};

/**
 * Valida una cédula
 * @param {string} cedula - Cédula a validar
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateCedula = (cedula) => {
  if (!cedula || typeof cedula !== 'string') {
    return {
      valid: false,
      error: 'La cédula es requerida'
    };
  }

  const trimmed = cedula.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'La cédula no puede estar vacía'
    };
  }

  // Validar que solo contenga números
  if (!/^\d+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'La cédula solo debe contener números'
    };
  }

  // Validar longitud razonable (entre 7 y 10 dígitos)
  if (trimmed.length < 7 || trimmed.length > 10) {
    return {
      valid: false,
      error: 'La cédula debe tener entre 7 y 10 dígitos'
    };
  }

  return { valid: true };
};

/**
 * Valida los datos de un empleado
 * @param {Object} data - Datos del empleado
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateEmployeeData = (data) => {
  const errors = [];

  // Validar nombre
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('El nombre es requerido');
  } else if (data.name.trim().length < 3) {
    errors.push('El nombre debe tener al menos 3 caracteres');
  }

  // Validar cédula si está presente
  if (data.cedula) {
    const cedulaValidation = validateCedula(data.cedula);
    if (!cedulaValidation.valid) {
      errors.push(cedulaValidation.error);
    }
  }

  // Validar contraseña
  if (data.password) {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.push(passwordValidation.error);
    }
  }

  // Validar rol si está presente
  if (data.role && !['employee', 'admin', 'master'].includes(data.role)) {
    errors.push('Rol inválido');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida los datos de un registro de tiempo
 * @param {Object} data - Datos del registro
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateTimeRecordData = (data) => {
  const errors = [];

  if (!data.employeeId) {
    errors.push('El ID del empleado es requerido');
  }

  if (!data.employeeName || data.employeeName.trim().length === 0) {
    errors.push('El nombre del empleado es requerido');
  }

  if (!data.tipo || !['ENTRADA', 'SALIDA'].includes(data.tipo)) {
    errors.push('El tipo de registro debe ser ENTRADA o SALIDA');
  }

  if (!data.fecha || data.fecha.trim().length === 0) {
    errors.push('La fecha es requerida');
  }

  if (!data.hora || data.hora.trim().length === 0) {
    errors.push('La hora es requerida');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Valida un formato de hora HH:MM:SS
 * @param {string} hora - Hora a validar
 * @returns {boolean}
 */
export const validateTimeFormat = (hora) => {
  if (!hora || typeof hora !== 'string') return false;
  return /^\d{2}:\d{2}:\d{2}$/.test(hora);
};

/**
 * Valida un rango de fechas
 * @param {string} startDate - Fecha de inicio
 * @param {string} endDate - Fecha de fin
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return {
      valid: false,
      error: 'Ambas fechas son requeridas'
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      valid: false,
      error: 'Formato de fecha inválido'
    };
  }

  if (start > end) {
    return {
      valid: false,
      error: 'La fecha de inicio no puede ser posterior a la fecha de fin'
    };
  }

  return { valid: true };
};
