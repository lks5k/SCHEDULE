/**
 * UTILIDADES DE FECHA Y HORA
 * 
 * Funciones para manejo, parseo y formato de fechas y horas.
 * Compatible con formatos colombianos (es-CO).
 */

/**
 * Parsea una hora en formato HH:MM:SS, HH:MM:SS AM/PM
 * @param {string} hora - Hora a parsear
 * @returns {Object|null} { h, m, s } o null si es inválida
 */
export const parseHoraToHms = (hora) => {
  if (typeof hora !== 'string') return null;
  const raw = hora.trim();
  if (!raw) return null;

  // Normalizar espacios especiales de algunos locales (NBSP / NNBSP)
  const lower = raw
    .toLowerCase()
    .replace(/\u00a0/g, ' ')
    .replace(/\u202f/g, ' ');

  // Detectar AM/PM
  const hasAm = /\b(am)\b/.test(lower) || /a\.?\s*m\.?/.test(lower);
  const hasPm = /\b(pm)\b/.test(lower) || /p\.?\s*m\.?/.test(lower);
  const suffix = hasAm ? 'am' : (hasPm ? 'pm' : null);

  // Extraer solo dígitos y ":"
  const numeric = lower.replace(/[^0-9:]/g, '');
  const parts = numeric.split(':').filter(Boolean);
  if (parts.length < 2) return null;

  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  let s = parts.length >= 3 ? parseInt(parts[2], 10) : 0;

  if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) return null;

  // Convertir AM/PM a formato 24 horas
  if (suffix) {
    if (h === 12) {
      h = (suffix === 'am') ? 0 : 12;
    } else if (suffix === 'pm') {
      h += 12;
    }
  }

  // Validar rangos
  if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) return null;

  return { h, m, s };
};

/**
 * Parsea una fecha en formato colombiano DD/MM/YYYY
 * @param {string} fecha - Fecha a parsear
 * @returns {Object|null} { y, m, d } o null si es inválida
 */
export const parseFechaEsCO = (fecha) => {
  if (typeof fecha !== 'string') return null;
  const parts = fecha.split('/');
  if (parts.length !== 3) return null;

  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);

  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null;
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return null;

  return { y, m, d };
};

/**
 * Construye un objeto Date a partir de fecha y hora colombiana
 * @param {string} fecha - Fecha en formato DD/MM/YYYY
 * @param {string} hora - Hora en formato HH:MM:SS
 * @returns {Date|null}
 */
export const buildLocalDateFromFechaHora = (fecha, hora) => {
  const ymd = parseFechaEsCO(fecha);
  const hms = parseHoraToHms(hora);

  if (!ymd || !hms) return null;

  const dt = new Date(ymd.y, ymd.m - 1, ymd.d, hms.h, hms.m, hms.s, 0);
  if (Number.isNaN(dt.getTime())) return null;

  return dt;
};

/**
 * Obtiene el timestamp en milisegundos de un registro
 * @param {Object} record - Registro con timestamp, fecha y hora
 * @returns {number} Timestamp en ms o NaN si no se puede determinar
 */
export const getRecordTimeMs = (record) => {
  if (!record) return NaN;

  // Intentar usar timestamp directo
  if (record.timestamp) {
    const t = Date.parse(record.timestamp);
    if (!Number.isNaN(t)) return t;
  }

  // Construir desde fecha y hora
  const dt = buildLocalDateFromFechaHora(record.fecha, record.hora);
  return dt ? dt.getTime() : NaN;
};

/**
 * Compara dos registros por tiempo (para ordenamiento)
 * @param {Object} a - Primer registro
 * @param {Object} b - Segundo registro
 * @returns {number} -1, 0 o 1
 */
export const compareRecordsByTime = (a, b) => {
  const ta = getRecordTimeMs(a);
  const tb = getRecordTimeMs(b);

  const aBad = Number.isNaN(ta);
  const bBad = Number.isNaN(tb);

  if (aBad && bBad) return 0;
  if (aBad) return 1; // Registros inválidos al final
  if (bBad) return -1;

  return ta - tb;
};

/**
 * Formatea una duración en milisegundos a HH:MM:SS
 * @param {number} ms - Duración en milisegundos
 * @returns {string} Formato HH:MM:SS
 */
export const formatDurationMs = (ms) => {
  if (!Number.isFinite(ms)) return '00:00:00';

  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

/**
 * Calcula las horas trabajadas entre dos registros
 * @param {Object} entrada - Registro de entrada
 * @param {Object} salida - Registro de salida
 * @returns {string} Horas en formato HH:MM:SS
 */
export const calculateHoursBetweenRecords = (entrada, salida) => {
  const t1 = getRecordTimeMs(entrada);
  const t2 = getRecordTimeMs(salida);

  if (Number.isNaN(t1) || Number.isNaN(t2)) return '00:00:00';

  return formatDurationMs(t2 - t1);
};

/**
 * Obtiene la fecha actual en formato colombiano DD/MM/YYYY
 * @returns {string}
 */
export const getCurrentDateCO = () => {
  return new Date().toLocaleDateString('es-CO');
};

/**
 * Obtiene la hora actual en formato HH:MM:SS
 * @returns {string}
 */
export const getCurrentTimeCO = () => {
  return new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Obtiene el día de la semana en español
 * @param {Date} date - Fecha
 * @returns {string}
 */
export const getDayOfWeekCO = (date = new Date()) => {
  return date.toLocaleDateString('es-CO', { weekday: 'long' });
};

/**
 * Convierte una fecha DD/MM/YYYY a formato ISO YYYY-MM-DD
 * @param {string} fechaCO - Fecha en formato colombiano
 * @returns {string|null}
 */
export const fechaCOToISO = (fechaCO) => {
  const ymd = parseFechaEsCO(fechaCO);
  if (!ymd) return null;

  const pad = (n) => String(n).padStart(2, '0');
  return `${ymd.y}-${pad(ymd.m)}-${pad(ymd.d)}`;
};

/**
 * Convierte una fecha ISO YYYY-MM-DD a formato colombiano DD/MM/YYYY
 * @param {string} fechaISO - Fecha en formato ISO
 * @returns {string|null}
 */
export const fechaISOToCO = (fechaISO) => {
  const date = new Date(fechaISO);
  if (isNaN(date.getTime())) return null;

  return date.toLocaleDateString('es-CO');
};
