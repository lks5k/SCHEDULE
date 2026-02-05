/**
 * SERVICIO DE GESTIÓN DE CONTRASEÑAS
 * 
 * Implementa el Requisito 5: Sistema seguro de cambio de contraseñas
 * con validación de Nivel 2.
 */

import { supabase } from '../../../config/supabase.config.js';
import { validatePassword } from '../../../utils/validation.util.js';
import { 
  getEmployees, 
  saveEmployees, 
  getSystemPasswords, 
  saveSystemPasswords 
} from '../../../utils/localStorage.util.js';
import { ROLES, LOG_ACTIONS } from '../../../utils/constants.util.js';
import { logActivity } from '../../schedule/services/activityLog.service.js';

/**
 * REQUISITO 5: Cambia la contraseña de un usuario
 * 
 * Reglas según rol:
 * - EMPLEADO: NO puede cambiar su propia contraseña desde la interfaz
 * - ADMIN: Puede cambiar su propia contraseña y de empleados (NO de otros admins ni maestro)
 * - MAESTRO: Puede cambiar su propia contraseña, de admins y empleados
 * 
 * @param {number} userId - ID del usuario (null para master/admin)
 * @param {string} currentPassword - Contraseña actual (requerida para cambiar propia)
 * @param {string} newPassword - Nueva contraseña
 * @param {string} confirmPassword - Confirmación de nueva contraseña
 * @param {Object} currentUser - Usuario que realiza el cambio
 * @returns {Object} { success, error? }
 */
export const changePassword = async (
  userId,
  currentPassword,
  newPassword,
  confirmPassword,
  currentUser
) => {
  try {
    // Validar nueva contraseña
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Validar confirmación
    if (newPassword !== confirmPassword) {
      return {
        success: false,
        error: 'Las contraseñas no coinciden'
      };
    }

    // Caso 1: Cambiar contraseña de MASTER o ADMIN (propia)
    if (!userId && (currentUser.role === ROLES.MASTER || currentUser.role === ROLES.ADMIN)) {
      return await changeSystemPassword(currentUser, currentPassword, newPassword);
    }

    // Caso 2: Cambiar contraseña de EMPLEADO
    if (userId) {
      return await changeEmployeePassword(userId, newPassword, currentUser);
    }

    return {
      success: false,
      error: 'Parámetros inválidos'
    };

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return {
      success: false,
      error: 'Error al cambiar la contraseña'
    };
  }
};

/**
 * Cambia la contraseña del sistema (Master o Admin)
 * @param {Object} currentUser - Usuario actual
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Object}
 */
const changeSystemPassword = async (currentUser, currentPassword, newPassword) => {
  try {
    const systemPasswords = getSystemPasswords();

    // Validar contraseña actual
    if (currentUser.role === ROLES.MASTER) {
      if (currentPassword !== systemPasswords.master) {
        return {
          success: false,
          error: 'Contraseña actual incorrecta'
        };
      }

      // Actualizar contraseña de maestro
      const saved = saveSystemPasswords({ master: newPassword });

      if (saved) {
        await logActivity(
          LOG_ACTIONS.PASSWORD_CHANGED,
          'Contraseña de Maestro cambiada',
          'Maestro'
        );

        return { success: true };
      }
    }

    if (currentUser.role === ROLES.ADMIN) {
      if (currentPassword !== systemPasswords.admin) {
        return {
          success: false,
          error: 'Contraseña actual incorrecta'
        };
      }

      // Actualizar contraseña de admin
      const saved = saveSystemPasswords({ admin: newPassword });

      if (saved) {
        await logActivity(
          LOG_ACTIONS.PASSWORD_CHANGED,
          'Contraseña de Administrador cambiada',
          'Administrador'
        );

        return { success: true };
      }
    }

    return {
      success: false,
      error: 'Error guardando la nueva contraseña'
    };

  } catch (error) {
    console.error('Error en changeSystemPassword:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Cambia la contraseña de un empleado
 * @param {number} userId - ID del empleado
 * @param {string} newPassword - Nueva contraseña
 * @param {Object} currentUser - Usuario que realiza el cambio
 * @returns {Object}
 */
const changeEmployeePassword = async (userId, newPassword, currentUser) => {
  try {
    // Validar permisos
    if (currentUser.role === ROLES.EMPLOYEE) {
      return {
        success: false,
        error: 'Los empleados no pueden cambiar contraseñas'
      };
    }

    const employees = getEmployees();
    const employee = employees.find(e => e.id === userId);

    if (!employee) {
      return {
        success: false,
        error: 'Empleado no encontrado'
      };
    }

    // Actualizar contraseña
    employee.password = newPassword;

    // Guardar en localStorage
    saveEmployees(employees);

    // Intentar guardar en Supabase
    try {
      const { error } = await supabase
        .from('employees')
        .update({ password: newPassword })
        .eq('id', userId);

      if (error) {
        console.warn('Error actualizando en Supabase:', error.message);
      }
    } catch (supabaseError) {
      console.warn('Supabase no disponible:', supabaseError.message);
    }

    // Registrar en log
    await logActivity(
      LOG_ACTIONS.PASSWORD_CHANGED,
      `Contraseña de ${employee.name} cambiada`,
      currentUser.name
    );

    return { success: true };

  } catch (error) {
    console.error('Error en changeEmployeePassword:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Cambia la propia contraseña del usuario
 * @param {Object} user - Usuario actual
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @param {string} confirmPassword - Confirmación
 * @returns {Object}
 */
export const changeOwnPassword = async (
  user,
  currentPassword,
  newPassword,
  confirmPassword
) => {
  return changePassword(
    user.role === ROLES.EMPLOYEE ? user.id : null,
    currentPassword,
    newPassword,
    confirmPassword,
    user
  );
};

/**
 * Admin/Maestro resetea la contraseña de un empleado
 * (No requiere contraseña actual del empleado)
 * 
 * @param {Object} adminUser - Usuario admin/maestro
 * @param {number} targetUserId - ID del empleado
 * @param {string} newPassword - Nueva contraseña
 * @param {string} confirmPassword - Confirmación
 * @returns {Object}
 */
export const resetEmployeePassword = async (
  adminUser,
  targetUserId,
  newPassword,
  confirmPassword
) => {
  // Admin/Maestro NO necesita la contraseña actual del empleado
  return changePassword(
    targetUserId,
    null, // No se requiere contraseña actual
    newPassword,
    confirmPassword,
    adminUser
  );
};
