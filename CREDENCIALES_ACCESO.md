# 🔐 CREDENCIALES DE ACCESO - SISTEMA SCHEDULE

**Actualización:** 04 de Febrero de 2026  
**Versión:** V3.0 - Cédulas Numéricas

---

## 👥 USUARIOS DEL SISTEMA

### 1. 👑 MAESTRO (Acceso Total)

```yaml
Nombre: Maestro
Cédula: 11111111
Contraseña: abc111
Rol: master
Permisos: Total (CRUD empleados, registros, reportes, configuración)
Redirección: /admin
```

**Capacidades:**
- ✅ Gestión completa de empleados
- ✅ Edición de registros de tiempo
- ✅ Generación de reportes Excel
- ✅ Cambio de contraseñas (propia, admin, empleados)
- ✅ Bloqueo/desbloqueo de usuarios
- ✅ Acceso al log de actividades

---

### 2. ⚙️ ADMINISTRADOR

```yaml
Nombre: Administrador
Cédula: 22222222
Contraseña: abc222
Rol: admin
Permisos: Gestión de empleados y registros (NO puede cambiar contraseña de otros admins ni maestro)
Redirección: /admin
```

**Capacidades:**
- ✅ Gestión de empleados
- ✅ Edición de registros de tiempo
- ✅ Generación de reportes Excel
- ✅ Cambio de su propia contraseña
- ✅ Cambio de contraseñas de empleados
- ⚠️ NO puede cambiar contraseña de Maestro
- ⚠️ NO puede cambiar contraseña de otros Admins

---

### 3. 👤 EMPLEADO: Belisario Corrales

```yaml
Nombre: Belisario Corrales
Cédula: 33333333
Contraseña: abc333
Rol: employee
Permisos: Solo marcación de entrada/salida
Redirección: /employee
Estado: Activo
```

**Capacidades:**
- ✅ Marcación de ENTRADA
- ✅ Marcación de SALIDA
- ✅ Visualización de sus propios registros del día
- ⚠️ NO puede editar registros
- ⚠️ NO puede ver registros de otros empleados
- ⚠️ NO puede cambiar su propia contraseña desde la interfaz

---

## 🧪 PRUEBAS DE ACCESO

### Test 1: Login como Maestro

```bash
Paso 1: Abrir http://localhost:3000
Paso 2: Ingresar credenciales:
        Cédula: 11111111
        Contraseña: abc111
Paso 3: Click "Iniciar Sesión"

✅ Resultado esperado:
   - Redirección a /admin
   - Mensaje: "Bienvenido, Maestro!"
   - Rol mostrado: master
```

### Test 2: Login como Administrador

```bash
Cédula: 22222222
Contraseña: abc222

✅ Resultado esperado:
   - Redirección a /admin
   - Mensaje: "Bienvenido, Administrador!"
   - Rol mostrado: admin
```

### Test 3: Login como Belisario Corrales

```bash
Cédula: 33333333
Contraseña: abc333

✅ Resultado esperado:
   - Redirección a /employee
   - Mensaje: "Hola, Belisario Corrales!"
   - Vista de marcación visible
```

---

## 🔒 SEGURIDAD

### Validación de Cédulas

```yaml
Formato: Solo números
Longitud: 6-10 dígitos
Formato estándar: 8 dígitos
Ejemplos válidos:
  - 123456 (6 dígitos - mínimo)
  - 11111111 (8 dígitos - Maestro)
  - 22222222 (8 dígitos - Administrador)
  - 33333333 (8 dígitos - Belisario Corrales)
  - 1234567890 (10 dígitos - máximo)
```

### Validación de Contraseñas (Nivel 2)

```yaml
Longitud: 6-20 caracteres
Requisitos:
  - Mínimo 1 letra (puede ser mayúscula o minúscula)
  - Mínimo 1 número
  - No puede estar en blacklist de contraseñas débiles

Ejemplos válidos:
  - abc111 ✅ (6 caracteres, letras + números)
  - abc222 ✅ (6 caracteres, letras + números)
  - abc333 ✅ (6 caracteres, letras + números)
  - juan123 ✅
  - admin2024 ✅
```

**Nota:** Las contraseñas actuales (abc111, abc222, abc333) cumplen con requisitos de seguridad Nivel 2 (letras + números), pero deben cambiarse en producción por contraseñas únicas y más complejas.

---

## 📊 TABLA RESUMEN

| Usuario | Cédula | Contraseña | Rol | Vista |
|---------|---------|-----------|-----|-------|
| **Maestro** | 11111111 | abc111 | master | /admin |
| **Administrador** | 22222222 | abc222 | admin | /admin |
| **Belisario Corrales** | 33333333 | abc333 | employee | /employee |

---

## 🎯 CAMBIO DE CONTRASEÑAS

### Para Maestro/Admin (Cambio propio)

```
1. Iniciar sesión
2. Ir a "Configuración" o "Mi Perfil"
3. Ingresar contraseña actual
4. Ingresar nueva contraseña (debe cumplir requisitos Nivel 2)
5. Confirmar nueva contraseña
6. Guardar
```

### Para Empleados (Solo Admin/Maestro puede cambiarlas)

```
1. Admin/Maestro inicia sesión
2. Ir a "Gestión de Empleados"
3. Seleccionar empleado
4. Click en "Cambiar Contraseña"
5. Ingresar nueva contraseña
6. Confirmar
7. Entregar nueva contraseña al empleado
```

---

## 🚨 IMPORTANTE: SEGURIDAD

### ⚠️ CONTRASEÑAS TEMPORALES

Las contraseñas actuales son **TEMPORALES** y deben cambiarse:

```yaml
Producción:
  Maestro: ⚠️ Cambiar abc111 por contraseña más compleja
  Admin: ⚠️ Cambiar abc222 por contraseña más compleja
  Belisario: ⚠️ Cambiar abc333 por contraseña más compleja
```

### ✅ RECOMENDACIONES

1. **Cambiar contraseñas en primer uso:**
   - Maestro debe cambiar abc111 inmediatamente
   - Admin debe cambiar abc222 inmediatamente
   - Belisario debe recibir nueva contraseña del admin

2. **Contraseñas seguras:**
   - Mínimo 8 caracteres (aunque el sistema acepta 6)
   - Combinar letras mayúsculas y minúsculas
   - Incluir números
   - Evitar palabras comunes

3. **Rotación periódica:**
   - Cambiar contraseñas cada 3-6 meses
   - No reutilizar contraseñas anteriores

4. **No compartir credenciales:**
   - Cada usuario tiene sus propias credenciales
   - No compartir contraseñas entre usuarios

---

## 📝 LOG DE ACCESOS

Todos los intentos de login se registran en el sistema:

```yaml
Registro incluye:
  - Timestamp (fecha y hora)
  - Usuario (nombre o cédula)
  - Acción (LOGIN, LOGIN_FAILED, LOGIN_BLOCKED)
  - Resultado (exitoso/fallido)
  
Ubicación: activity_log en localStorage
```

---

## 🔧 RECUPERACIÓN DE ACCESO

### Si olvidaste tu contraseña:

**Maestro:**
- Solo puede ser restablecida manualmente en el código
- Contactar a soporte técnico

**Admin:**
- El Maestro puede cambiarla desde "Gestión de Usuarios"

**Empleado:**
- Admin o Maestro pueden cambiarla desde "Gestión de Empleados"

---

## 📞 SOPORTE

### Problemas de acceso:

**Error: "La cédula solo debe contener números"**
- Verificar que la cédula no tenga letras ni caracteres especiales
- Cédulas válidas: 11111111, 22222222, 33333333

**Error: "Cédula o contraseña incorrecta"**
- Verificar que la cédula sea correcta (8 dígitos)
- Verificar que la contraseña sea correcta
- Verificar que el usuario no esté bloqueado

**Usuario bloqueado:**
- Solo Maestro o Admin pueden desbloquear
- Contactar al administrador del sistema

---

## ✅ CHECKLIST DE SEGURIDAD

```
Antes de ir a producción:

[ ] Cambiar contraseña de Maestro (abc111 → nueva más compleja)
[ ] Cambiar contraseña de Admin (abc222 → nueva más compleja)
[ ] Cambiar contraseña de Belisario (abc333 → nueva más compleja)
[ ] Crear empleados reales con contraseñas seguras
[ ] Documentar nuevas contraseñas en lugar seguro
[ ] Configurar rotación periódica de contraseñas
[ ] Revisar logs de acceso regularmente
[ ] Establecer políticas de contraseñas
```

---

## 🎓 CAPACITACIÓN

### Para nuevos usuarios:

1. **Recibir credenciales:**
   - Cédula (proporcionada por admin)
   - Contraseña temporal (proporcionada por admin)

2. **Primer acceso:**
   - Ingresar con credenciales temporales
   - Cambiar contraseña (si el sistema lo permite para tu rol)

3. **Uso diario:**
   - Memorizar credenciales (no escribirlas)
   - No compartir con nadie
   - Cerrar sesión al terminar

---

**Actualizado:** 04 de Febrero de 2026  
**Sistema SCHEDULE - Imagen Marquillas SAS**

---

*Este documento contiene información sensible. Mantener en lugar seguro y no compartir públicamente.*
