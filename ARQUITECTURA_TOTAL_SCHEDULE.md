# 🏛️ ARQUITECTURA TOTAL DEL SISTEMA SCHEDULE
## ÚNICA FUENTE DE VERDAD - DOCUMENTO MAESTRO

**Versión:** 4.0  
**Fecha:** 06 Febrero 2026  
**Status:** PRODUCCIÓN  
**Cliente:** Imagen Marquillas SAS

---

## 🎯 ROL Y COMPORTAMIENTO DEL ASISTENTE IA

Implementar la Excelencia Técnica.
Trabaja bajo el protocolo de Rigor de Producción.

Esto incluye:
- **Comandos de Rigor:** Prohibido usar mocks, simulaciones o datos hardcodeados
- **Mapeo de Archivos (@):** Referencias directas y exactas a archivos existentes
- **Validación de Protocolo:** Alineación obligatoria con este documento

### MANDATOS OBLIGATORIOS:
✅ SIEMPRE leer @.cursorrules antes de cualquier cambio  
✅ SIEMPRE usar async/await + try/catch  
✅ SIEMPRE usar alias @ para imports  
✅ NUNCA crear archivos > 300 líneas  
✅ NUNCA modificar arquitectura sin aprobación  
✅ NUNCA usar console.log() en producción  

### PROHIBICIONES ABSOLUTAS:
❌ Mocks o simulaciones  
❌ Datos hardcodeados  
❌ Cambios no autorizados en servicios  
❌ Inventar funcionalidades  
❌ "Optimizaciones" que bajan calidad  

---

## 📁 ESTRUCTURA DEL PROYECTO

```
SCHEDULE/
├── .cursorrules                    ⚠️ LEER SIEMPRE ANTES DE CAMBIOS
├── .env                            🔒 Variables de entorno (NO subir a Git)
├── vercel.json                     ⚙️ Config SPA routing
├── package.json                    📦 Dependencias
├── vite.config.js                  ⚙️ Config Vite + alias @
├── index.html                      🌐 Entry point
│
├── src/
│   ├── main.jsx                    🚀 Bootstrap React
│   ├── App.jsx                     🎯 Router principal
│   │
│   ├── config/
│   │   └── supabase.config.js     🔌 Cliente Supabase
│   │
│   ├── context/
│   │   └── AuthContext.jsx        👤 Estado global autenticación
│   │
│   ├── services/                   🧠 LÓGICA DE NEGOCIO (NO TOCAR SIN REVISAR)
│   │   ├── auth/
│   │   │   ├── auth.service.js    🔐 Login/Logout
│   │   │   └── password.service.js 🔑 Gestión contraseñas
│   │   ├── attendance/
│   │   │   ├── attendance.service.js  ⏱️ Marcación asistencia
│   │   │   ├── pairs.service.js       📊 Parejas ENTRADA/SALIDA
│   │   │   └── index.js               📤 Exports
│   │   └── schedule/
│   │       ├── employees.service.js   👥 CRUD empleados
│   │       ├── timeRecords.service.js 📝 CRUD registros
│   │       └── activityLog.service.js 📋 Auditoría
│   │
│   ├── components/                 🎨 INTERFAZ DE USUARIO
│   │   ├── common/
│   │   │   ├── Input.jsx          📝 Input reutilizable
│   │   │   ├── Button.jsx         🔘 Botón reutilizable
│   │   │   ├── Toast.jsx          💬 Notificaciones
│   │   │   └── index.js
│   │   ├── auth/
│   │   │   └── LoginScreen.jsx    🔐 Pantalla login
│   │   ├── admin/
│   │   │   └── AdminView.jsx      👨‍💼 Vista Admin/Maestro
│   │   └── employee/
│   │       └── EmployeeView.jsx   👷 Vista Colaborador
│   │
│   ├── utils/                      🛠️ UTILIDADES (ESTABLES)
│   │   ├── constants.util.js      📌 Constantes sistema
│   │   ├── validation.util.js     ✅ Validadores
│   │   ├── dateTime.util.js       📅 Manejo fechas
│   │   └── localStorage.util.js   💾 Wrapper localStorage
│   │
│   └── styles/
│       └── index.css              🎨 Estilos Tailwind
│
└── archive_old/                    📦 Sistema antiguo (NO USAR)
```

---

## 🗄️ BASE DE DATOS (SUPABASE)

### Tablas Principales:

#### 1. **employees**
```sql
id              SERIAL PRIMARY KEY
name            TEXT NOT NULL
cedula          TEXT UNIQUE NOT NULL         -- Tipo TEXT (crítico)
password        TEXT NOT NULL
role            TEXT CHECK (employee, admin, master)
blocked         BOOLEAN DEFAULT FALSE
created_at      TIMESTAMP WITH TIME ZONE
deleted_at      TIMESTAMP WITH TIME ZONE     -- Soft delete
```

#### 2. **time_records**
```sql
id                      SERIAL PRIMARY KEY
employee_id             INTEGER REFERENCES employees(id)
employee_name           TEXT NOT NULL                    -- Desnormalizado
fecha                   TEXT NOT NULL                    -- Formato: DD/MM/YYYY
dia                     TEXT NOT NULL                    -- "lunes", "martes"...
tipo                    TEXT CHECK (ENTRADA, SALIDA)
hora                    TEXT NOT NULL                    -- Formato: HH:MM (24h)
timestamp               TIMESTAMP WITH TIME ZONE         -- UTC auto
tiempo_almuerzo         TEXT DEFAULT '02:00'             -- Formato: HH:MM
tiempo_almuerzo_editado BOOLEAN DEFAULT FALSE            -- Bloqueo edición
licencia_remunerada     BOOLEAN DEFAULT FALSE
total_horas             TEXT                             -- Formato: HH:MM
total_horas_decimal     DECIMAL(5,2)                     -- Para nómina
observaciones           TEXT DEFAULT ''
created_at              TIMESTAMP WITH TIME ZONE
deleted_at              TIMESTAMP WITH TIME ZONE         -- Soft delete
```

**ÍNDICES CRÍTICOS:**
```sql
CREATE INDEX idx_parejas ON time_records(employee_id, fecha, tipo, deleted_at);
CREATE INDEX idx_time_records_employee ON time_records(employee_id);
CREATE INDEX idx_time_records_timestamp ON time_records(timestamp DESC);
```

#### 3. **activity_log**
```sql
id          SERIAL PRIMARY KEY
timestamp   TIMESTAMP WITH TIME ZONE
user_name   TEXT NOT NULL
action      TEXT NOT NULL
details     TEXT
created_at  TIMESTAMP WITH TIME ZONE
```

### Políticas RLS (Row Level Security):

**SIEMPRE ACTIVAS** - NUNCA DESHABILITAR EN PRODUCCIÓN

```sql
-- Employees: Lectura pública (para login)
CREATE POLICY "auth_select" ON employees FOR SELECT USING (true);

-- Time Records: Insert/Select permitido
CREATE POLICY "time_records_insert" ON time_records FOR INSERT WITH CHECK (true);
CREATE POLICY "time_records_select" ON time_records FOR SELECT USING (true);
CREATE POLICY "time_records_update" ON time_records FOR UPDATE USING (true);

-- Activity Log: Insert permitido
CREATE POLICY "activity_log_insert" ON activity_log FOR INSERT WITH CHECK (true);
```

---

## 🔐 SEGURIDAD Y AUTENTICACIÓN

### Flujo de Login:
1. Usuario ingresa **cédula + contraseña** (NO solo contraseña)
2. Frontend valida formato (cédula: texto, password: 6-20 chars)
3. `auth.service.js` consulta Supabase
4. Verifica usuario no bloqueado
5. Valida contraseña en texto plano (sin bcrypt por ahora)
6. Genera sesión en `sessionStorage` (NO localStorage)
7. Redirige según rol

### Roles y Permisos:

| Rol | Timeout | Puede |
|-----|---------|-------|
| **Colaborador** | 10 seg inactividad | Marcar asistencia, Ver últimos 10 pares |
| **Admin** | 60 seg inactividad | Todo de Colaborador + Ver todos los registros + Exportar |
| **Maestro** | 60 seg inactividad | Todo de Admin + Editar registros + Gestionar usuarios |

### Credenciales de Producción:

```
Lukas Maestro:     10101010 / Lukas2026     (master)
Admin Proyectos:   20202020 / Admin2026     (admin)
Belisario Empleado: 30303030 / Belisario2026 (employee)
```

---

## ⚙️ CONFIGURACIÓN CRÍTICA

### Variables de Entorno (.env):

```bash
VITE_SUPABASE_URL=https://npyzeaylvxqbjbzmys.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**NUNCA subir .env a Git** - Usar variables de Vercel

### Alias de Imports (vite.config.js):

```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

**USO OBLIGATORIO:** Todos los imports deben usar `@/`

```javascript
✅ import { login } from '@/services/auth/auth.service';
❌ import { login } from '../../../services/auth/auth.service';
```

### Routing SPA (vercel.json):

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**CRÍTICO:** Sin este archivo, Vercel retorna 404 en rutas de React Router

---

## 📐 REGLAS DE FORMATO (OBLIGATORIAS)

### Fechas y Horas:

```javascript
// CORRECTO:
fecha: "DD/MM/YYYY"     // Ejemplo: "06/02/2026"
hora: "HH:MM"           // Ejemplo: "14:30" (24h)
dia: "lunes"            // Minúsculas

// INCORRECTO:
fecha: "2026-02-06"     // ❌ No usar ISO
hora: "14:30:00"        // ❌ No incluir segundos en display
hora: "2:30 PM"         // ❌ No usar formato 12h
```

### Cálculo de Horas:

```javascript
// FÓRMULA OBLIGATORIA (del documento Excel original):
total_horas_decimal = HORA + (MINUTO/60) + (SEGUNDO/3600)

// Ejemplo:
// 8 horas, 30 minutos, 0 segundos
// = 8 + (30/60) + (0/3600)
// = 8 + 0.5 + 0
// = 8.50
```

### Tiempo de Almuerzo:

```
- Default: "02:00"
- Formato: "HH:MM"
- Rango: "00:00" - "02:00"
- Editable: UNA sola vez
- Bloqueo: Al presionar Enter (no con botones)
```

---

## 🎯 LÓGICA DE NEGOCIO CRÍTICA

### Parejas ENTRADA/SALIDA:

**REQUISITO:** Agrupar registros del mismo día en una sola fila

```
Día 1:
  ENTRADA: 08:00
  SALIDA: 18:00
  → Mostrar en 1 fila con ambas horas

Día 2:
  ENTRADA: 08:15
  → Mostrar solo ENTRADA (salida vacía)
```

**Cálculo:**
```
Total = HORA_SALIDA - HORA_ENTRADA - TIEMPO_ALMUERZO
```

### Últimos 10 Registros:

**REQUISITO:** Mostrar solo últimos 10 PARES ordenados DESC (más reciente primero)

```javascript
// CORRECTO:
pairs.slice(0, 10)  // Primeros 10 después de ordenar DESC

// INCORRECTO:
records.slice(-10)  // ❌ Últimos 10 sin considerar parejas
```

### Validación de Marcación:

**REQUISITO:** Prevenir marcaciones duplicadas

```javascript
// LÓGICA OBLIGATORIA:
Última marcación = ENTRADA → Próxima debe ser SALIDA
Última marcación = SALIDA → Próxima debe ser ENTRADA
Sin marcaciones → Próxima debe ser ENTRADA
```

---

## 🚀 FLUJO DE DEPLOYMENT

### 1. Desarrollo Local:
```bash
npm run dev  # Puerto 3001
```

### 2. Build:
```bash
npm run build  # Genera carpeta dist/
```

### 3. Git:
```bash
git add .
git commit -m "Descripción clara del cambio"
git push origin main
```

### 4. Vercel (Automático):
- Detecta push a `main`
- Ejecuta `npm run build`
- Deploya a producción
- Tiempo: 1-2 minutos

### 5. Verificación:
- Abrir URL producción
- Probar funcionalidad crítica
- Verificar 0 errores en consola

---

## 📋 CHECKLIST DE CALIDAD

### Antes de Cada Commit:

- [ ] Leí @.cursorrules
- [ ] Código < 300 líneas por archivo
- [ ] Try/catch en todas las funciones async
- [ ] Imports usan alias @/
- [ ] 0 console.log() en producción
- [ ] 0 datos hardcodeados
- [ ] 0 mocks o simulaciones
- [ ] Formatos correctos (HH:MM, DD/MM/YYYY)
- [ ] Funciona en localhost
- [ ] Sin errores en consola

### Antes de Push a Producción:

- [ ] Build exitoso (`npm run build`)
- [ ] Testing manual completado
- [ ] Sin cambios en schema DB (o migration lista)
- [ ] Variables de entorno verificadas
- [ ] Backup de Supabase reciente (< 24h)

---

## 🛡️ PROTECCIÓN DE DATOS

### Soft Delete (OBLIGATORIO):

```javascript
// ❌ NUNCA HACER ESTO:
DELETE FROM employees WHERE id = 123;

// ✅ SIEMPRE HACER ESTO:
UPDATE employees SET deleted_at = NOW() WHERE id = 123;
```

### Backup:

**Frecuencia:** Semanal (todos los lunes)  
**Método:** Supabase Dashboard → Database → Export  
**Ubicación:** Google Drive  
**Retención:** 4 semanas

---

## 📊 MONITORING Y LOGS

### Vercel Dashboard:
- Deployments: Historial de deploys
- Analytics: Tráfico y pageviews
- Logs: Errores en tiempo real

### Supabase Dashboard:
- Table Editor: Ver/editar datos
- SQL Editor: Ejecutar queries
- Logs: Queries y errores

### Activity Log (en app):
Registra automáticamente:
- Login/Logout
- Marcaciones
- Ediciones de registros
- Cambios de contraseña
- Exportaciones

---

## 🔧 MANTENIMIENTO

### Actualización de Dependencias:

```bash
# Revisar outdated
npm outdated

# Actualizar (con cuidado)
npm update

# Probar
npm run dev
npm run build
```

**Frecuencia:** Mensual  
**Precaución:** Siempre en rama de desarrollo primero

### Limpieza de Logs:

```sql
-- Ejecutar mensualmente en Supabase
DELETE FROM activity_log 
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 🚨 INCIDENTES COMUNES

### 404 en Vercel:
**Causa:** Falta `vercel.json`  
**Fix:** Agregar archivo con rewrites SPA

### RLS bloquea queries:
**Causa:** Políticas mal configuradas  
**Fix:** Revisar policies en Supabase

### Variables de entorno no funcionan:
**Causa:** No tienen prefijo `VITE_`  
**Fix:** Renombrar en `.env` y Vercel

### Build falla:
**Causa:** Error de sintaxis o import roto  
**Fix:** Ver logs en Vercel, corregir en local

---

## 📚 DOCUMENTOS RELACIONADOS

### Documentos de Referencia (SIEMPRE consultar):
1. **@.cursorrules** - Reglas del proyecto
2. **Estructura y normas de SCHEDULE.pdf** - Requisitos funcionales
3. **database.sql** - Schema de base de datos
4. **Este documento** - Arquitectura total

### Orden de Prioridad en Caso de Conflicto:
1. Este documento (Arquitectura Total)
2. Estructura y normas de SCHEDULE.pdf
3. @.cursorrules
4. Código existente

---

## 🎓 PRINCIPIOS DE DESARROLLO

### Clean Code:
- Nombres descriptivos
- Funciones pequeñas (< 50 líneas)
- Un propósito por función
- Comentarios solo cuando necesario

### DRY (Don't Repeat Yourself):
- Utilidades reutilizables
- Servicios modulares
- Componentes comunes

### SOLID:
- Single Responsibility
- Open/Closed
- Dependency Inversion

### Defensive Programming:
- Validar TODOS los inputs
- Manejar TODOS los errores
- Never trust user input
- Always expect the unexpected

---

## ✅ CRITERIOS DE ÉXITO

Un cambio es ACEPTABLE si cumple TODO esto:

1. ✅ Código funciona en localhost
2. ✅ Código funciona en producción
3. ✅ 0 errores en consola
4. ✅ 0 warnings de ESLint
5. ✅ Cumple formato (HH:MM, DD/MM/YYYY)
6. ✅ Usa fórmulas exactas del documento
7. ✅ No rompe funcionalidad existente
8. ✅ Está documentado en este archivo
9. ✅ Tiene try/catch
10. ✅ < 300 líneas

Si falta UNO solo → RECHAZAR cambio

---

## 🏆 ESTÁNDARES DE EXCELENCIA

Este proyecto NO es un MVP rápido.  
Este proyecto ES la base de un ERP enterprise.

**Filosofía:**
- Calidad > Velocidad
- Correcto > Rápido
- Mantenible > Clever
- Documentado > Obvio

**Objetivo:**
Sistema que pueda escalar de 50 a 5,000 empleados sin reescritura.

---

## 📞 CONTACTO Y OWNERSHIP

**Cliente:** Imagen Marquillas SAS  
**Owner:** Lukas Muñoz  
**Email:** lukas.munoz@imagenmarquillas.com  
**Deployment:** https://schedule-eta-mauve.vercel.app

---

**ÚLTIMA ACTUALIZACIÓN:** 06 Febrero 2026  
**VERSIÓN:** 4.0  
**STATUS:** PRODUCCIÓN ACTIVA

---

## ⚠️ NOTA FINAL PARA ASISTENTES IA

**ANTES de hacer CUALQUIER cambio:**

1. LEE este documento completo
2. LEE @.cursorrules
3. LEE el documento "Estructura y normas"
4. VERIFICA que el cambio está alineado
5. PREGUNTA si tienes dudas

**NO intentes ser "eficiente" bajando calidad.**  
**NO inventes funcionalidades no solicitadas.**  
**NO modifiques arquitectura sin aprobación.**

La excelencia técnica NO es negociable.
