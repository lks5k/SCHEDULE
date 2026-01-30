-- ============================================
-- INSTRUCCIONES PARA CONFIGURAR SUPABASE
-- ============================================

/*
PASOS PARA CONFIGURAR:

1. Ve a https://supabase.com y crea una cuenta gratuita
2. Crea un nuevo proyecto
3. Ve a SQL Editor en el menú lateral
4. Copia y pega TODAS las consultas de este archivo
5. Ejecuta cada bloque de SQL
6. Obtén tus credenciales:
   - Settings → API → Project URL (tu SUPABASE_URL)
   - Settings → API → Project API keys → anon/public (tu SUPABASE_ANON_KEY)
7. Edita el archivo HTML y reemplaza las credenciales en la línea 799:
   const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
   const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI';
*/

-- ============================================
-- 1. TABLA DE EMPLEADOS
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar empleado inicial
INSERT INTO employees (id, name, password, blocked) 
VALUES (1, 'Belisario Corrales', '333333', FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. TABLA DE REGISTROS DE TIEMPO
-- ============================================
CREATE TABLE IF NOT EXISTS time_records (
    id BIGINT PRIMARY KEY,
    employee_id BIGINT REFERENCES employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    fecha TEXT NOT NULL,
    dia TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
    hora TEXT NOT NULL,
    dispositivo TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    observaciones TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_time_records_employee 
ON time_records(employee_id);

CREATE INDEX IF NOT EXISTS idx_time_records_fecha 
ON time_records(fecha);

CREATE INDEX IF NOT EXISTS idx_time_records_tipo 
ON time_records(tipo);

-- ============================================
-- 3. TABLA DE LOG DE ACTIVIDAD
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para ordenar por timestamp
CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp 
ON activity_log(timestamp DESC);

-- ============================================
-- 4. POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura a todos (anon)
CREATE POLICY "Allow public read access"
ON employees FOR SELECT
USING (true);

CREATE POLICY "Allow public read access"
ON time_records FOR SELECT
USING (true);

CREATE POLICY "Allow public read access"
ON activity_log FOR SELECT
USING (true);

-- Política: Permitir inserción a todos
CREATE POLICY "Allow public insert access"
ON employees FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public insert access"
ON time_records FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public insert access"
ON activity_log FOR INSERT
WITH CHECK (true);

-- Política: Permitir actualización a todos
CREATE POLICY "Allow public update access"
ON employees FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public update access"
ON time_records FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política: Permitir eliminación a todos
CREATE POLICY "Allow public delete access"
ON employees FOR DELETE
USING (true);

CREATE POLICY "Allow public delete access"
ON time_records FOR DELETE
USING (true);

-- ============================================
-- 5. FUNCIONES ÚTILES (OPCIONAL)
-- ============================================

-- Función para obtener registros pareados
CREATE OR REPLACE FUNCTION get_paired_records()
RETURNS TABLE (
    fecha TEXT,
    employee_name TEXT,
    entrada_hora TEXT,
    salida_hora TEXT,
    horas_trabajadas TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH numbered_records AS (
        SELECT 
            tr.fecha,
            tr.employee_name,
            tr.tipo,
            tr.hora,
            ROW_NUMBER() OVER (PARTITION BY tr.employee_id, tr.fecha ORDER BY tr.hora) as rn
        FROM time_records tr
        ORDER BY tr.fecha DESC, tr.hora
    )
    SELECT 
        e.fecha,
        e.employee_name,
        e.hora as entrada_hora,
        s.hora as salida_hora,
        '00:00:00' as horas_trabajadas -- Calcular en frontend
    FROM numbered_records e
    LEFT JOIN numbered_records s 
        ON e.fecha = s.fecha 
        AND e.employee_name = s.employee_name
        AND e.rn + 1 = s.rn
        AND e.tipo = 'ENTRADA'
        AND s.tipo = 'SALIDA'
    WHERE e.tipo = 'ENTRADA';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CONSULTAS DE VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('employees', 'time_records', 'activity_log');

-- Verificar empleado inicial
SELECT * FROM employees;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

/*
ESTRUCTURA DE DATOS:

employees:
- id: ID único del empleado
- name: Nombre completo
- password: Contraseña de 6 dígitos
- blocked: Estado (bloqueado/activo)

time_records:
- id: ID único del registro
- employee_id: FK a employees
- employee_name: Nombre (desnormalizado para rapidez)
- fecha: Fecha en formato DD/MM/YYYY
- dia: Nombre del día
- tipo: 'ENTRADA' o 'SALIDA'
- hora: Hora en formato HH:MM:SS
- dispositivo: Info del dispositivo
- timestamp: Timestamp completo
- observaciones: Comentarios opcionales

activity_log:
- id: ID único del evento
- timestamp: Cuándo ocurrió
- user_name: Quién lo ejecutó
- action: Tipo de acción
- details: Detalles adicionales

IMPORTANTE:
- Las políticas RLS están configuradas para permitir acceso público
- En producción, deberías configurar autenticación real
- Los IDs son BIGINT para soportar timestamps de JavaScript
*/

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================

-- Agregar más empleados de prueba
INSERT INTO employees (id, name, password, blocked) VALUES
(2, 'Juan Raigoza', '444444', FALSE),
(3, 'Justin Trujillo', '555555', FALSE),
(4, 'Leonardo Ceballos', '666666', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Agregar registros de prueba
INSERT INTO time_records (id, employee_id, employee_name, fecha, dia, tipo, hora, dispositivo, timestamp) VALUES
(1000001, 1, 'Belisario Corrales', '28/01/2026', 'martes', 'ENTRADA', '08:00:00', 'Win32', '2026-01-28T08:00:00Z'),
(1000002, 1, 'Belisario Corrales', '28/01/2026', 'martes', 'SALIDA', '17:30:00', 'Win32', '2026-01-28T17:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- Verificar datos insertados
SELECT * FROM employees ORDER BY id;
SELECT * FROM time_records ORDER BY timestamp DESC LIMIT 10;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
