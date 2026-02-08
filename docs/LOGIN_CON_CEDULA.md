# 🔐 LOGIN CON CÉDULA Y CONTRASEÑA

**Actualización:** 04 de Febrero de 2026  
**Versión:** V3.0 - Modo Completo

---

## ✅ CAMBIOS IMPLEMENTADOS

### 1. Formulario de Login Actualizado

**Antes (Modo Simple):**
- ❌ Solo campo de contraseña
- ❌ Contraseñas visibles al público

**Después (Modo Completo V3.0):**
- ✅ Campo de cédula
- ✅ Campo de contraseña
- ✅ Validación de ambos campos
- ✅ Contraseñas NO visibles (seguridad)

---

## 🔧 ARQUITECTURA ACTUALIZADA

### Servicio de Autenticación

El servicio `auth.service.js` ahora soporta **DOS MODOS**:

#### Modo 1: Login Simple (Solo Contraseña)
```javascript
login(password)
```

#### Modo 2: Login Completo (Cédula + Contraseña) ✅ NUEVO
```javascript
login(cedula, password)
```

### Flujo de Autenticación

```
LoginScreen
    ↓
  Ingresa Cédula + Contraseña
    ↓
  Valida Cédula (6-12 dígitos)
    ↓
  Valida Contraseña (Nivel 2)
    ↓
  AuthContext.handleLogin(cedula, password)
    ↓
  auth.service.login(cedula, password)
    ↓
  Busca en DB por:
    - employees.find(e => e.cedula === cedula)
    - Verifica: employee.password === password
    ↓
  Retorna usuario autenticado
    ↓
  Redirección según rol
```

---

## 👥 USUARIOS DE PRUEBA

### 🔑 Master (Administrador Principal)

```yaml
Cédula: MASTER
Contraseña: 111111
Rol: master
Redirección: /admin
```

### ⚙️ Admin (Administrador)

```yaml
Cédula: ADMIN
Contraseña: 222222
Rol: admin
Redirección: /admin
```

### 👤 Empleados (Requieren creación previa)

Los empleados deben ser creados desde la interfaz de administración con:
- Nombre
- Cédula (6-12 dígitos)
- Contraseña (Nivel 2)

**Ejemplo de empleado:**
```yaml
Nombre: Juan Pérez
Cédula: 12345678
Contraseña: juan123
Rol: employee
Redirección: /employee
```

---

## 🧪 PRUEBAS DE LOGIN

### Test 1: Login como Master

```bash
1. Abrir: http://localhost:3000
2. Ingresar:
   - Cédula: MASTER
   - Contraseña: 111111
3. Click "Iniciar Sesión"

✅ Resultado esperado:
   - Redirección a /admin
   - Mensaje: "Bienvenido, Maestro!"
```

### Test 2: Login como Admin

```bash
1. Click "Cerrar Sesión"
2. Ingresar:
   - Cédula: ADMIN
   - Contraseña: 222222
3. Click "Iniciar Sesión"

✅ Resultado esperado:
   - Redirección a /admin
   - Mensaje: "Bienvenido, Administrador!"
```

### Test 3: Validación de Cédula

```bash
1. Ingresar:
   - Cédula: abc (inválida)
   - Contraseña: 111111
2. Click "Iniciar Sesión"

✅ Resultado esperado:
   - Error: "La cédula solo debe contener números"
   - Campo cédula con borde rojo
```

### Test 4: Validación de Contraseña

```bash
1. Ingresar:
   - Cédula: MASTER
   - Contraseña: 123 (muy corta)
2. Click "Iniciar Sesión"

✅ Resultado esperado:
   - Error: "La contraseña debe tener entre 6 y 20 caracteres"
   - Campo contraseña con borde rojo
```

### Test 5: Credenciales Incorrectas

```bash
1. Ingresar:
   - Cédula: 99999999
   - Contraseña: wrongpass
2. Click "Iniciar Sesión"

✅ Resultado esperado:
   - Toast rojo: "Cédula o contraseña incorrecta"
   - Auto-cierre en 3 segundos
```

---

## 📊 VALIDACIONES IMPLEMENTADAS

### Validación de Cédula

```javascript
validateCedula(cedula)

Requisitos:
- ✅ Solo números
- ✅ Longitud: 6-10 dígitos
- ✅ No vacía
- ✅ Sin espacios

Ejemplos válidos:
- "123456" (6 dígitos - mínimo)
- "11111111" (8 dígitos)
- "1234567890" (10 dígitos - máximo)

Ejemplos inválidos:
- "abc123" (contiene letras)
- "123" (muy corta, menos de 6)
- "12345678901" (muy larga, más de 10)
```

### Validación de Contraseña (Nivel 2)

```javascript
validatePassword(password)

Requisitos:
- ✅ Longitud: 6-20 caracteres
- ✅ Al menos 1 letra
- ✅ Al menos 1 número
- ✅ No en blacklist de contraseñas débiles

Ejemplos válidos:
- "juan123"
- "password1"
- "admin2024"

Ejemplos inválidos:
- "123456" (solo números, está en blacklist)
- "abc" (muy corta)
- "password" (sin números, está en blacklist)
```

---

## 🔒 SEGURIDAD

### ✅ Mejoras Implementadas

1. **Contraseñas NO visibles en UI**
   - Removida la sección de ayuda con contraseñas
   - Solo visible para administradores en documentación

2. **Doble validación**
   - Frontend: valida formato de cédula y contraseña
   - Backend: verifica credenciales en base de datos

3. **Mensajes seguros**
   - No revela si cédula o contraseña es incorrecta
   - Mensaje genérico: "Cédula o contraseña incorrecta"

4. **Log de intentos**
   - Todos los intentos de login se registran
   - Útil para auditoría de seguridad

---

## 🗂️ ARCHIVOS MODIFICADOS

```
✅ src/components/auth/LoginScreen.jsx
   - Agregado campo de cédula
   - Validación de ambos campos
   - Removidas contraseñas visibles

✅ src/context/AuthContext.jsx
   - handleLogin(identifier, password) con dos parámetros

✅ src/modules/auth/services/auth.service.js
   - Soporta modo completo: login(cedula, password)
   - Búsqueda por cédula en empleados
   - Verificación de contraseña
   - Cédulas especiales para Master/Admin
```

---

## 📝 NOTAS IMPORTANTES

### Para Administradores

1. **Crear empleados con cédula:**
   - Todos los empleados deben tener cédula asignada
   - Formato: 6-12 dígitos numéricos
   - Única por empleado

2. **Contraseñas seguras:**
   - Validación Nivel 2 activa
   - No usar contraseñas de la blacklist
   - Combinar letras y números

3. **Cédulas especiales:**
   - `MASTER` - Acceso maestro (contraseña: 111111)
   - `ADMIN` - Acceso administrador (contraseña: 222222)

### Para Empleados

1. **Login:**
   - Solicitar cédula al administrador
   - Solicitar contraseña al administrador
   - Ambos campos son obligatorios

2. **Problemas de acceso:**
   - Verificar que cédula sea correcta (solo números)
   - Verificar que contraseña sea correcta
   - Contactar administrador si cuenta está bloqueada

---

## 🚀 MODO RETROCOMPATIBLE

El sistema mantiene **compatibilidad** con el modo simple (solo contraseña):

```javascript
// Modo antiguo (aún funciona)
login('111111') → Busca por contraseña

// Modo nuevo (V3.0)
login('MASTER', '111111') → Busca por cédula + contraseña
```

Esto permite una migración gradual sin romper funcionalidad existente.

---

## 🎯 PRÓXIMOS PASOS

### Para completar la implementación:

1. ✅ **Formulario actualizado** - COMPLETADO
2. ✅ **Validaciones activas** - COMPLETADO
3. ✅ **Servicio modificado** - COMPLETADO
4. ⏳ **Crear empleados de prueba** - Pendiente (FASE 3)
5. ⏳ **Interfaz de gestión de empleados** - Pendiente (FASE 3)

---

## 📞 SOPORTE

### Problemas Comunes

**P: No puedo iniciar sesión**
- R: Verifica que uses cédula correcta (MASTER o ADMIN para administradores)
- R: Verifica que la contraseña tenga al menos 6 caracteres

**P: Error "La cédula solo debe contener números"**
- R: Las cédulas especiales MASTER y ADMIN son excepciones
- R: Para empleados, usar solo dígitos numéricos

**P: No aparecen los campos de cédula**
- R: Recargar página (Ctrl+R)
- R: Verificar que el servidor esté corriendo

---

## ✅ VERIFICACIÓN DE IMPLEMENTACIÓN

```bash
# 1. Verificar que el servidor esté corriendo
http://localhost:3000

# 2. Verificar campos visibles
[ ] Campo "Cédula" presente
[ ] Campo "Contraseña" presente
[ ] Botón "Iniciar Sesión" presente

# 3. Probar validaciones
[ ] Cédula con letras → Error
[ ] Contraseña muy corta → Error
[ ] Ambos campos vacíos → Error

# 4. Probar login exitoso
[ ] MASTER + 111111 → Acceso admin
[ ] ADMIN + 222222 → Acceso admin

# 5. Verificar seguridad
[ ] Contraseñas NO visibles en UI
[ ] Mensajes de error no revelan información sensible
```

---

**Estado:** ✅ IMPLEMENTACIÓN COMPLETA  
**Versión:** V3.0  
**Última actualización:** 04 de Febrero de 2026

---

*Sistema SCHEDULE - Imagen Marquillas SAS*
