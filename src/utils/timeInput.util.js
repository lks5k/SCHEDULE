/**
 * UTILIDADES INPUT TIEMPO - PROTOCOLO RIGOR PRODUCCION
 * 
 * Formatea y valida inputs de tiempo sin usar type="time" nativo.
 * Evita confusión visual (emoji reloj, formato AM/PM variable).
 */

/**
 * Formatea input de tiempo a formato HH:MM mientras el usuario escribe
 * @param {string} value - Valor del input
 * @returns {string} Valor formateado HH:MM
 */
export const formatTimeInput = (value) => {
  // Remover todo excepto números
  const cleaned = value.replace(/[^0-9]/g, '');
  
  if (cleaned.length === 0) return '';
  
  // Auto-pad a 4 dígitos
  const padded = cleaned.padStart(4, '0').substring(0, 4);
  
  // Insertar :
  const hours = padded.substring(0, 2);
  const minutes = padded.substring(2, 4);
  
  return `${hours}:${minutes}`;
};

/**
 * Valida formato de tiempo HH:MM (24 horas)
 * @param {string} value - Valor a validar
 * @returns {boolean} True si formato válido
 */
export const validateTimeInput = (value) => {
  const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  if (!regex.test(value)) return false;
  
  const [hours, minutes] = value.split(':').map(Number);
  if (hours > 23 || minutes > 59) return false;
  
  return true;
};

/**
 * Convierte tiempo HH:MM a minutos totales
 * @param {string} timeStr - Tiempo en formato HH:MM
 * @returns {number} Total de minutos
 */
export const parseTimeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Valida que tiempo almuerzo esté en rango 00:00 - 02:00
 * @param {string} timeStr - Tiempo en formato HH:MM
 * @returns {boolean} True si está en rango válido
 */
export const validateAlmuerzoRange = (timeStr) => {
  const totalMinutes = parseTimeToMinutes(timeStr);
  return totalMinutes >= 0 && totalMinutes <= 120;
};
