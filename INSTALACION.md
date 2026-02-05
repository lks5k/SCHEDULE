# 🚀 Guía de Instalación Rápida

## ✅ Pre-requisitos

Antes de instalar, verifica que tengas:

- ✅ **Node.js 18+** instalado
  ```bash
  node --version  # Debe mostrar v18 o superior
  ```

- ✅ **npm** (viene con Node.js)
  ```bash
  npm --version
  ```

---

## 📦 Pasos de Instalación

### 1. Instalar Dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias necesarias:
- React 18
- Vite 5
- Supabase Client
- XLSX
- ESLint

**Tiempo estimado**: 1-2 minutos

---

### 2. Verificar Variables de Entorno

El archivo `.env` ya está configurado con el prefijo correcto:

```env
VITE_SUPABASE_URL=https://npyzeaylvxqbpjtxzmys.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

✅ **No necesitas hacer cambios** si usas la misma base de datos.

---

### 3. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Esto:
- ✅ Inicia Vite en modo desarrollo
- ✅ Abre automáticamente el navegador en `http://localhost:3000`
- ✅ Habilita Hot Module Replacement (HMR)

**Salida esperada**:

```
  VITE v5.0.12  ready in 423 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

---

## 🎯 Estado Actual

Cuando abras `http://localhost:3000`, verás:

```
🔐 SCHEDULE
Sistema de Gestión de Horarios

✅ FASE 1 COMPLETADA

Toda la arquitectura de servicios y lógica de negocio está lista.
La FASE 2 (UI/React Components) se implementará próximamente.

📦 Módulos listos: Auth, Schedule, Reports
🎯 Servicios: 35+ funciones implementadas
```

Esto es un **placeholder temporal** mientras se desarrolla la FASE 2.

---

## 🛠️ Comandos Útiles

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# El servidor se recarga automáticamente al hacer cambios
```

### Build de Producción

```bash
# Crear build optimizado
npm run build

# Previsualizar build
npm run preview
```

### Linting

```bash
# Verificar código con ESLint
npm run lint
```

---

## 📁 Estructura de Archivos

```
SCHEDULE/
│
├── src/                     # Código fuente
│   ├── modules/            # ✅ FASE 1 completada
│   │   ├── auth/
│   │   ├── schedule/
│   │   └── reports/
│   │
│   ├── App.jsx             # 🚧 Placeholder FASE 2
│   └── main.jsx            # Entry point
│
├── archive_old/            # ⬅️ Sistema antiguo (respaldo)
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── .env                    # Variables de entorno ✅
├── package.json            # Dependencias ✅
├── vite.config.js          # Config Vite ✅
└── README.md               # Documentación completa
```

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"

```bash
# Limpiar e instalar de nuevo
rm -rf node_modules package-lock.json
npm install
```

### Puerto 3000 ya está en uso

```bash
# Vite automáticamente usará el siguiente puerto disponible (3001, 3002, etc.)
# O edita vite.config.js para cambiar el puerto
```

### Variables de entorno no funcionan

```bash
# 1. Verificar que tengan prefijo VITE_
# 2. Reiniciar el servidor de desarrollo
npm run dev
```

### Errores de ESLint

```bash
# Ejecutar lint para ver errores
npm run lint

# La mayoría se auto-solucionan con las reglas configuradas
```

---

## 🎓 Próximos Pasos

Una vez instalado y funcionando:

1. ✅ Verificar que el servidor inicia correctamente
2. ✅ Abrir `http://localhost:3000` y ver el placeholder
3. ✅ Familiarizarse con la estructura en `src/`
4. 🚧 **FASE 2**: Comenzar desarrollo de componentes React

---

## 📚 Recursos

- **Documentación técnica**: `src/README.md`
- **Resumen FASE 1**: `FASE1_COMPLETADA.md`
- **Migración Vite**: `MIGRACION_VITE.md`
- **Este archivo**: Instalación rápida

---

## ✅ Checklist de Instalación

- [ ] Node.js 18+ instalado
- [ ] `npm install` ejecutado sin errores
- [ ] `.env` configurado correctamente
- [ ] `npm run dev` funciona
- [ ] Navegador abre en `localhost:3000`
- [ ] Placeholder visible correctamente

---

## 🎉 ¡Listo!

Si todos los pasos anteriores funcionaron, el sistema está **correctamente instalado** y listo para desarrollo.

**Siguiente paso**: Comenzar FASE 2 (UI/Componentes React)

---

**Última actualización**: Febrero 4, 2026  
**Sistema**: SCHEDULE - Imagen Marquillas SAS
