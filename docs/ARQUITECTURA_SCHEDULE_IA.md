# 🏛️ ARQUITECTURA SCHEDULE - SOLO IA

**Versión:** 4.0  
**Para:** Cursor/Claude  
**Optimizado:** Mínimos tokens

---

## ROL ASISTENTE IA

Implementar Excelencia Técnica bajo protocolo Rigor de Producción.

MANDATOS:
- Async/await + try/catch obligatorio
- Imports con alias @
- Archivos < 300 líneas
- NO mocks/simulaciones
- NO console.log producción

PROHIBICIONES:
- Modificar arquitectura sin aprobación
- Inventar funcionalidades
- Datos hardcodeados
- Cambios no autorizados

---

## ESTRUCTURA PROYECTO

```
src/
├── config/supabase.config.js
├── context/AuthContext.jsx
├── services/
│   ├── auth/
│   │   ├── auth.service.js
│   │   └── password.service.js
│   ├── attendance/
│   │   ├── attendance.service.js
│   │   ├── pairs.service.js
│   │   └── index.js
│   └── schedule/
│       ├── employees.service.js
│       ├── timeRecords.service.js
│       └── activityLog.service.js
├── components/
│   ├── common/
│   │   ├── Input.jsx
│   │   ├── Button.jsx
│   │   ├── Toast.jsx
│   │   └── index.js
│   ├── auth/LoginScreen.jsx
│   ├── admin/AdminView.jsx
│   └── employee/EmployeeView.jsx
└── utils/
    ├── constants.util.js
    ├── validation.util.js
    ├── dateTime.util.js
    └── localStorage.util.js
```

---

## BASE DE DATOS

### employees
```
id SERIAL PRIMARY KEY
name TEXT NOT NULL
cedula TEXT UNIQUE NOT NULL
password TEXT NOT NULL
role TEXT CHECK (employee, admin, master)
blocked BOOLEAN DEFAULT FALSE
created_at TIMESTAMPTZ
deleted_at TIMESTAMPTZ
```

### time_records
```
id SERIAL PRIMARY KEY
employee_id INT REFERENCES employees(id)
employee_name TEXT NOT NULL
fecha TEXT NOT NULL
dia TEXT NOT NULL
tipo TEXT CHECK (ENTRADA, SALIDA)
hora TEXT NOT NULL
timestamp TIMESTAMPTZ
tiempo_almuerzo TEXT DEFAULT '02:00'
tiempo_almuerzo_editado BOOLEAN DEFAULT FALSE
licencia_remunerada BOOLEAN DEFAULT FALSE
total_horas TEXT
total_horas_decimal DECIMAL(5,2)
observaciones TEXT DEFAULT ''
created_at TIMESTAMPTZ
deleted_at TIMESTAMPTZ
```

### activity_log
```
id SERIAL PRIMARY KEY
timestamp TIMESTAMPTZ
user_name TEXT NOT NULL
action TEXT NOT NULL
details TEXT
created_at TIMESTAMPTZ
```

INDICES:
```sql
CREATE INDEX idx_parejas ON time_records(employee_id, fecha, tipo, deleted_at);
CREATE INDEX idx_employee ON time_records(employee_id);
CREATE INDEX idx_timestamp ON time_records(timestamp DESC);
```

RLS: SIEMPRE ACTIVO
Políticas permiten INSERT/SELECT/UPDATE en todas las tablas.

---

## AUTENTICACION

Login: cedula + password
Validación: texto plano (sin bcrypt)
Sesión: sessionStorage (NO localStorage)
Redirección por rol

ROLES Y TIMEOUTS:
- Colaborador: 10s inactividad
- Admin: 60s inactividad
- Maestro: 60s inactividad

CREDENCIALES PRODUCCION:
```
10101010 / Lukas2026 (master)
20202020 / Admin2026 (admin)
30303030 / Belisario2026 (employee)
```

---

## FORMATOS OBLIGATORIOS

```
fecha: DD/MM/YYYY
hora: HH:MM (24h, SIN segundos)
dia: lunes, martes... (minusculas)
```

FORMULA DECIMAL:
```javascript
total_decimal = hours + (minutes/60)
```

TIEMPO ALMUERZO:
- Default: 02:00
- Rango: 00:00 - 02:00
- Editable UNA vez
- Bloqueo: con Enter

---

## LOGICA NEGOCIO

PAREJAS ENTRADA/SALIDA:
Agrupar mismo dia en 1 fila.
Calcular: SALIDA - ENTRADA - ALMUERZO = TOTAL

ULTIMOS 10 REGISTROS:
Mostrar ultimos 10 PARES ordenados DESC.

VALIDACION MARCACION:
- Ultima = ENTRADA → Proxima = SALIDA
- Ultima = SALIDA → Proxima = ENTRADA
- Sin registros → Proxima = ENTRADA

---

## CONFIGURACION

.env:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

vite.config.js:
```javascript
resolve: {
  alias: { '@': path.resolve(__dirname, './src') }
}
```

vercel.json:
```json
{
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
}
```

---

## DEPLOYMENT

```bash
git add .
git commit -m "mensaje"
git push
```

Vercel auto-deploya en 1-2 min.

---

## SOFT DELETE OBLIGATORIO

NO usar DELETE.
Usar UPDATE SET deleted_at = NOW().

---

## CRITERIOS EXITO

Codigo aceptable si:
1. Funciona localhost + produccion
2. 0 errores consola
3. Formatos correctos (HH:MM, DD/MM/YYYY)
4. Formulas exactas documento
5. NO rompe funcionalidad existente
6. Try/catch presente
7. < 300 lineas

---

ULTIMA ACTUALIZACION: 06 Feb 2026
VERSION: 4.0
STATUS: PRODUCCION

ACTUALIZACION ARQUITECTURA - FIX 5

AGREGAR A @ARQUITECTURA_SCHEDULE_IA.md

SECCION: ESTRUCTURA BASE DATOS

time_records:
- id (PK)
- employee_id (FK)
- employee_name
- fecha
- dia
- tipo (ENTRADA/SALIDA)
- hora
- timestamp
- tiempo_almuerzo
- tiempo_almuerzo_editado
- observacion_1 (NUEVO FIX 5)
- observacion_1_editado (NUEVO FIX 5)
- observacion_2 (NUEVO FIX 5)
- observacion_2_editado (NUEVO FIX 5)
- observacion_3 (NUEVO FIX 5)
- observacion_3_editado (NUEVO FIX 5)
- licencia_remunerada
- created_at
- deleted_at

employees:
- id (PK)
- name
- cedula (UNIQUE)
- password
- role (employee/admin/master)
- blocked (NUEVO FIX 5)
- created_at
- deleted_at

SECCION: COMPONENTES ADMIN

AdminView.jsx:
- Vista Parejas (todos registros, filtros interactivos, observaciones 3 col)
- Vista Tiempo Real (todos registros, filtros, sin observaciones)
- Vista Configuracion (timeouts, gestion usuarios)

Modals:
- AddUserModal (validaciones, generador password)
- UsersListModal (bloquear, cambiar password)
- ChangePasswordModal (generador password)
- ConfigView (timeouts)

SECCION: REGLAS NEGOCIO NUEVAS

Observaciones (FIX 5):
- 3 campos independientes por ENTRADA
- Editable una sola vez
- Se bloquea al guardar
- Solo visible Vista Parejas
- NO en Tiempo Real

Validaciones Usuario (FIX 5):
- Cedula: 7-10 digitos numericos
- Nombre: solo letras y espacios
- Password: min 6 caracteres
- Generador: 10 caracteres aleatorios

Bloqueo Usuario (FIX 5):
- Campo blocked en DB
- Validacion en login
- Toggle en gestion usuarios
- Actualiza reactivo

SECCION: FLUJOS ADMIN

Agregar Usuario:
1. Click Agregar Usuario
2. Modal abre
3. Completar campos (validaciones)
4. Opcional: Generar password
5. Submit
6. Verificar cedula unica
7. Insert DB
8. Actualizar lista

Bloquear Usuario:
1. Gestion Usuarios
2. Lista usuarios
3. Click Bloquear
4. Update blocked=true
5. Usuario no puede login

Cambiar Password:
1. Gestion Usuarios
2. Click Cambiar Pass usuario
3. Modal abre
4. Opcional: Generar password
5. Confirmar password
6. Update DB
7. Usuario login con nueva

Editar Observacion:
1. Vista Parejas
2. Click columna Obs 1/2/3
3. Input abre
4. Escribir texto
5. Enter guarda
6. Update DB + flag editado
7. Campo bloquea
8. Actualiza todas vistas sin refresh