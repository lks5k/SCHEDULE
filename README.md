# 🔐 SCHEDULE - Sistema de Gestión de Horarios

Sistema profesional de control de asistencia y horarios para **Imagen Marquillas SAS**.

## 🚀 Estado del Proyecto

### ✅ FASE 1 COMPLETADA (Servicios y Lógica)

- ✅ Arquitectura modular implementada
- ✅ 35+ servicios de lógica de negocio
- ✅ Integración con Supabase + fallback localStorage
- ✅ Validaciones robustas (Nivel 2)
- ✅ Sistema de auditoría completo
- ✅ Exportación a Excel

### 🚧 FASE 2 EN PROGRESO (UI/React)

- 🚧 Componentes React
- 🚧 Context API
- 🚧 Custom Hooks
- 🚧 Interfaz de usuario moderna

---

## 📦 Tecnologías

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL)
- **Estilos**: CSS Modules / Tailwind (pendiente)
- **Build**: Vite
- **Librerías**: XLSX, Supabase Client

---

## 🛠️ Instalación

### Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase configurada

### Pasos

1. **Clonar e instalar dependencias**

```bash
cd SCHEDULE
npm install
```

2. **Configurar variables de entorno**

Crear/editar `.env`:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

3. **Ejecutar base de datos**

Ejecutar el script `database.sql` en tu proyecto Supabase.

4. **Iniciar desarrollo**

```bash
npm run dev
```

La aplicación se abrirá en `http://localhost:3000`

---

## 📁 Estructura del Proyecto

```
SCHEDULE/
├── src/
│   ├── config/              # Configuraciones (Supabase)
│   ├── utils/               # Utilidades compartidas
│   ├── modules/             # Módulos de negocio
│   │   ├── auth/           # Autenticación
│   │   ├── schedule/       # Gestión de horarios
│   │   └── reports/        # Reportes y exportación
│   ├── components/         # Componentes React (FASE 2)
│   ├── hooks/              # Custom hooks (FASE 2)
│   ├── context/            # Context API (FASE 2)
│   ├── styles/             # Estilos globales
│   ├── App.jsx             # Componente principal
│   ├── main.jsx            # Punto de entrada
│   └── index.js            # Exports centralizados
│
├── archive_old/            # Archivos del sistema anterior
├── public/                 # Archivos públicos
├── .env                    # Variables de entorno
├── vite.config.js         # Configuración de Vite
├── package.json           # Dependencias
└── README.md              # Este archivo
```

---

## 🎯 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo

# Producción
npm run build        # Construye para producción
npm run preview      # Preview del build

# Calidad de código
npm run lint         # Ejecuta ESLint
```

---

## 🔐 Credenciales de Prueba

### Sistema Actual (archivo)

- **Maestro**: `111111`
- **Admin**: `222222`
- **Empleado**: `333333` (Belisario Corrales)

### Base de Datos Supabase

Ejecutar el script en `database.sql` que crea:
- Usuario Maestro: Cédula `12345`, Password `Admin123`

---

## 📚 Documentación Técnica

### Servicios Disponibles

Ver documentación completa en:
- `src/README.md` - Guía de servicios
- `FASE1_COMPLETADA.md` - Resumen FASE 1

### Módulos Principales

#### 1. **Auth** (Autenticación)
```javascript
import { login, logout, checkLastRecord } from '@/modules/auth';

// Login
const result = await login('111111');
if (result.success) {
  console.log('Usuario:', result.user);
}
```

#### 2. **Schedule** (Horarios)
```javascript
import { recordAttendance, getAllEmployees } from '@/modules/schedule';

// Marcar asistencia
const result = await recordAttendance(employeeId, employeeName);
```

#### 3. **Reports** (Reportes)
```javascript
import { exportToExcel, EXPORT_TYPES } from '@/modules/reports';

// Exportar a Excel
const result = await exportToExcel({ type: EXPORT_TYPES.ALL }, user);
```

---

## 🔒 Seguridad

- ✅ Validación de contraseñas Nivel 2 (6-20 caracteres, letra+número)
- ✅ Blacklist de contraseñas débiles
- ✅ Soft delete (integridad de datos)
- ✅ Log de auditoría completo
- ✅ RLS en Supabase (Row Level Security)
- ✅ Variables de entorno para credenciales

---

## 📊 Características Implementadas

### Gestión de Empleados
- ✅ CRUD completo
- ✅ Bloqueo/desbloqueo
- ✅ Búsqueda por cédula
- ✅ Soft delete

### Control de Asistencia
- ✅ Marcación automática ENTRADA/SALIDA
- ✅ Validación de última marcación
- ✅ Cálculo de horas trabajadas
- ✅ Visualización de registros

### Reportes
- ✅ Exportación a Excel
- ✅ Filtros personalizados
- ✅ Rango de fechas
- ✅ Estadísticas

### Auditoría
- ✅ Log de todas las acciones
- ✅ Filtrado por usuario y fecha
- ✅ Trazabilidad completa

---

## 🚀 Próximos Pasos (FASE 2)

1. **Context API**: Estado global de la aplicación
2. **Custom Hooks**: 
   - `useAuth()` - Gestión de autenticación
   - `useSchedule()` - Gestión de horarios
   - `useRecords()` - Marcaciones
3. **Componentes React**:
   - LoginScreen
   - EmployeeInterface
   - AdminInterface
   - RecordsTable
   - EmployeeGrid
4. **Tailwind CSS**: Sistema de diseño moderno
5. **Testing**: Unit tests y E2E

---

## 🤝 Contribución

Este es un proyecto privado de **Imagen Marquillas SAS**.

---

## 📄 Licencia

UNLICENSED - Código propietario de Imagen Marquillas SAS

---

## 👨‍💻 Autor

**Arquitecto Senior Full Stack**  
Imagen Marquillas SAS  
Febrero 2026

---

## 📞 Soporte

Para soporte técnico, contactar al equipo de desarrollo.

---

## 🎉 Agradecimientos

Desarrollado con ❤️ para optimizar la gestión de horarios en Imagen Marquillas SAS.
