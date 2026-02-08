# 🚀 GUÍA COMPLETA DE CONFIGURACIÓN
## Sistema de SCHEDULE con Supabase

---

## 📋 **RESUMEN DE MEJORAS IMPLEMENTADAS**

### ✅ **1. Formato de Horas Corregido (hh:mm:ss)**
- **Problema anterior**: Mostraba `NaN:NaN`
- **Solución**: Función `calculateHoursBetween()` completamente reescrita
- **Resultado**: Formato perfecto `08:30:45` (horas:minutos:segundos)

### ✅ **2. Bloqueo de Captura de Pantalla Mejorado**
- Detección de tecla PrintScreen
- Bloqueo de Ctrl+Shift+S
- Blur automático al perder el foco de la ventana
- Aplicado solo a colaboradores

### ✅ **3. Botón "Cerrar Sesión" Global**
- Eliminado botón "Inicio"
- Botón rojo "Cerrar Sesión" siempre visible
- Posicionado en esquina superior derecha

### ✅ **4. Sin Captura de IP**
- Eliminada toda lógica de captura de IP
- Solo se guarda información del dispositivo (plataforma)

### ✅ **5. Textos en Blanco**
- TODO el texto ahora es blanco con `color: var(--text-primary) !important`
- Fondo oscuro para máximo contraste
- Excepción: badges de roles con colores específicos

### ✅ **6. Filtros en Historial de Registros**
- Filtro por nombre de empleado (búsqueda en tiempo real)
- Filtro por rango de fechas (desde - hasta)
- Botón para limpiar filtros
- Aplicado automáticamente en exportación a Excel

### ✅ **7. Edición de Registros**
- Botón "✏️" en cada registro (ENTRADA y SALIDA)
- Modal para cambiar hora
- Campo obligatorio de motivo
- Log completo en registro de actividad
- Solo disponible para Admin y Maestro

### ✅ **8. Integración con Supabase**
- Preparado para base de datos en la nube
- Fallback automático a localStorage si Supabase no está configurado
- Script SQL completo incluido
- Instrucciones paso a paso

---

## 🔧 **CONFIGURACIÓN DE SUPABASE (PASO A PASO)**

### **Paso 1: Crear Cuenta en Supabase**

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Regístrate con GitHub o email
4. **Es completamente GRATIS** (plan gratuito incluye 500MB de base de datos)

### **Paso 2: Crear Proyecto**

1. Una vez dentro, haz clic en "New Project"
2. Completa:
   - **Name**: `sistema-horarios` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: Selecciona la más cercana a Colombia (ejemplo: `South America (São Paulo)`)
   - **Pricing Plan**: Free (gratis)
3. Haz clic en "Create new project"
4. **Espera 2-3 minutos** mientras Supabase crea tu base de datos

### **Paso 3: Ejecutar el Script SQL**

1. En el menú lateral izquierdo, busca el ícono de SQL Editor (⚡)
2. Haz clic en "SQL Editor"
3. Abre el archivo `database.sql` del proyecto
4. **Copia TODO el contenido** del archivo
5. Pégalo en el editor de Supabase
6. Haz clic en el botón "RUN" (esquina inferior derecha)
7. Deberías ver el mensaje "Success. No rows returned"

### **Paso 4: Verificar que las Tablas se Crearon**

1. En el menú lateral, haz clic en "Table Editor" (ícono de tabla 📊)
2. Deberías ver 3 tablas:
   - `employees`
   - `time_records`
   - `activity_log`
3. Haz clic en `employees` y verifica que existe "Belisario Corrales"

### **Paso 5: Obtener tus Credenciales**

1. En el menú lateral, haz clic en "Settings" (⚙️)
2. Haz clic en "API"
3. Verás dos datos importantes:
   
   **A) Project URL** (ejemplo: `https://abcdefghijk.supabase.co`)
   - Copia esta URL completa
   
   **B) API Keys → anon/public** (ejemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - Haz clic en el ícono del ojo para revelar la key
   - Copia esta key completa (es muy larga, asegúrate de copiarla toda)

### **Paso 6: Configurar credenciales de Supabase**

1. Abre el archivo `script.js`
2. Busca la sección **CONFIGURACIÓN SUPABASE** que dice:
   ```javascript
   const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
   const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';
   ```
3. Reemplaza con tus credenciales:
   ```javascript
   const SUPABASE_URL = 'https://abcdefghijk.supabase.co'; // Tu Project URL
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Tu anon key
   ```
4. **Guarda el archivo**

### **Paso 7: Probar la Conexión**

1. Abre `index.html` en tu navegador (o con Live Server)
2. Abre la consola (F12 → Console)
3. Deberías ver el mensaje: `✅ Supabase conectado`
4. Si ves `⚠️ Usando almacenamiento local`, verifica que copiaste bien las credenciales

---

## 📊 **ESTRUCTURA DE LA BASE DE DATOS**

### **Tabla: employees**
```
id              BIGINT          (Identificador único)
name            TEXT            (Nombre completo)
password        TEXT            (Contraseña de 6 dígitos)
blocked         BOOLEAN         (Estado: activo/bloqueado)
created_at      TIMESTAMP       (Fecha de creación)
```

### **Tabla: time_records**
```
id              BIGINT          (Identificador único)
employee_id     BIGINT          (Relación con employees)
employee_name   TEXT            (Nombre del empleado)
fecha           TEXT            (Fecha: DD/MM/YYYY)
dia             TEXT            (Nombre del día)
tipo            TEXT            ('ENTRADA' o 'SALIDA')
hora            TEXT            (Hora: HH:MM:SS)
dispositivo     TEXT            (Info del dispositivo)
timestamp       TIMESTAMP       (Timestamp completo)
observaciones   TEXT            (Comentarios opcionales)
created_at      TIMESTAMP       (Fecha de creación del registro)
```

### **Tabla: activity_log**
```
id              BIGINT          (Identificador único)
timestamp       TIMESTAMP       (Cuándo ocurrió)
user_name       TEXT            (Quién ejecutó la acción)
action          TEXT            (Tipo de acción)
details         TEXT            (Detalles adicionales)
created_at      TIMESTAMP       (Fecha de creación)
```

---

## 🎯 **FUNCIONALIDADES DEL SISTEMA**

### **Para COLABORADORES (333333)**
1. Pantalla de bienvenida personalizada
2. Reloj en tiempo real
3. Botón inteligente ENTRADA/SALIDA
4. Vista de registros recientes (10 segundos)
5. Retorno automático al login
6. Captura de pantalla bloqueada
7. Cierre automático por inactividad (1 minuto)

### **Para ADMINISTRADOR (222222)**
1. Gestión de colaboradores (agregar/bloquear/eliminar)
2. Cambio de contraseñas de colaboradores
3. Cambio de su propia contraseña
4. **Filtros en historial** (por nombre y fecha)
5. **Edición de registros** con justificación
6. Agregar comentarios a registros
7. Dashboard con estadísticas
8. Log completo de actividad
9. Exportar a Excel
10. Cierre por inactividad (1 minuto)

### **Para MAESTRO (111111)**
1. Todo lo del Administrador +
2. Cambio de TODAS las contraseñas
3. Control total del sistema

---

## 📱 **USO DEL SISTEMA**

### **Login Inicial**
- El cursor ya está en el campo de contraseña
- Escribe la contraseña (6 dígitos)
- Presiona Enter o clic en "Ingresar"

### **Filtrar Registros (Admin/Maestro)**
1. Ve a la pestaña "📋 Historial"
2. Usa los filtros:
   - **Buscar por nombre**: Escribe para filtrar en tiempo real
   - **Desde**: Selecciona fecha inicial
   - **Hasta**: Selecciona fecha final
3. Los filtros se aplican automáticamente
4. Haz clic en "🔄 Limpiar" para resetear

### **Editar un Registro (Admin/Maestro)**
1. En el historial, localiza el registro
2. Haz clic en el botón "✏️" (entrada o salida)
3. Cambia la hora en el modal
4. **IMPORTANTE**: Escribe el motivo de la edición
5. Haz clic en "Guardar Cambios"
6. La edición quedará registrada en el log de actividad

### **Exportar a Excel**
1. Aplica los filtros que necesites (opcional)
2. Haz clic en "📊 Exportar Excel"
3. El archivo se descargará automáticamente
4. **Incluye solo los registros filtrados**
5. Formato: `Horarios_DD-MM-YYYY.xlsx`

---

## ⚠️ **IMPORTANTE: MODO FALLBACK**

Si NO configuras Supabase:
- El sistema funcionará normalmente
- Usará **localStorage** (almacenamiento local)
- Los datos solo estarán en TU navegador
- Si borras el historial, pierdes todo
- Perfecto para pruebas, NO para producción

Si SÍ configuras Supabase:
- Los datos estarán en la nube
- Accesibles desde cualquier dispositivo
- Persistencia permanente
- Respaldo automático
- **RECOMENDADO para uso real**

---

## 🔒 **SEGURIDAD**

### **Contraseñas por Defecto**
```
Maestro:              111111
Administrador:        222222
Belisario Corrales:   333333
```

### **Recomendaciones**
1. **Cambia las contraseñas inmediatamente** en producción
2. Las contraseñas se almacenan en texto plano (para simplicidad)
3. En un entorno corporativo, usa autenticación real de Supabase
4. Las políticas RLS están abiertas (para facilitar desarrollo)
5. Para producción, configura políticas más restrictivas

---

## 📞 **SOPORTE Y PROBLEMAS**

### **Problema: No se conecta a Supabase**
- Verifica que copiaste bien la URL y la Key
- Asegúrate de que NO haya espacios al inicio/final
- La URL debe empezar con `https://`
- La Key es muy larga (300+ caracteres)

### **Problema: Sigue mostrando NaN:NaN**
- Refresca completamente el navegador (Ctrl+F5)
- Borra la caché del navegador
- Verifica que estés usando el archivo nuevo

### **Problema: Los filtros no funcionan**
- Asegúrate de tener registros en el sistema
- El formato de fecha debe ser DD/MM/YYYY
- Prueba limpiando los filtros

### **Problema: No puedo editar registros**
- Solo Admin y Maestro pueden editar
- Debes ingresar un motivo obligatoriamente
- Verifica que el registro exista

---

## 🎉 **¡LISTO PARA USAR!**

El sistema está completamente funcional con o sin Supabase.

**Para comenzar:**
1. Descarga/abre el archivo `index.html`
2. Si quieres usar Supabase, sigue los pasos de configuración
3. Abre el archivo en Brave
4. Ingresa con: `333333` (colaborador), `222222` (admin), o `111111` (maestro)

**Archivos incluidos:**
- `index.html` → Interfaz de la aplicación
- `script.js` → Lógica + conexión a Supabase + exportación Excel
- `style.css` → Estilos
- `database.sql` → Script para crear la base de datos en Supabase
- `GUIA-CONFIGURACION.md` → Este archivo

---

## 📝 **CHANGELOG (Cambios Implementados)**

### Versión 2.0 - Supabase Integration
- ✅ Cálculo de horas corregido (hh:mm:ss sin NaN)
- ✅ Bloqueo mejorado de captura de pantalla
- ✅ Botón "Cerrar Sesión" global
- ✅ Eliminada captura de IP
- ✅ Todos los textos en blanco
- ✅ Filtros en historial (nombre + rango de fechas)
- ✅ Edición de registros con justificación
- ✅ Integración con Supabase
- ✅ Fallback automático a localStorage

---

**¡Disfruta tu sistema de SCHEDULE profesional!** 🚀
