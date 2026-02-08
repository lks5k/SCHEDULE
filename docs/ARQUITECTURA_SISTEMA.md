# 🏛️ ARQUITECTURA DEL SISTEMA (VERDAD TÉCNICA)

## 🛠️ STACK & CONFIGURACIÓN
- **Frontend:** React + Vite (Puerto 3000)
- **Backend:** Supabase (Auth & Database)
- **Estándares:** Async/await, try/catch, imports con alias `@`, archivos < 300 líneas.

## 📊 MODELO DE DATOS (ASISTENCIA)
- **Tabla:** `attendance` (entrada: timestamptz, salida: timestamptz, almuerzo: int4 min).
- **Lógica de Pares:** Agrupar Entrada/Salida por día. 
- **Validación:** Solo se puede marcar Salida si existe una Entrada abierta.

## 🚀 GUÍA RÁPIDA DE DESARROLLO
- `npm run dev`: Inicia el servidor.
- `.env`: Contiene las llaves de Supabase (VITE_SUPABASE_URL/KEY).