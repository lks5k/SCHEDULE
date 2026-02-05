-- REINICIO TOTAL PARA INTEGRIDAD DE DATOS
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS time_records CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- 1. TABLA DE EMPLEADOS (ESTRUCTURA V3.1)
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cedula TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin', 'master')),
    blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. CARGA DE DATOS MAESTROS (SEGURIDAD NIVEL 2)
-- Protocolo: Cédula como ID, Password cumple [Letra + Número]
INSERT INTO employees (name, cedula, password, role) VALUES 
('Lukas Maestro', '10101010', 'Lukas2026', 'master'),
('Admin Proyectos', '20202020', 'Admin2026', 'admin'),
('Belisario Empleado', '30303030', 'Belisario2026', 'employee');

-- 3. TABLA DE REGISTROS DE TIEMPO
CREATE TABLE time_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    fecha TEXT NOT NULL,
    dia TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
    hora TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    observaciones TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 4. LOG DE ACTIVIDAD (PARA AUDITORÍA)
CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. SEGURIDAD RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;