# SCHEDULE - Arquitectura Modular

## 📁 Estructura del Proyecto

```
src/
├── config/                          # Configuraciones globales
│   └── supabase.config.js          # Cliente Supabase
│
├── utils/                           # Utilidades compartidas
│   ├── constants.util.js           # Constantes del sistema
│   ├── validation.util.js          # Validaciones
│   ├── dateTime.util.js            # Manejo de fechas/horas
│   └── localStorage.util.js        # Wrapper localStorage
│
├── modules/                         # Módulos de la aplicación
│   ├── auth/                       # Autenticación
│   │   ├── services/
│   │   │   ├── auth.service.js    # Login/Logout
│   │   │   └── password.service.js # Gestión contraseñas
│   │   └── index.js
│   │
│   ├── schedule/                   # Gestión de horarios
│   │   ├── services/
│   │   │   ├── employees.service.js      # CRUD empleados
│   │   │   ├── timeRecords.service.js    # CRUD registros
│   │   │   ├── activityLog.service.js    # Log de auditoría
│   │   │   └── records.service.js        # Lógica marcaciones
│   │   └── index.js
│   │
│   └── reports/                    # Reportes y exportación
│       ├── services/
│       │   └── export.service.js   # Exportación Excel
│       └── index.js
│
└── index.js                        # Export principal
```

---

## 🎯 Principios de Arquitectura

### 1. Separación de Responsabilidades

- **Services**: Contienen TODA la lógica de negocio y llamadas a Supabase
- **Components**: Solo presentación y UI (se crearán en FASE 2)
- **Utils**: Funciones puras y reutilizables
- **Config**: Configuraciones centralizadas

### 2. Manejo de Errores

Todos los servicios siguen este patrón:

```javascript
try {
  // Lógica principal
  return { success: true, data };
} catch (error) {
  console.error('Error:', error);
  return { success: false, error: error.message };
}
```

### 3. Fallback a localStorage

Todos los servicios intentan Supabase primero, luego fallback a localStorage:

```javascript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  return { success: true, data };
} catch (error) {
  // Usar localStorage como fallback
  return { success: true, data: getFromLocalStorage(), source: 'localStorage' };
}
```

### 4. Soft Delete

NO se eliminan datos, se marca `deleted_at`:

```javascript
// En lugar de DELETE
await supabase.from('table').delete().eq('id', id);

// Usamos UPDATE
await supabase.from('table').update({ deleted_at: new Date().toISOString() }).eq('id', id);
```

---

## 📋 Requisitos Implementados

### ✅ Requisito 1: Validación de Última Marcación
- **Servicio**: `auth.service.js` → `checkLastRecord()`
- Consulta Supabase para obtener último registro
- Determina si próxima acción es ENTRADA o SALIDA
- Fallback a localStorage si Supabase falla

### ✅ Requisito 2: Visualización para Empleados
- **Servicio**: `records.service.js` → `getEmployeeRecentRecords()`
- Muestra últimos registros del empleado
- Agrupa por fecha y empareja ENTRADA-SALIDA
- Calcula horas trabajadas

### ✅ Requisito 3: Orden Historial DESC
- Todos los servicios usan `ORDER BY timestamp DESC`
- Función `compareRecordsByTime()` para ordenamiento local

### ✅ Requisito 4: Editar Registros
- **Servicio**: `timeRecords.service.js` → `updateTimeRecord()`
- Validación de motivo obligatorio
- Registro detallado en activity_log

### ✅ Requisito 5: Gestión de Contraseñas (Nivel 2)
- **Servicio**: `password.service.js`
- Validación robusta: 6-20 caracteres, letra+número
- Blacklist de contraseñas débiles
- Permisos según rol (empleado/admin/maestro)

### ✅ Requisito 7: Carga Optimizada
- Servicios separados para empleados y admins
- `getAllEmployees()` vs `getAllTimeRecords()`

### ✅ Requisito 8: Gestión de Empleados
- **Servicio**: `employees.service.js`
- Validación exhaustiva con `validateEmployeeData()`
- CRUD completo con soft delete

### ✅ Requisito 9: Exportar Excel con Opciones
- **Servicio**: `export.service.js`
- Tres tipos: filtrados, completo, rango de fechas
- Preparación de datos con `prepareExportData()`

---

## 🔧 Uso de los Servicios

### Ejemplo 1: Login de Usuario

```javascript
import { login } from './modules/auth';

const handleLogin = async (password) => {
  const result = await login(password);
  
  if (result.success) {
    console.log('Usuario:', result.user);
    // Redirigir según rol
  } else {
    console.error('Error:', result.error);
  }
};
```

### Ejemplo 2: Registrar Asistencia

```javascript
import { recordAttendance } from './modules/schedule';

const handleMarkAttendance = async (employeeId, employeeName) => {
  const result = await recordAttendance(employeeId, employeeName);
  
  if (result.success) {
    console.log('Acción registrada:', result.currentAction);
    console.log('Próxima acción:', result.nextAction);
  }
};
```

### Ejemplo 3: Exportar a Excel

```javascript
import { exportToExcel, EXPORT_TYPES } from './modules/reports';

const handleExport = async (currentUser) => {
  const options = {
    type: EXPORT_TYPES.ALL
  };
  
  const result = await exportToExcel(options, currentUser);
  
  if (result.success) {
    console.log('Archivo:', result.fileName);
    console.log('Registros:', result.recordCount);
    // Usar result.data con librería XLSX
  }
};
```

---

## 🛠️ Validaciones Disponibles

### Contraseñas (Nivel 2)

```javascript
import { validatePassword } from './utils/validation.util';

const result = validatePassword('abc123');
if (!result.valid) {
  console.error(result.error);
}
```

### Datos de Empleado

```javascript
import { validateEmployeeData } from './utils/validation.util';

const data = {
  name: 'Juan Pérez',
  cedula: '12345678',
  password: 'pass123'
};

const result = validateEmployeeData(data);
if (!result.valid) {
  console.error(result.errors);
}
```

---

## 📊 Utilidades de Fecha/Hora

```javascript
import { 
  parseHoraToHms, 
  parseFechaEsCO,
  getCurrentDateCO,
  calculateHoursBetweenRecords 
} from './utils/dateTime.util';

// Parsear hora colombiana
const hora = parseHoraToHms('06:30:00 p.m.'); // { h: 18, m: 30, s: 0 }

// Fecha actual colombiana
const fecha = getCurrentDateCO(); // "04/02/2026"

// Calcular horas trabajadas
const horas = calculateHoursBetweenRecords(entradaRecord, salidaRecord);
console.log(horas); // "08:30:00"
```

---

## 🔐 Constantes del Sistema

```javascript
import { ROLES, RECORD_TYPES, LOG_ACTIONS, TIME_CONFIG } from './utils/constants.util';

// Verificar rol
if (user.role === ROLES.ADMIN) {
  // Acceso de administrador
}

// Tipo de registro
const tipo = RECORD_TYPES.ENTRADA; // 'ENTRADA'

// Registrar actividad
await logActivity(LOG_ACTIONS.LOGIN, 'Detalles', userName);

// Timeout de inactividad
setTimeout(logout, TIME_CONFIG.INACTIVITY_TIMEOUT); // 60000ms
```

---

## 💾 localStorage Wrapper

```javascript
import { 
  getEmployees, 
  saveEmployees,
  getTimeRecords,
  saveTimeRecords 
} from './utils/localStorage.util';

// Obtener datos
const employees = getEmployees(); // Array
const records = getTimeRecords(); // Array

// Guardar datos
saveEmployees(updatedEmployees);
saveTimeRecords(updatedRecords);
```

---

## 🚀 Próximos Pasos (FASE 2)

1. **Crear Context API** para estado global
2. **Componentes React** para UI
3. **Hooks personalizados** para lógica de presentación
4. **Integración** de servicios con componentes
5. **Testing** unitario y de integración

---

## 📝 Notas Importantes

- **Sin UI**: Esta fase NO incluye componentes React ni JSX
- **Solo Lógica**: Toda la lógica de negocio está lista para ser consumida
- **Preparado para React**: Los servicios retornan objetos `{ success, data, error }` ideales para hooks
- **Máx 300 líneas**: Todos los archivos respetan el límite de `.cursorrules`
- **Try-Catch**: Todo el código asíncrono tiene manejo de errores
- **Soft Delete**: Integridad de datos garantizada

---

## 🧪 Testing Manual

Para probar los servicios en Node.js:

```javascript
// test.js
import { login } from './src/modules/auth/index.js';

const testLogin = async () => {
  const result = await login('111111');
  console.log(result);
};

testLogin();
```

---

## 📚 Referencias

- **Refact.txt**: Requisitos del sistema
- **.cursorrules**: Estándares de código
- **database.sql**: Esquema de base de datos
- **MASTER_SPEC_V3.md**: Especificación completa

---

**Versión**: 1.0.0 (FASE 1 - Servicios y Lógica)
**Fecha**: Febrero 2026
**Autor**: Arquitecto Senior Full Stack
