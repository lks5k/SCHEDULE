# 🔍 PROTOCOLO DE DEPURACIÓN - LOGIN

**Fecha:** 04 de Febrero de 2026  
**Estado:** LOGS DE DEBUG ACTIVADOS

---

## 🎯 LOGS IMPLEMENTADOS

### Flujo Completo de Depuración

```
1. 🔍 Configuración Supabase
   ├─ Variables de entorno cargadas?
   ├─ URL presente?
   └─ API Key presente?

2. ✅ Cliente Supabase creado

3. 📞 Test de conexión inicial
   └─ Consulta a tabla employees

4. 🚀 AuthContext.handleLogin iniciado
   └─ Cédula recibida

5. 📞 Llamada a auth.service.login()

6. 🔍 Enviando a Supabase
   ├─ Cédula
   └─ Contraseña

7. 📥 Respuesta de Supabase
   ├─ data (usuario encontrado o null)
   ├─ error (código de error o null)
   ├─ errorCode (ej: PGRST116)
   └─ errorDetails

8. ✅ Usuario encontrado
   ├─ id
   ├─ name
   ├─ cedula
   ├─ role
   └─ blocked

9. 🔒 Verificando blocked

10. 🔑 Verificando contraseña
    ├─ passwordDB
    ├─ passwordIngresada
    └─ coincide?

11. 🎉 LOGIN EXITOSO
    └─ Usuario retornado

12. 💾 Usuario guardado en sessionStorage

13. ✅ Redirección
```

---

## 🧪 INSTRUCCIONES DE PRUEBA

### Paso 1: Abrir Consola del Navegador

```bash
1. Abre la aplicación: http://localhost:3000/
2. Presiona F12 (DevTools)
3. Ve a la pestaña "Console"
4. Limpia la consola (icono 🚫 o Ctrl+L)
```

---

### Paso 2: Verificar Carga Inicial

**Deberías ver en la consola:**

```
🔍 [DEBUG] Variables de entorno: {
  url: "✅ Cargada",
  key: "✅ Cargada",
  urlValue: "https://npyzeaylvxqbpjtxzmys.supabase.co",
  keyLength: 209
}

✅ [DEBUG] Cliente Supabase creado exitosamente

✅ [DEBUG] Conexión a Supabase verificada
```

**Si ves esto → Variables de entorno OK**  
**Si NO ves esto → Problema con .env (reiniciar servidor)**

---

### Paso 3: Intentar Login

**Ingresa credenciales:**
```
Cédula: 10101010
Contraseña: Lukas2026
```

**Click "Iniciar Sesión"**

---

### Paso 4: Revisar Logs de Login

**Deberías ver esta secuencia en la consola:**

```javascript
// 1. Inicio del proceso
🚀 [DEBUG] AuthContext.handleLogin iniciado: { cedula: "10101010" }

// 2. Llamada al servicio
📞 [DEBUG] Llamando a auth.service.login()...

// 3. Datos enviados
🔍 [DEBUG] Enviando a Supabase: {
  cedula: "10101010",
  password: "Lukas2026"
}

// 4. Respuesta de Supabase
📥 [DEBUG] Respuesta de Supabase: {
  data: {
    id: 1,
    name: "Lukas Maestro",
    cedula: "10101010",
    password: "Lukas2026",
    role: "master",
    blocked: false,
    deleted_at: null
  },
  error: null,
  errorCode: undefined,
  errorMessage: undefined
}

// 5. Usuario encontrado
✅ [DEBUG] Usuario encontrado: {
  id: 1,
  name: "Lukas Maestro",
  cedula: "10101010",
  role: "master",
  blocked: false
}

// 6. Verificación de blocked
🔒 [DEBUG] Verificando blocked: false

// 7. Verificación de contraseña
🔑 [DEBUG] Verificando contraseña: {
  passwordDB: "Lukas2026",
  passwordIngresada: "Lukas2026",
  coincide: true
}

// 8. Login exitoso
🎉 [DEBUG] LOGIN EXITOSO - Usuario: Lukas Maestro

// 9. Retornando usuario
✅ [DEBUG] Retornando usuario: {
  id: 1,
  name: "Lukas Maestro",
  cedula: "10101010",
  role: "master",
  blocked: false
}

// 10. Resultado en AuthContext
📦 [DEBUG] Resultado de login: { success: true, user: {...} }

// 11. Guardando en sessionStorage
✅ [DEBUG] Login exitoso, guardando en sessionStorage
💾 [DEBUG] Usuario guardado en sessionStorage: {...}
```

**Si ves TODA esta secuencia → Login funcionó correctamente** ✅

---

## 🐛 DIAGNÓSTICO DE ERRORES

### Escenario A: Usuario No Encontrado

**Logs que verías:**

```javascript
📥 [DEBUG] Respuesta de Supabase: {
  data: null,
  error: {
    code: "PGRST116",
    message: "JSON object requested, multiple (or no) rows returned",
    details: "The result contains 0 rows"
  },
  errorCode: "PGRST116"
}

❌ [DEBUG] Error en Supabase: { code: "PGRST116", ... }
```

**Causa posible:**
- ❌ Cédula no existe en Supabase
- ❌ Campo `cedula` tiene nombre diferente en DB
- ❌ Registro está eliminado (deleted_at no es null)

**Solución:**
```sql
-- Verificar en Supabase SQL Editor:
SELECT * FROM employees WHERE cedula = '10101010';

-- Si no retorna nada, insertar:
INSERT INTO employees (name, cedula, password, role) 
VALUES ('Lukas Maestro', '10101010', 'Lukas2026', 'master');
```

---

### Escenario B: Contraseña No Coincide

**Logs que verías:**

```javascript
✅ [DEBUG] Usuario encontrado: { name: "Lukas Maestro", ... }
🔒 [DEBUG] Verificando blocked: false
🔑 [DEBUG] Verificando contraseña: {
  passwordDB: "Lukas2026",
  passwordIngresada: "WrongPass",
  coincide: false
}
❌ [DEBUG] Contraseña NO coincide
```

**Causa:**
- ❌ Contraseña ingresada incorrecta
- ❌ Contraseña en DB es diferente

**Solución:**
```sql
-- Verificar contraseña en DB:
SELECT password FROM employees WHERE cedula = '10101010';

-- Si es diferente, actualizar:
UPDATE employees 
SET password = 'Lukas2026' 
WHERE cedula = '10101010';
```

---

### Escenario C: Error de Conexión

**Logs que verías:**

```javascript
🔍 [DEBUG] Enviando a Supabase: { ... }
🔥 [DEBUG] Excepción en handleLogin: Error: fetch failed
```

**Causa:**
- ❌ Sin conexión a internet
- ❌ Supabase no responde
- ❌ URL de Supabase incorrecta

**Solución:**
1. Verificar internet
2. Verificar URL en .env
3. Verificar que Supabase esté en línea

---

### Escenario D: Variables de Entorno No Cargadas

**Logs que verías:**

```javascript
🔍 [DEBUG] Variables de entorno: {
  url: "❌ No encontrada",
  key: "❌ No encontrada"
}

❌ Variables de entorno de Supabase no configuradas
```

**Causa:**
- ❌ Archivo .env no existe
- ❌ Variables mal nombradas (REACT_APP_ vs VITE_)
- ❌ Servidor no reiniciado después de cambiar .env

**Solución:**
```bash
1. Verificar que existe: .env
2. Contenido:
   VITE_SUPABASE_URL=https://npyzeaylvxqbpjtxzmys.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
3. Reiniciar servidor:
   Ctrl+C (detener)
   npm run dev (reiniciar)
```

---

## 📊 TABLA DE DIAGNÓSTICO

| Síntoma | Log que verías | Causa | Solución |
|---------|----------------|-------|----------|
| Usuario no encontrado | `error: PGRST116` | Cédula no existe en DB | Insertar usuario en Supabase |
| Contraseña incorrecta | `coincide: false` | Password diferente | Actualizar password en DB |
| Sin conexión | `fetch failed` | Internet/Supabase caído | Verificar conexión |
| Variables no cargadas | `❌ No encontrada` | .env mal configurado | Verificar .env y reiniciar |
| Campo no existe | `column "cedula" does not exist` | Nombre de columna diferente | Verificar schema en Supabase |

---

## 🔧 COMANDOS DE VERIFICACIÓN

### En Supabase SQL Editor:

```sql
-- 1. Verificar que existe la tabla
SELECT * FROM employees LIMIT 1;

-- 2. Verificar usuario maestro
SELECT * FROM employees WHERE cedula = '10101010';

-- 3. Verificar contraseña exacta
SELECT cedula, password FROM employees WHERE cedula = '10101010';

-- 4. Contar usuarios master
SELECT COUNT(*) FROM employees WHERE role = 'master';

-- 5. Ver estructura de tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees';
```

---

## 🚀 PRUEBA CON LOGS ACTIVOS

### Ejecutar Ahora:

```bash
1. Recarga la página: Ctrl+R

2. Abre DevTools: F12 → Console

3. Verifica logs iniciales:
   ✅ Variables de entorno cargadas
   ✅ Cliente Supabase creado
   ✅ Conexión verificada

4. Ingresa:
   Cédula: 10101010
   Contraseña: Lukas2026

5. Click "Iniciar Sesión"

6. OBSERVA TODOS LOS LOGS en consola

7. Si ves: "🎉 [DEBUG] LOGIN EXITOSO - Usuario: Lukas Maestro"
   → ✅ Sistema funcionando correctamente

8. Si ves error, copia el log completo y verifica tabla de diagnóstico
```

---

## 📝 CHECKLIST DE DEPURACIÓN

```bash
[  ] Consola del navegador abierta (F12)
[  ] Logs de variables de entorno visibles
[  ] Cliente Supabase creado
[  ] Test de conexión exitoso
[  ] Login intentado con 10101010, Lukas2026
[  ] Logs de "Enviando a Supabase" visibles
[  ] Logs de "Respuesta de Supabase" visibles
[  ] Usuario encontrado en logs
[  ] Contraseña verificada en logs
[  ] "LOGIN EXITOSO" mostrado
[  ] Usuario guardado en sessionStorage
```

---

## 🎯 LOGS ESPERADOS (ÉXITO)

```javascript
✅ SECUENCIA EXITOSA:

1. 🔍 Variables de entorno: { url: "✅", key: "✅" }
2. ✅ Cliente Supabase creado
3. ✅ Conexión a Supabase verificada
4. 🚀 AuthContext.handleLogin iniciado
5. 📞 Llamando a auth.service.login()
6. 🔍 Enviando a Supabase: { cedula: "10101010", password: "Lukas2026" }
7. 📥 Respuesta de Supabase: { data: {...}, error: null }
8. ✅ Usuario encontrado: { name: "Lukas Maestro", ... }
9. 🔒 Verificando blocked: false
10. 🔑 Verificando contraseña: { coincide: true }
11. 🎉 LOGIN EXITOSO - Usuario: Lukas Maestro
12. ✅ Retornando usuario
13. 📦 Resultado de login: { success: true }
14. ✅ Login exitoso, guardando en sessionStorage
15. 💾 Usuario guardado en sessionStorage
```

**Si ves TODA esta secuencia → Sistema funcionando al 100%** ✅

---

## 🚨 PRÓXIMA ACCIÓN

**EJECUTA AHORA:**

```
1. Recarga navegador: Ctrl+R
2. Abre consola: F12
3. Intenta login: 10101010, Lukas2026
4. COPIA todos los logs que aparezcan
5. Verifica si aparece: "🎉 LOGIN EXITOSO - Usuario: Lukas Maestro"
```

**Si aparece → Login funciona correctamente**  
**Si NO aparece → Copia el error exacto que muestra**

---

**Logs activos - Esperando ejecución de prueba** 🔍
