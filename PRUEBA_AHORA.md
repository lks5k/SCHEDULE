# 🚀 PRUEBA INMEDIATA - SISTEMA V3.0

**URL:** http://localhost:3000/  
**Estado:** ✅ LISTO PARA PRUEBA FINAL

---

## 🎯 CREDENCIALES

```
Cédula: 10101010
Contraseña: Lukas2026
```

---

## ✅ QUÉ ESPERAR

### Login Exitoso:
```
1. Acceso a /admin
2. Mensaje: "Bienvenido, Lukas Maestro!"
3. Rol: master
4. Sin errores CSP
5. Timer de 60s activo
```

### En Consola (F12):
```
📥 [DEBUG] Datos retornados de Supabase: {
  name: "Lukas Maestro",
  cedula: "10101010",
  role: "master"
}
```

---

## 🐛 SI FALLA

### Usuario no encontrado:
```sql
-- Ejecuta en Supabase:
INSERT INTO employees (name, cedula, password, role, blocked) 
VALUES ('Lukas Maestro', '10101010', 'Lukas2026', 'master', false);
```

### Contraseña incorrecta:
```sql
-- Ejecuta en Supabase:
UPDATE employees 
SET password = 'Lukas2026' 
WHERE cedula = '10101010';
```

---

## ✅ CHECKLIST

```
[ ] Servidor corriendo: http://localhost:3000/
[ ] Consola abierta (F12)
[ ] Login con 10101010, Lukas2026
[ ] Log de Supabase visible
[ ] Sin errores CSP
[ ] Acceso a /admin exitoso
```

---

**¡Prueba ahora!** 🚀
