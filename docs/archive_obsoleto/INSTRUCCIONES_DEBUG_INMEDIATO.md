# 🔍 INSTRUCCIONES DE DEBUG - EJECUTAR AHORA

**Prioridad:** INMEDIATA  
**Estado:** LOGS ACTIVADOS - ESPERANDO EJECUCIÓN

---

## 🎯 LOGS ACTIVADOS

Se han agregado **10 puntos de logging** en el flujo de autenticación para identificar exactamente dónde falla el login.

---

## 🚀 EJECUTA ESTOS PASOS AHORA

### PASO 1: Abrir la Aplicación con Consola

```bash
1. Abre el navegador
2. Ve a: http://localhost:3000/
3. Presiona F12 (abre DevTools)
4. Click en pestaña "Console"
5. Limpia la consola (icono 🚫 o Ctrl+L)
```

---

### PASO 2: Verificar Logs Iniciales

**Inmediatamente al cargar, deberías ver:**

```javascript
🔍 [DEBUG] Variables de entorno: {
  url: "✅ Cargada",
  key: "✅ Cargada",
  urlValue: "https://npyzeaylvxqbpjtxzmys.supabase.co",
  keyLength: 209
}

✅ [DEBUG] Cliente Supabase creado exitosamente

✅ [DEBUG] Conexión a Supabase verificada
```

**¿Ves estos 3 logs?**
- ✅ SÍ → Variables de entorno OK, continúa al Paso 3
- ❌ NO → Variables de entorno no cargadas, **REINICIA EL SERVIDOR:**
  ```bash
  Ctrl+C en la terminal
  npm run dev
  Recarga navegador
  ```

---

### PASO 3: Intentar Login

**En el formulario de login:**

```
Campo 1 (Cédula): 10101010
Campo 2 (Contraseña): Lukas2026
```

**Click en "Iniciar Sesión"**

---

### PASO 4: Observar Logs de Login

**Deberías ver esta SECUENCIA COMPLETA:**

```javascript
// 1. Inicio
🚀 [DEBUG] AuthContext.handleLogin iniciado: { cedula: "10101010" }

// 2. Llamada al servicio
📞 [DEBUG] Llamando a auth.service.login()...

// 3. Datos enviados
🔍 [DEBUG] Enviando a Supabase: {
  cedula: "10101010",
  password: "Lukas2026"
}

// 4. Respuesta de Supabase (PUNTO CRÍTICO)
📥 [DEBUG] Respuesta de Supabase: {
  data: { ... },  // ← Debe tener datos del usuario
  error: null,    // ← Debe ser null
  errorCode: undefined,
  errorMessage: undefined
}

// 5. Usuario encontrado
✅ [DEBUG] Usuario encontrado: {
  id: 1,
  name: "Lukas Maestro",  // ← ESTO DEBE APARECER
  cedula: "10101010",
  role: "master",
  blocked: false
}

// 6. Verificación blocked
🔒 [DEBUG] Verificando blocked: false

// 7. Verificación contraseña
🔑 [DEBUG] Verificando contraseña: {
  passwordDB: "Lukas2026",
  passwordIngresada: "Lukas2026",
  coincide: true  // ← Debe ser true
}

// 8. LOGIN EXITOSO (PUNTO DE ÉXITO)
🎉 [DEBUG] LOGIN EXITOSO - Usuario: Lukas Maestro

// 9. Usuario retornado
✅ [DEBUG] Retornando usuario: { ... }

// 10. Resultado en Context
📦 [DEBUG] Resultado de login: { success: true, user: {...} }

// 11. Guardado
✅ [DEBUG] Login exitoso, guardando en sessionStorage
💾 [DEBUG] Usuario guardado en sessionStorage: { ... }
```

---

## 🎯 DIAGNÓSTICO INMEDIATO

### ✅ ESCENARIO A: Login Exitoso

**Si ves:**
```
🎉 [DEBUG] LOGIN EXITOSO - Usuario: Lukas Maestro
```

**Entonces:**
- ✅ Sistema funcionando correctamente
- ✅ Supabase conectado
- ✅ Usuario recuperado exitosamente
- ✅ Deberías estar en /admin

---

### ❌ ESCENARIO B: Usuario No Encontrado

**Si ves:**
```javascript
📥 [DEBUG] Respuesta de Supabase: {
  data: null,
  error: {
    code: "PGRST116",
    message: "JSON object requested, multiple (or no) rows returned"
  },
  errorCode: "PGRST116"
}
```

**Causa:** La cédula 10101010 NO existe en Supabase

**SOLUCIÓN INMEDIATA:**
```sql
-- Ve a Supabase SQL Editor y ejecuta:
INSERT INTO employees (name, cedula, password, role, blocked) 
VALUES ('Lukas Maestro', '10101010', 'Lukas2026', 'master', false);
```

---

### ❌ ESCENARIO C: Contraseña No Coincide

**Si ves:**
```javascript
✅ [DEBUG] Usuario encontrado: { name: "Lukas Maestro", ... }
🔑 [DEBUG] Verificando contraseña: {
  passwordDB: "OtraContraseña",  // ← Diferente
  passwordIngresada: "Lukas2026",
  coincide: false
}
❌ [DEBUG] Contraseña NO coincide
```

**Causa:** La contraseña en Supabase es diferente a "Lukas2026"

**SOLUCIÓN INMEDIATA:**
```sql
-- Ve a Supabase SQL Editor y ejecuta:
UPDATE employees 
SET password = 'Lukas2026' 
WHERE cedula = '10101010';
```

---

### ❌ ESCENARIO D: Error de Conexión

**Si ves:**
```javascript
🔥 [DEBUG] Excepción en handleLogin: TypeError: fetch failed
```

**Causa:** No hay conexión a Supabase

**SOLUCIÓN:**
1. Verificar internet
2. Verificar que Supabase esté en línea
3. Verificar URL en .env

---

### ❌ ESCENARIO E: Variables de Entorno No Cargadas

**Si ves:**
```javascript
🔍 [DEBUG] Variables de entorno: {
  url: "❌ No encontrada",
  key: "❌ No encontrada"
}
```

**Causa:** .env no se cargó

**SOLUCIÓN INMEDIATA:**
```bash
1. Detén el servidor (Ctrl+C en terminal)
2. Verifica que existe: .env
3. Contenido debe ser:
   VITE_SUPABASE_URL=https://npyzeaylvxqbpjtxzmys.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
4. Reinicia servidor: npm run dev
5. Recarga navegador
```

---

## 📊 TABLA DE DIAGNÓSTICO RÁPIDO

| Log que ves | Significa | Acción |
|-------------|-----------|--------|
| `error: PGRST116` | Usuario no existe | Insertar en Supabase |
| `coincide: false` | Contraseña diferente | Actualizar password en DB |
| `fetch failed` | Sin conexión | Verificar internet/Supabase |
| `❌ No encontrada` | .env no cargado | Reiniciar servidor |
| `🎉 LOGIN EXITOSO` | ✅ Funciona perfectamente | Nada, está OK |

---

## 🔧 VERIFICACIÓN EN SUPABASE

### Query de Verificación Directa

**Ejecuta en Supabase SQL Editor:**

```sql
-- 1. Ver todos los empleados
SELECT * FROM employees;

-- 2. Buscar específicamente al maestro
SELECT * FROM employees WHERE cedula = '10101010';

-- 3. Ver la contraseña exacta
SELECT cedula, password, role FROM employees WHERE cedula = '10101010';
```

**Resultado esperado:**

```
cedula    | password   | role
----------|------------|-------
10101010  | Lukas2026  | master
```

**Si NO ves esto → El usuario no existe o tiene datos diferentes**

---

## 🚨 ACCIÓN INMEDIATA REQUERIDA

### EJECUTA AHORA MISMO:

```
1. ✅ Servidor está corriendo: http://localhost:3000/
2. ✅ Logs están activados (archivos modificados)
3. ⏳ ESPERANDO: Que ejecutes el login

PRÓXIMO PASO:
→ Abre http://localhost:3000/ con F12
→ Intenta login con 10101010, Lukas2026
→ COPIA TODOS los logs que aparezcan en consola
→ Verifica si aparece: "🎉 LOGIN EXITOSO"
```

---

## 📝 CHECKLIST DE EJECUCIÓN

```bash
[  ] Navegador abierto en http://localhost:3000/
[  ] DevTools abierto (F12)
[  ] Pestaña Console visible
[  ] Consola limpiada (Ctrl+L)
[  ] Logs de variables de entorno visibles (al cargar)
[  ] Logs de cliente Supabase visibles
[  ] Login intentado con 10101010, Lukas2026
[  ] TODOS los logs copiados
[  ] Verificado si aparece "LOGIN EXITOSO"
```

---

## 🎯 QUÉ BUSCAR EN LOS LOGS

### 🔍 Log Crítico #1: Respuesta de Supabase

```javascript
📥 [DEBUG] Respuesta de Supabase: { ... }
```

**Este log te dirá EXACTAMENTE qué retornó Supabase:**
- Si `data` tiene contenido → Usuario encontrado ✅
- Si `data` es null → Usuario NO existe ❌
- Si `error` no es null → Hay un error (ver código)

---

### 🔍 Log Crítico #2: Verificación de Contraseña

```javascript
🔑 [DEBUG] Verificando contraseña: {
  passwordDB: "...",
  passwordIngresada: "...",
  coincide: true/false
}
```

**Este log te dirá si la contraseña coincide:**
- Si `coincide: true` → Contraseña correcta ✅
- Si `coincide: false` → Contraseña NO coincide ❌

---

### 🔍 Log Crítico #3: Login Exitoso

```javascript
🎉 [DEBUG] LOGIN EXITOSO - Usuario: Lukas Maestro
```

**Si ves este log:**
- ✅ TODO funcionó correctamente
- ✅ Usuario recuperado de Supabase
- ✅ Contraseña verificada
- ✅ Login completado

---

## 🚀 ESTADO ACTUAL

```
✅ Servidor: http://localhost:3000/ - CORRIENDO
✅ Logs: ACTIVADOS (10 puntos de logging)
✅ Hot Reload: DETECTÓ CAMBIOS
✅ Sin errores de compilación
✅ Esperando: EJECUCIÓN DE PRUEBA
```

---

## 📞 PRÓXIMA ACCIÓN

**NO TE DETENGAS HASTA VER:**

```
🎉 [DEBUG] LOGIN EXITOSO - Usuario: Lukas Maestro
```

**Este mensaje confirma que el usuario fue recuperado exitosamente de Supabase.**

---

## 🔧 SI NO APARECE EL LOG DE ÉXITO

**Copia el último log que aparezca y busca en la tabla de diagnóstico:**

1. Si dice `PGRST116` → Usuario no existe (insertar en DB)
2. Si dice `coincide: false` → Contraseña diferente (actualizar DB)
3. Si dice `fetch failed` → Sin conexión (verificar internet)
4. Si dice `❌ No encontrada` → .env mal configurado (reiniciar servidor)

---

**Logs de depuración activados - Ejecuta la prueba AHORA** 🔍

---

**Sistema SCHEDULE - Debugging Mode**  
**Fecha:** 04 de Febrero de 2026
