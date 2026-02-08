MODELO DE DATOS MAESTRO - SCHEDULE
DOCUMENTO FUENTE DE VERDAD UNICA

PROPOSITO:
Este documento define COMO funcionan los datos
Toda IA debe leerlo ANTES de generar codigo
Previene bugs al cambiar una cosa y romper otra

═══════════════════════════════════════════════════════════════════════
ENTIDADES Y RELACIONES
═══════════════════════════════════════════════════════════════════════

EMPLEADO
  id: integer (PK)
  name: text
  cedula: text (UNIQUE)
  password: text
  role: enum (employee, admin, master)
  blocked: boolean
  created_at: timestamp
  deleted_at: timestamp (soft delete)

REGISTRO_TIEMPO
  id: integer (PK)
  employee_id: integer (FK → EMPLEADO.id)
  employee_name: text (desnormalizado)
  fecha: text (DD/MM/YYYY)
  dia: text (lunes, martes...)
  tipo: enum (ENTRADA, SALIDA)
  hora: text (HH:MM formato 24h)
  timestamp: timestamptz (UTC, para ordenar)
  tiempo_almuerzo: text (HH:MM, default 02:00)
  tiempo_almuerzo_editado: boolean (default false)
  licencia_remunerada: boolean (default false)
  total_horas: text (HH:MM calculado)
  total_horas_decimal: decimal(5,2) (calculado)
  observaciones: text
  created_at: timestamp
  deleted_at: timestamp (soft delete)

RELACION:
EMPLEADO 1→N REGISTRO_TIEMPO

═══════════════════════════════════════════════════════════════════════
REGLAS DE NEGOCIO (INVARIANTES)
═══════════════════════════════════════════════════════════════════════

REGLA 1: SECUENCIA ENTRADA-SALIDA
  Definicion:
    Registros deben alternar ENTRADA → SALIDA → ENTRADA → SALIDA
  
  Validacion:
    ANTES de insertar nuevo registro:
    1. Obtener ultimo registro empleado
    2. Si ultimo = ENTRADA → proximo DEBE ser SALIDA
    3. Si ultimo = SALIDA → proximo DEBE ser ENTRADA
    4. Si no hay registros → proximo DEBE ser ENTRADA
  
  Consecuencia:
    NUNCA puede haber dos ENTRADA consecutivas
    NUNCA puede haber dos SALIDA consecutivas

REGLA 2: PAR ENTRADA-SALIDA
  Definicion:
    Un PAR es la combinacion de:
    - 1 ENTRADA (timestamp T1)
    - 1 SALIDA (timestamp T2, donde T2 > T1)
  
  Formacion de pares:
    1. Ordenar registros por timestamp ASC
    2. Recorrer lista:
       a. Cuando encuentras ENTRADA → guardar como inicio_par
       b. Cuando encuentras SALIDA → cerrar par con inicio_par
       c. Si encuentras ENTRADA sin SALIDA → par incompleto
  
  Visualizacion:
    Par completo: [ENTRADA 08:00] → [SALIDA 18:00]
    Par incompleto: [ENTRADA 08:00] → [sin SALIDA]

REGLA 3: CALCULO HORAS TRABAJADAS
  Formula:
    total_minutos = (hora_salida - hora_entrada) - tiempo_almuerzo
  
  Casos especiales:
    Si hora_salida < hora_entrada → agregar 24 horas (cruza medianoche)
    Si resultado < 0 → total = 0
  
  Conversion decimal:
    total_decimal = horas + (minutos / 60)
    Ejemplo: 8h 30min = 8 + (30/60) = 8.50

REGLA 4: TIEMPO ALMUERZO EDITABLE
  Comportamiento:
    1. Default: 02:00
    2. Usuario puede editar UNA sola vez
    3. Rango permitido: 00:00 a 02:00
    4. Despues de editar: campo bloqueado
  
  Validacion:
    ANTES de guardar edicion:
    1. Verificar tiempo_almuerzo_editado = false
    2. Validar formato HH:MM
    3. Validar rango 00:00 - 02:00
    4. Marcar tiempo_almuerzo_editado = true

REGLA 5: ULTIMOS 10 PARES
  Definicion:
    Mostrar solo ultimos 10 PARES (no registros individuales)
  
  Ordenamiento:
    Por timestamp del registro ENTRADA, DESC (mas reciente primero)
  
  Limite:
    Exactamente 10 pares maximo
    Si hay menos de 10 pares → mostrar todos

REGLA 6: FORMATO FECHA
  Almacenamiento interno: DD/MM/YYYY
  Display usuario: AAAA/MM/DD
  Conversion:
    "06/02/2026" → "2026/02/06"
    Split por '/' → invertir → join

REGLA 7: FORMATO HORA
  Siempre: HH:MM (24 horas)
  NUNCA: HH:MM:SS
  NUNCA: formato 12h (AM/PM)

═══════════════════════════════════════════════════════════════════════
FLUJO DE DATOS CRITICO
═══════════════════════════════════════════════════════════════════════

FLUJO 1: MARCACION DE ASISTENCIA

[Empleado hace clic "Marcar"]
    ↓
[checkLastRecord(employee_id)]
    ↓
[Valida que proximo tipo sea correcto]
    ↓
[getCurrentDateTimeColombia()] → fecha, dia, hora
    ↓
[INSERT en time_records con tipo validado]
    ↓
[Recalcular pares si hay SALIDA nueva]
    ↓
[Actualizar vista]

FLUJO 2: CARGAR PARES EMPLEADO

[loadPairs(employee_id)]
    ↓
[SELECT * FROM time_records WHERE employee_id = X ORDER BY timestamp ASC]
    ↓
[Algoritmo formacion pares:]
    pares = []
    par_actual = null
    
    FOR EACH registro:
      IF registro.tipo = ENTRADA:
        IF par_actual existe:
          pares.push(par_actual)
        par_actual = {entrada: registro, salida: null}
      
      IF registro.tipo = SALIDA AND par_actual existe:
        par_actual.salida = registro
        calcular horas
        pares.push(par_actual)
        par_actual = null
    
    IF par_actual existe (ENTRADA sin SALIDA):
      pares.push(par_actual)
    
    pares.reverse() // Mas reciente primero
    return pares.slice(0, 10) // Ultimos 10

FLUJO 3: EDITAR TIEMPO ALMUERZO

[Usuario hace clic en tiempo_almuerzo]
    ↓
[Verificar tiempo_almuerzo_editado = false]
    ↓
[Mostrar input type="time"]
    ↓
[Usuario edita y presiona ENTER]
    ↓
[Validar formato HH:MM]
    ↓
[Validar rango 00:00 - 02:00]
    ↓
[UPDATE time_records SET tiempo_almuerzo = X, tiempo_almuerzo_editado = true WHERE id = entrada_id]
    ↓
[Recalcular total_horas del par]
    ↓
[Bloquear campo (disabled=true)]
    ↓
[Actualizar vista]

═══════════════════════════════════════════════════════════════════════
CASOS BORDE Y VALIDACIONES
═══════════════════════════════════════════════════════════════════════

CASO 1: Usuario marca ENTRADA dos veces seguidas
  Comportamiento esperado: ERROR
  Validacion: checkLastRecord debe prevenir
  Mensaje: "Debe marcar SALIDA primero"

CASO 2: Hora de salida antes que hora de entrada (cruza medianoche)
  Ejemplo: ENTRADA 23:00, SALIDA 01:00
  Comportamiento: Asumir cruce medianoche
  Calculo: (01:00 + 24:00) - 23:00 = 02:00 horas

CASO 3: Intentar editar tiempo_almuerzo ya editado
  Comportamiento esperado: ERROR
  Validacion: Verificar tiempo_almuerzo_editado = true
  Mensaje: "Ya fue editado anteriormente"

CASO 4: Intentar editar tiempo_almuerzo con valor > 02:00
  Ejemplo: Usuario ingresa 03:30
  Comportamiento esperado: ERROR
  Validacion: Validar totalMinutes <= 120
  Mensaje: "Maximo 02:00"

CASO 5: No hay SALIDA para ultima ENTRADA
  Comportamiento esperado: Mostrar par incompleto
  Display:
    ENTRADA: 08:00
    SALIDA: (vacio)
    Total horas: (vacio)

CASO 6: Empleado tiene 15 pares de registros
  Comportamiento esperado: Mostrar solo ultimos 10
  Validacion: pares.slice(0, 10)

═══════════════════════════════════════════════════════════════════════
DEPENDENCIAS ENTRE COMPONENTES
═══════════════════════════════════════════════════════════════════════

SI CAMBIAS: getCurrentDateTimeColombia()
AFECTA: 
  - attendance.service.js → recordAttendance()
  - Formato hora en TODA la app
VALIDAR: Que retorne solo HH:MM

SI CAMBIAS: calcularHorasTrabajadas()
AFECTA:
  - pairs.service.js → getEmployeePairs()
  - Display de total_horas en EmployeeView y AdminView
VALIDAR: Formula correcta, manejo medianoche

SI CAMBIAS: getEmployeePairs()
AFECTA:
  - EmployeeView.jsx → tabla pares
  - AdminView.jsx → tabla pares admin
VALIDAR: Orden temporal correcto, limite 10 pares

SI CAMBIAS: updateTiempoAlmuerzo()
AFECTA:
  - EmployeeView.jsx → input editable
  - Recalculo total_horas del par
VALIDAR: Bloqueo despues edicion, validacion rango

SI CAMBIAS: time_records schema
AFECTA:
  - TODOS los servicios
  - TODOS los componentes que leen/escriben registros
VALIDAR: Migration plan, retrocompatibilidad

═══════════════════════════════════════════════════════════════════════
CHECKLIST ANTES DE CUALQUIER CAMBIO
═══════════════════════════════════════════════════════════════════════

ANTES de modificar codigo:

1. LEER este documento completo
2. IDENTIFICAR regla(s) de negocio afectadas
3. VERIFICAR dependencias entre componentes
4. PLANEAR cambios en todos archivos afectados
5. VALIDAR casos borde aplicables
6. ESCRIBIR plan de testing

EJEMPLO:
Quiero cambiar formato hora de HH:MM a HH:MM:SS

Reglas afectadas: REGLA 7 (Formato hora)
Componentes afectados:
  - getCurrentDateTimeColombia() → cambiar return
  - calcularHorasTrabajadas() → cambiar parsing
  - EmployeeView.jsx → cambiar display
  - AdminView.jsx → cambiar display
  - ARQUITECTURA_SCHEDULE_IA.md → actualizar
  
Casos borde: Ninguno nuevo
Testing: Verificar display correcto en todas vistas

═══════════════════════════════════════════════════════════════════════
INSTRUCCIONES PARA IA
═══════════════════════════════════════════════════════════════════════

ANTES de generar CUALQUIER codigo:

1. LEE este documento COMPLETO
2. IDENTIFICA que reglas de negocio aplican
3. VERIFICA que cambio no rompe otras reglas
4. LISTA dependencias afectadas
5. GENERA codigo alineado con TODAS las reglas

SI hay conflicto entre este documento y codigo existente:
  → Este documento es VERDAD
  → Codigo debe ajustarse a documento

SI necesitas cambiar una regla de negocio:
  → DETENTE
  → PREGUNTA al usuario
  → NO cambies reglas sin aprobacion

EJEMPLO DE USO:

Usuario: "Cambia el calculo de horas para restar 1 hora fija en vez de tiempo_almuerzo variable"

IA debe:
1. Leer REGLA 3 (Calculo horas trabajadas)
2. Identificar que esto cambia la regla
3. Preguntar: "Esto cambia REGLA 3. Afecta: calcularHorasTrabajadas(), getEmployeePairs(), display en vistas. Confirmas cambio?"
4. Si usuario confirma → actualizar documento + codigo

═══════════════════════════════════════════════════════════════════════

VERSION: 1.0
FECHA: 07 Feb 2026
STATUS: ACTIVO
AUTOR: Claude + Lukas

Este documento debe actualizarse CADA VEZ que cambia logica negocio.
