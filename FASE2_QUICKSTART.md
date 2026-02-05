# 🚀 FASE 2 - GUÍA RÁPIDA

## ✅ ESTADO ACTUAL

```
SCHEDULE - Sistema de Control de Horarios
├── FASE 1: LÓGICA DE NEGOCIO ✅ COMPLETADA
└── FASE 2: LOGIN Y UI       ✅ COMPLETADA
```

---

## 🎯 CREDENCIALES DE PRUEBA

```
┌─────────────┬────────────┬───────────┬──────────────┐
│ Usuario     │ Contraseña │ Rol       │ Redirección  │
├─────────────┼────────────┼───────────┼──────────────┤
│ Maestro     │ 111111     │ master    │ /admin       │
│ Admin       │ 222222     │ admin     │ /admin       │
│ Empleado    │ 333333     │ employee  │ /employee    │
└─────────────┴────────────┴───────────┴──────────────┘
```

---

## ⚡ INICIO RÁPIDO

```bash
# 1. Iniciar servidor
npm run dev

# 2. Abrir navegador
http://localhost:3001

# 3. Probar login
Contraseña: 111111
```

---

## 🎨 LO QUE VERÁS

### 🔐 Pantalla de Login
```
┌────────────────────────────────────┐
│              🔐                     │
│           SCHEDULE                 │
│  Sistema de Gestión de Horarios    │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ Ingrese su contraseña        │  │
│  └──────────────────────────────┘  │
│                                    │
│  [ Iniciar Sesión ]                │
│                                    │
│  👑 Maestro: 111111                │
│  ⚙️ Admin: 222222                 │
│  👤 Empleado: 333333               │
└────────────────────────────────────┘
```

### ⚙️ Vista Admin/Maestro
```
┌────────────────────────────────────┐
│ Bienvenido, Maestro! 👋            │ [Cerrar Sesión]
│ Rol: master                        │
│                                    │
│  ┌──────────────────────────────┐  │
│  │        ⚙️                     │  │
│  │  Vista Admin/Maestro         │  │
│  │                              │  │
│  │  Próximas funcionalidades:   │  │
│  │  ✅ Gestión de empleados     │  │
│  │  ✅ Visualización registros  │  │
│  │  ✅ Reportes Excel           │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### 👤 Vista Empleado
```
┌────────────────────────────────────┐
│ Hola, [Nombre Empleado]! 👋        │ [Cerrar Sesión]
│                                    │
│  ┌──────────────────────────────┐  │
│  │        ⏱️                     │  │
│  │  Vista Empleado              │  │
│  │                              │  │
│  │  Próximas funcionalidades:   │  │
│  │  ✅ Botón Entrada/Salida     │  │
│  │  ✅ Registros del día        │  │
│  │  ✅ Auto-logout              │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

---

## 🔥 PRUEBAS RÁPIDAS

### Test 1: Login como Maestro
```bash
1. Ingresa: 111111
2. Click "Iniciar Sesión"
3. ✅ Deberías ver "Bienvenido, Maestro!" en /admin
```

### Test 2: Login como Admin
```bash
1. Click "Cerrar Sesión"
2. Ingresa: 222222
3. Click "Iniciar Sesión"
4. ✅ Deberías ver "Bienvenido, Administrador!" en /admin
```

### Test 3: Login como Empleado
```bash
1. Click "Cerrar Sesión"
2. Ingresa: 333333
3. Click "Iniciar Sesión"
4. ✅ Deberías redirigir a /employee
```

### Test 4: Contraseña Incorrecta
```bash
1. Ingresa: 999999
2. Click "Iniciar Sesión"
3. ✅ Deberías ver toast rojo con "Contraseña incorrecta"
```

### Test 5: Persistencia de Sesión
```bash
1. Ingresa con 111111
2. Recarga la página (F5)
3. ✅ Deberías seguir en /admin como Maestro
```

---

## 📦 ARCHIVOS CLAVE

```
src/
├── context/AuthContext.jsx     ← Estado global de auth
├── components/
│   ├── auth/LoginScreen.jsx    ← Pantalla de login
│   ├── admin/AdminView.jsx     ← Vista admin/maestro
│   └── employee/EmployeeView.jsx ← Vista empleado
└── App.jsx                     ← Router principal
```

---

## 🐛 SI ALGO NO FUNCIONA

### Error: "Cannot find module"
```bash
npm install
npm run dev
```

### Error: Puerto en uso
```bash
# Vite automáticamente usa el siguiente puerto disponible
# Verifica la URL en la consola
```

### Error: Pantalla en blanco
```bash
# 1. Abre DevTools (F12)
# 2. Revisa la consola de errores
# 3. Verifica que estés en http://localhost:3001
```

### Login no funciona
```bash
# 1. Verifica que uses una de las contraseñas válidas:
#    111111, 222222, 333333
# 2. Revisa la consola del navegador (F12)
```

---

## 🎯 PRÓXIMOS PASOS

```
FASE 3: FUNCIONALIDAD COMPLETA
├── Admin: CRUD empleados, reportes, edición
└── Employee: Marcación entrada/salida
```

---

## 📊 ARQUITECTURA RÁPIDA

```
LoginScreen
     ↓
  AuthContext
     ↓
  auth.service (FASE 1)
     ↓
  validatePassword (FASE 1)
     ↓
  Router
     ↓
  AdminView / EmployeeView
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Servidor corriendo en http://localhost:3001
- [ ] Login con 111111 funciona
- [ ] Redirección a /admin correcta
- [ ] Nombre "Maestro" visible
- [ ] Botón "Cerrar Sesión" funciona
- [ ] Toast de error se muestra
- [ ] Sesión persiste al recargar
- [ ] Vista responsive en mobile

---

## 🎉 ¡FASE 2 COMPLETADA!

```
┌────────────────────────────────────┐
│         ✅ TODO FUNCIONAL          │
│                                    │
│  Login         ✅                  │
│  Validación    ✅                  │
│  Rutas         ✅                  │
│  Persistencia  ✅                  │
│  UI Profesional ✅                 │
│  Responsive    ✅                  │
│                                    │
│  READY FOR FASE 3! 🚀              │
└────────────────────────────────────┘
```

---

*Para más detalles, consulta: `FASE2_COMPLETADA.md`*
