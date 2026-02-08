Cursor, vamos a realizar una refactorización profunda. Primero, abre database.sql e index.html.

CONTEXTO TÉCNICO DE SUPABASE: Acabo de resetear la base de datos en el Dashboard de Supabase con esta estructura exacta que DEBES seguir para que el código no falle:

Tabla employees: id (serial), name, cedula (UNIQUE), password, role (employee, admin, master).

Tabla time_records: id (serial), employee_id (FK a employees), employee_name, fecha, dia, tipo (ENTRADA/SALIDA), hora, timestamp, observaciones.

Tabla activity_log: id, timestamp, user_name, action, details.

INSTRUCCIÓN INICIAL: Actualiza el archivo database.sql para que sea un reflejo exacto de esta estructura. Luego, aplica las siguientes mejoras críticas en index.html siguiendo estas reglas de negocio detalladas:

Necesito implementar mejoras críticas en mi sistema de control de horarios. Lee cuidadosamente TODOS los requisitos antes de empezar a modificar código.

ANTES DE HACER CAMBIOS: Muéstrame qué archivos vas a modificar y qué secciones específicas cambiarás.

═══════════════════════════════════════════════════════════════════

📋 REQUISITO 1: VALIDACIÓN DE ÚLTIMA MARCACIÓN

OBJETIVO: Evitar duplicidad de marcaciones consultando Supabase en tiempo real.

COMPORTAMIENTO ACTUAL (ELIMINAR):
- Cuenta entradas/salidas del día en localStorage
- Lógica: si entradas = salidas → muestra ENTRADA

COMPORTAMIENTO NUEVO (IMPLEMENTAR):
1. Cuando empleado hace login exitoso, ANTES de mostrar la interfaz:
   - Consultar en Supabase: SELECT * FROM time_records WHERE employee_id = [id] ORDER BY timestamp DESC LIMIT 1
   - Si último registro es ENTRADA → Botón muestra "SALIDA" 
   - Si último registro es SALIDA → Botón muestra "ENTRADA"
   - Si NO hay registros → Botón muestra "ENTRADA"

2. El botón debe actualizarse DINÁMICAMENTE después de cada marcación

3. Manejar errores: Si falla consulta a Supabase, usar lógica de localStorage como fallback

CÓDIGO AFECTADO:
- Función updateEmployeeButton()
- Función handleEmployeeAction()

═══════════════════════════════════════════════════════════════════

📋 REQUISITO 2: VISUALIZACIÓN PARA EMPLEADOS

OBJETIVO: Empleados ven confirmación de su marcación + últimos 5 registros, luego logout automático.

FLUJO EXACTO:
1. Empleado marca ENTRADA/SALIDA
2. Mostrar toast: "✅ [TIPO] registrada exitosamente"
3. Mostrar tabla con formato:
   ┌────────────┬──────────┬──────────┬──────────┬──────────┐
   │ Fecha      │ Día      │ Entrada  │ Salida   │ Horas    │
   └────────────┴──────────┴──────────┴──────────┴──────────┘
   
4. Tabla muestra SOLO SUS registros (filtrar por employee_id)
5. Ordenar por fecha DESC (más recientes primero)
6. Mostrar MÁXIMO 5 registros
7. Después de 10 segundos: ejecutar logout() automáticamente

IMPORTANTE: 
- NO consultar Supabase para esta tabla (usar localStorage)
- Si no hay registros, mostrar mensaje: "No hay registros previos"

CÓDIGO AFECTADO:
- Función showEmployeeRecords()
- Función handleEmployeeAction()

═══════════════════════════════════════════════════════════════════

📋 REQUISITO 3: ORDEN DE HISTORIAL ADMIN

OBJETIVO: Registros más recientes aparecen primero en la vista de administrador.

IMPLEMENTAR:
1. Al cargar datos desde Supabase:
   - SELECT * FROM time_records ORDER BY timestamp DESC
   
2. Al cargar desde localStorage como fallback:
   - records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

3. Mantener orden DESC en:
   - renderRecordsTable()
   - renderFilteredRecords()
   - exportToExcel()

CÓDIGO AFECTADO:
- Función loadAdminData()
- Función renderRecordsTable()

═══════════════════════════════════════════════════════════════════

📋 REQUISITO 4: BOTONES EDITAR/ELIMINAR

OBJETIVO: Solo botón EDITAR visible, botón ELIMINAR completamente removido.

ACCIONES:
1. ELIMINAR COMPLETAMENTE:
   - Todos los botones con texto "Eliminar", "Delete", "🗑️"
   - Función deleteEmployee()
   - Cualquier referencia a DELETE en el código

2. MANTENER Y ASEGURAR:
   - Botón EDITAR (✏️) solo visible para Admin y Maestro
   - Modal de edición debe requerir justificación OBLIGATORIA
   - Validar que campo de motivo no esté vacío
   - Registrar en activity_log: "Usuario editó [campo] de [empleado] - Hora anterior: [X], Nueva: [Y] - Motivo: [Z]"

3. Ocultar botones de edición para empleados:
   - if (currentUser.role === 'employee') { ocultarBotonesEdicion(); }

CÓDIGO AFECTADO:
- HTML: Eliminar botones de delete
- Funciones: deleteEmployee(), deleteRecord()
- Modal de edición: Agregar validación de motivo

═══════════════════════════════════════════════════════════════════

📋 REQUISITO 5: GESTIÓN DE CONTRASEÑAS

OBJETIVO: Sistema seguro de cambio de contraseñas con validación robusta.

ESTRUCTURA:

A) EMPLEADOS:
   - NO pueden cambiar su propia contraseña desde la interfaz
   - Deben pedirlo al administrador
   - Eliminar cualquier campo de "Cambiar mi contraseña" de la interfaz de empleado

B) ADMIN:
   - Puede cambiar su propia contraseña (pestaña Configuración)
   - Puede cambiar contraseñas de empleados (botón en gestión de empleados)
   - NO puede cambiar contraseñas de otros admins
   - NO puede cambiar contraseña de Maestro

C) MAESTRO:
   - Puede cambiar su propia contraseña
   - Puede cambiar contraseñas de admins
   - Puede cambiar contraseñas de empleados

PROCESO DE CAMBIO (Opción B - Segura):
1. Modal con campos:
   - Contraseña actual: [____]
   - Nueva contraseña: [____]
   - Confirmar nueva: [____]
   
2. Validaciones:
   - Contraseña actual debe coincidir con la almacenada
   - Nueva contraseña debe cumplir especificaciones (ver abajo)
   - Confirmación debe ser idéntica a nueva
   - Mostrar errores específicos

3. Al cambiar:
   - Actualizar password en employees
   - Guardar en Supabase y localStorage
   - Registrar en activity_log: "[Usuario] cambió contraseña de [empleado]"
   - Mostrar toast de éxito
   - Limpiar campos

ESPECIFICACIONES DE CONTRASEÑAS (Nivel 2):

/**
 * ESPECIFICACIONES DE CONTRASEÑAS SEGURAS
 * 
 * Requisitos mínimos:
 * - Longitud: Mínimo 6 caracteres, máximo 20
 * - Composición obligatoria:
 *   · Al menos 1 letra (mayúscula o minúscula)
 *   · Al menos 1 número (0-9)
 * 
 * Ejemplos VÁLIDOS:
 * - abc123 ✓
 * - Pass01 ✓
 * - Juan2026 ✓
 * - Sistema9 ✓
 * 
 * Ejemplos INVÁLIDOS:
 * - 123456 ✗ (solo números)
 * - abcdef ✗ (solo letras)
 * - abc12 ✗ (menos de 6 caracteres)
 * - Pass ✗ (sin número)
 * - 2026 ✗ (menos de 6 y sin letra)
 * 
 * Contraseñas prohibidas (blacklist):
 * - 123456, password, qwerty, abc123
 * - 111111, 123123, admin123
 * 
 * Función de validación:
 */

function validatePassword(password) {
    // Longitud
    if (password.length < 6 || password.length > 20) {
        return {
            valid: false,
            error: 'La contraseña debe tener entre 6 y 20 caracteres'
        };
    }
    
    // Al menos una letra
    if (!/[a-zA-Z]/.test(password)) {
        return {
            valid: false,
            error: 'Debe contener al menos una letra'
        };
    }
    
    // Al menos un número
    if (!/[0-9]/.test(password)) {
        return {
            valid: false,
            error: 'Debe contener al menos un número'
        };
    }
    
    // Blacklist
    const weakPasswords = ['123456', 'password', 'qwerty', 'abc123', '111111', '123123', 'admin123'];
    if (weakPasswords.includes(password.toLowerCase())) {
        return {
            valid: false,
            error: 'Esta contraseña es muy común. Use una más segura'
        };
    }
    
    return { valid: true };
}

INTERFAZ DE CAMBIO:

Para Admin cambiando contraseña de empleado:
- Modal con campos: Nueva contraseña, Confirmar
- NO pedir contraseña actual del admin
- Validar con validatePassword()
- Actualizar y registrar en log

Para Admin/Maestro cambiando su propia contraseña:
- Modal con: Actual, Nueva, Confirmar
- Validar actual antes de permitir cambio
- Validar nueva con validatePassword()

CÓDIGO AFECTADO:
- Función changeOwnPassword()
- Función handleChangePassword()
- Modal de cambio de contraseña
- Agregar función validatePassword()

═══════════════════════════════════════════════════════════════════

📋 REQUISITO 6: LOGOUT POR INACTIVIDAD

OBJETIVO: Todos los usuarios cierran sesión automáticamente después de 60 segundos sin actividad.

COMPORTAMIENTO ACTUAL: Mantener (ya funciona)

ASEGURAR QUE:
1. Timer se resetea con:
   - Movimiento de mouse
   - Teclas presionadas
   - Clics
   
2. Después de 60 segundos:
   - Ejecutar logout()
   - NO intentar guardar nada
   - Limpiar todos los estados
   - Volver a pantalla de login
   - Registrar en log: "Cierre automático por inactividad - [usuario]"

3. Aplica a TODOS los roles (Empleado, Admin, Maestro)

CÓDIGO AFECTADO:
- Verificar función resetInactivityTimer()
- Asegurar que inactivityTimer = 60000 (60 segundos)

═══════════════════════════════════════════════════════════════════

📋 REQUISITO 7: CARGA OPTIMIZADA DE DATOS

OBJETIVO: Empleados NO cargan historial completo, solo Admin/Maestro.

IMPLEMENTAR:

1. Nueva función loadAdminData():
   - Se ejecuta SOLO cuando currentUser.role === 'admin' || 'master'
   - Consulta Supabase:
     · SELECT * FROM time_records ORDER BY timestamp DESC
     · SELECT * FROM activity_log ORDER BY timestamp DESC
   - Si falla (por RLS), usar localStorage como fallback
   - Actualizar variables globales: records, activityLog

2. Modificar loadData():
   - Solo cargar employees (necesario para login)
   - NO cargar time_records ni activity_log

3. Modificar showAdminInterface():
   - Llamar await loadAdminData() antes de renderizar
   - Luego ejecutar:
     · renderEmployeesGrid()
     · renderRecordsTable()
     · renderDashboard()
     · renderActivityLog()

4. Modificar showEmployeeInterface():
   - NO llamar a ninguna función que consulte Supabase para registros
   - Solo mostrar interfaz de marcación
   - Función showEmployeeRecords() usa datos de localStorage únicamente

CÓDIGO AFECTADO:
- Función loadData()
- Nueva función loadAdminData()
- Función showAdminInterface()
- Función showEmployeeInterface()

═══════════════════════════════════════════════════════════════════

📋 REQUISITO 8: GESTIÓN DE EMPLEADOS

OBJETIVO: Simplificar creación de empleados con validación de contraseñas.

MODAL DE AGREGAR EMPLEADO:

Campos:
- Nombre completo: [____]
- Contraseña inicial: [____]
- Confirmar contraseña: [____]

Validaciones:
- Nombre no vacío
- Contraseña cumple validatePassword()
- Confirmación coincide
- Mostrar requisitos en pantalla:
  "La contraseña debe tener:
   • Entre 6 y 20 caracteres
   • Al menos una letra
   • Al menos un número"

Al guardar:
- Crear employee en Supabase
- Crear employee en localStorage
- Registrar en activity_log
- Actualizar grid de empleados
- Limpiar formulario

CÓDIGO AFECTADO:
- Función handleAddEmployee()
- Modal addEmployeeModal

═══════════════════════════════════════════════════════════════════

📋 REQUISITO 9: EXPORTAR EXCEL - MODAL DE OPCIONES

OBJETIVO: Permitir exportar registros filtrados o rango personalizado.

IMPLEMENTAR:

1. Al hacer clic en "📊 Exportar Excel", mostrar modal:

   ┌─────────────────────────────────────┐
   │  Exportar Registros a Excel         │
   ├─────────────────────────────────────┤
   │                                     │
   │  Seleccione qué exportar:           │
   │                                     │
   │  ○ Registros filtrados actuales     │
   │     (X registros)                   │
   │                                     │
   │  ○ Todo el historial                │
   │     (Y registros)                   │
   │                                     │
   │  ○ Rango de fechas personalizado:   │
   │     Desde: [____] Hasta: [____]     │
   │                                     │
   │  [Cancelar]  [Exportar]             │
   └─────────────────────────────────────┘

2. Lógica:
   - Opción 1: Usa filteredRecords actual
   - Opción 2: Usa records completo
   - Opción 3: Filtra records por rango de fechas

3. Generar Excel con columnas:
   FECHA | DÍA | COLABORADOR | ENTRADA | SALIDA | HORAS (hh:mm:ss) | OBSERVACIONES

4. Nombre archivo: Horarios_[opción]_[fecha].xlsx
   - Ej: Horarios_Filtrados_30-01-2026.xlsx
   - Ej: Horarios_Completo_30-01-2026.xlsx
   - Ej: Horarios_15-01-2026_a_30-01-2026.xlsx

5. Registrar en activity_log

CÓDIGO AFECTADO:
- Función exportToExcel()
- Nuevo modal de exportación
- HTML para modal

═══════════════════════════════════════════════════════════════════

⚠️ IMPORTANTE - ANTES DE IMPLEMENTAR:

1. Muéstrame la lista de archivos que modificarás
2. Muéstrame las secciones específicas de código que cambiarás
3. Espera mi confirmación antes de hacer cambios masivos

DESPUÉS DE IMPLEMENTAR:

1. Genera un resumen de cambios realizados
2. Lista funciones nuevas agregadas
3. Lista funciones modificadas
4. Lista funciones eliminadas

MANTENER:
- Compatibilidad con localStorage (fallback)
- Doble guardado (Supabase + localStorage)
- Diseño actual (colores, estilos, disposición)
- Logs de actividad para TODAS las acciones importantes