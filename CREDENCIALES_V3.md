# 🔐 CREDENCIALES V3.0 - SISTEMA SCHEDULE

**Versión:** V3.0 - Determinista  
**Fuente:** Supabase (tabla employees)  
**Fecha:** 04 de Febrero de 2026

---

## 🎯 CREDENCIALES ACTIVAS

### 👑 MAESTRO

```
Nombre: Lukas Maestro
Cédula: 10101010
Contraseña: Lukas2026
Rol: master
```

### ⚙️ ADMINISTRADOR

```
Nombre: Admin Proyectos
Cédula: 20202020
Contraseña: Admin2026
Rol: admin
```

### 👤 EMPLEADO

```
Nombre: Belisario Empleado
Cédula: 30303030
Contraseña: Belisario2026
Rol: employee
```

---

## ✅ VALIDACIONES

### Cédula
- Longitud: 7-10 dígitos
- Solo números
- Sin espacios

### Contraseña
- Longitud: 6-20 caracteres
- Al menos 1 letra
- Al menos 1 número
- NO en blacklist

---

## 🧪 PRUEBA RÁPIDA

```
URL: http://localhost:3000/

Login Maestro:
  Cédula: 10101010
  Contraseña: Lukas2026

✅ Resultado: Acceso a /admin como "Lukas Maestro"
```

---

## ⏱️ TIMER DE INACTIVIDAD

- Timeout: 60 segundos
- Auto-logout si no hay actividad
- Se resetea con cualquier movimiento

---

## 📊 VERIFICACIÓN EN SUPABASE

```sql
SELECT name, cedula, role FROM employees WHERE deleted_at IS NULL;

Resultado:
Lukas Maestro      | 10101010 | master
Admin Proyectos    | 20202020 | admin
Belisario Empleado | 30303030 | employee
```

---

**Credenciales verificadas desde Supabase** ✅
