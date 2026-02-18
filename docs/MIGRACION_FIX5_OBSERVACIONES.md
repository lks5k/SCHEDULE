# Migración FIX 5 — Observaciones 3 Columnas

## Descripción

Agrega 3 columnas de observaciones independientes a la tabla `time_records`, cada una con su flag de editado para control de inmutabilidad post-guardado.

## SQL a ejecutar en Supabase Dashboard

```sql
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS observacion_1 TEXT;
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS observacion_1_editado BOOLEAN DEFAULT false;
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS observacion_2 TEXT;
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS observacion_2_editado BOOLEAN DEFAULT false;
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS observacion_3 TEXT;
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS observacion_3_editado BOOLEAN DEFAULT false;
```

## Instrucciones

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Pegar el SQL anterior
3. Ejecutar con **Run**
4. Verificar que las 6 columnas aparecen en **Table Editor → time_records**

## Comportamiento

- Cada observación se puede editar **una sola vez** (flag `_editado = true` bloquea edición posterior)
- Las observaciones solo existen en registros de tipo **ENTRADA**
- La Vista Parejas muestra Obs 1, Obs 2, Obs 3 como columnas separadas
- La Vista Tiempo Real **no** muestra observaciones (eliminadas en FIX 5)

## Rollback (si es necesario)

```sql
ALTER TABLE time_records DROP COLUMN IF EXISTS observacion_1;
ALTER TABLE time_records DROP COLUMN IF EXISTS observacion_1_editado;
ALTER TABLE time_records DROP COLUMN IF EXISTS observacion_2;
ALTER TABLE time_records DROP COLUMN IF EXISTS observacion_2_editado;
ALTER TABLE time_records DROP COLUMN IF EXISTS observacion_3;
ALTER TABLE time_records DROP COLUMN IF EXISTS observacion_3_editado;
```
