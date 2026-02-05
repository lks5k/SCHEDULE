/**
 * MÓDULO DE AUTENTICACIÓN
 * 
 * Exports centralizados del módulo auth
 */

export { 
  login, 
  logout, 
  checkLastRecord, 
  autoLogout 
} from './services/auth.service.js';

export { 
  changePassword, 
  changeOwnPassword, 
  resetEmployeePassword 
} from './services/password.service.js';
