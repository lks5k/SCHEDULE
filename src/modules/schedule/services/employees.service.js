/**
 * SERVICIO DE EMPLEADOS
 * 
 * CRUD para la tabla 'employees' de Supabase.
 * Implementa soft delete y validaciones exhaustivas.
 */

import { supabase } from '../../../config/supabase.config.js';
import { validateEmployeeData, validateCedula } from '../../../utils/validation.util.js';
import { getEmployees, saveEmployees } from '../../../utils/localStorage.util.js';
import { LOG_ACTIONS } from '../../../utils/constants.util.js';
import { logActivity } from './activityLog.service.js';
import { withSupabaseQuery } from '../../../utils/supabaseWrapper.util.js';
import { logger } from '../../../utils/logger.util.js';

/**
 * Obtiene todos los empleados activos
 * @returns {Object} { success, data, error? }
 */
export const getAllEmployees = async () => {
  const result = await withSupabaseQuery(
    () => supabase
      .from('employees')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true }),
    []
  );

  if (!result.success) {
    return {
      success: true,
      data: getEmployees(),
      source: 'localStorage'
    };
  }

  const data = result.data || [];
  saveEmployees(data);
  return {
    success: true,
    data,
    source: 'supabase'
  };
};

/**
 * Obtiene un empleado por ID
 * @param {number} id - ID del empleado
 * @returns {Object} { success, data?, error? }
 */
export const getEmployeeById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.warn('Buscando en localStorage');
      const employees = getEmployees();
      const employee = employees.find(e => e.id === id);

      if (employee) {
        return { success: true, data: employee };
      }

      return { success: false, error: 'Empleado no encontrado' };
    }

    return { success: true, data };

  } catch (error) {
    logger.error('Error obteniendo empleado:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtiene un empleado por cédula
 * @param {string} cedula - Cédula del empleado
 * @returns {Object} { success, data?, error? }
 */
export const getEmployeeByCedula = async (cedula) => {
  try {
    const validation = validateCedula(cedula);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('cedula', cedula.trim())
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.warn('Buscando en localStorage');
      const employees = getEmployees();
      const employee = employees.find(e => e.cedula === cedula.trim());

      if (employee) {
        return { success: true, data: employee };
      }

      return { success: false, error: 'Empleado no encontrado' };
    }

    return { success: true, data };

  } catch (error) {
    logger.error('Error obteniendo empleado por cédula:', error);
    return { success: false, error: error.message };
  }
};

/**
 * REQUISITO 8: Crea un nuevo empleado con validación de contraseña
 * @param {Object} employeeData - Datos del empleado
 * @param {Object} currentUser - Usuario que crea el empleado
 * @returns {Object} { success, data?, error? }
 */
export const createEmployee = async (employeeData, currentUser) => {
  try {
    // Validar datos
    const validation = validateEmployeeData(employeeData);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Preparar datos para inserción
    const newEmployee = {
      name: employeeData.name.trim(),
      cedula: employeeData.cedula?.trim() || null,
      password: employeeData.password,
      role: employeeData.role || 'employee',
      blocked: false,
      created_at: new Date().toISOString()
    };

    // Intentar guardar en Supabase
    let savedEmployee = null;

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([newEmployee])
        .select()
        .single();

      if (error) throw error;
      savedEmployee = data;
    } catch (supabaseError) {
      logger.warn('Error en Supabase, generando ID local:', supabaseError.message);
      savedEmployee = {
        ...newEmployee,
        id: Date.now() // ID temporal para localStorage
      };
    }

    // Guardar en localStorage
    const employees = getEmployees();
    employees.push(savedEmployee);
    saveEmployees(employees);

    // Registrar en log
    await logActivity(
      LOG_ACTIONS.EMPLOYEE_ADDED,
      `Nuevo colaborador: ${newEmployee.name}`,
      currentUser?.name || 'Sistema'
    );

    return {
      success: true,
      data: savedEmployee
    };

  } catch (error) {
    logger.error('Error creando empleado:', error);
    return {
      success: false,
      error: 'Error al crear el empleado'
    };
  }
};

/**
 * Actualiza un empleado
 * @param {number} id - ID del empleado
 * @param {Object} updates - Datos a actualizar
 * @param {Object} currentUser - Usuario que realiza la actualización
 * @returns {Object} { success, data?, error? }
 */
export const updateEmployee = async (id, updates, currentUser) => {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Actualizar en Supabase
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
    } catch (supabaseError) {
      logger.warn('Error actualizando en Supabase:', supabaseError.message);
    }

    // Actualizar en localStorage
    const employees = getEmployees();
    const index = employees.findIndex(e => e.id === id);

    if (index !== -1) {
      employees[index] = { ...employees[index], ...updateData };
      saveEmployees(employees);

      await logActivity(
        LOG_ACTIONS.EMPLOYEE_EDITED,
        `Empleado actualizado: ${employees[index].name}`,
        currentUser?.name || 'Sistema'
      );

      return { success: true, data: employees[index] };
    }

    return { success: false, error: 'Empleado no encontrado' };

  } catch (error) {
    logger.error('Error actualizando empleado:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Soft delete de un empleado
 * @param {number} id - ID del empleado
 * @param {Object} currentUser - Usuario que elimina
 * @returns {Object} { success, error? }
 */
export const deleteEmployee = async (id, currentUser) => {
  try {
    const deletedAt = new Date().toISOString();

    // Soft delete en Supabase
    try {
      const { error } = await supabase
        .from('employees')
        .update({ deleted_at: deletedAt })
        .eq('id', id);

      if (error) throw error;
    } catch (supabaseError) {
      logger.warn('Error en Supabase:', supabaseError.message);
    }

    // Remover de localStorage (hard delete local)
    const employees = getEmployees();
    const employee = employees.find(e => e.id === id);
    const filtered = employees.filter(e => e.id !== id);
    saveEmployees(filtered);

    if (employee) {
      await logActivity(
        LOG_ACTIONS.EMPLOYEE_DELETED,
        `Empleado eliminado: ${employee.name}`,
        currentUser?.name || 'Sistema'
      );
    }

    return { success: true };

  } catch (error) {
    logger.error('Error eliminando empleado:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Bloquea o desbloquea un empleado
 * @param {number} id - ID del empleado
 * @param {boolean} blocked - true para bloquear, false para desbloquear
 * @param {Object} currentUser - Usuario que realiza la acción
 * @returns {Object} { success, error? }
 */
export const blockEmployee = async (id, blocked, currentUser) => {
  try {
    // Actualizar en Supabase
    try {
      const { error } = await supabase
        .from('employees')
        .update({ blocked })
        .eq('id', id);

      if (error) throw error;
    } catch (supabaseError) {
      logger.warn('Error en Supabase:', supabaseError.message);
    }

    // Actualizar en localStorage
    const employees = getEmployees();
    const employee = employees.find(e => e.id === id);

    if (employee) {
      employee.blocked = blocked;
      saveEmployees(employees);

      const action = blocked ? LOG_ACTIONS.EMPLOYEE_BLOCKED : LOG_ACTIONS.EMPLOYEE_UNBLOCKED;
      await logActivity(
        action,
        employee.name,
        currentUser?.name || 'Sistema'
      );

      return { success: true };
    }

    return { success: false, error: 'Empleado no encontrado' };

  } catch (error) {
    logger.error('Error bloqueando/desbloqueando empleado:', error);
    return { success: false, error: error.message };
  }
};
