DIAGRAMA DE FLUJO DEL SISTEMA - SCHEDULE

FLUJO PRINCIPAL: MARCACION Y VISUALIZACION

┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: Empleado hace clic "Marcar ENTRADA/SALIDA"           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SERVICIO: checkLastRecord(employee_id)                         │
│                                                                 │
│ Query: SELECT * FROM time_records                              │
│        WHERE employee_id = X AND deleted_at IS NULL            │
│        ORDER BY timestamp DESC LIMIT 1                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │  Tiene registro?  │
                    └─────────┬─────────┘
                    NO ↓      │ SÍ
        ┌───────────────┐    ↓
        │ nextAction =  │    │
        │   ENTRADA     │    │
        └───────────────┘    │
                             │
                ┌────────────┴────────────┐
                │ Ultimo tipo = ENTRADA?  │
                └────────────┬────────────┘
                        SÍ ↓ │ NO
            ┌───────────────┴───────────────┐
            │ nextAction = SALIDA           │ nextAction = ENTRADA
            └───────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ VALIDACION: Usuario intenta marcar tipo correcto?             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │ Tipo correcto?    │
                    └─────────┬─────────┘
                    SÍ ↓      │ NO
        ┌───────────────┐    ↓
        │   CONTINUAR   │    └→ ERROR: "Debe marcar [tipo_esperado] primero"
        └───────────────┘       └→ RETURN
                ↓
┌─────────────────────────────────────────────────────────────────┐
│ UTILIDAD: getCurrentDateTimeColombia()                         │
│                                                                 │
│ Returns: {                                                     │
│   fecha: "DD/MM/YYYY"                                          │
│   dia: "lunes"                                                 │
│   hora: "HH:MM"                                                │
│ }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ BASE DE DATOS: INSERT INTO time_records                        │
│                                                                 │
│ VALUES (                                                       │
│   employee_id,                                                 │
│   employee_name,                                               │
│   fecha,         // DD/MM/YYYY                                 │
│   dia,           // "lunes"                                    │
│   tipo,          // ENTRADA o SALIDA                           │
│   hora,          // HH:MM                                      │
│   timestamp,     // NOW() UTC                                  │
│   tiempo_almuerzo = "02:00",                                   │
│   tiempo_almuerzo_editado = false,                             │
│   observaciones = ""                                           │
│ )                                                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: Si tipo = SALIDA → Recalcular par                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ SERVICIO: getEmployeePairs(employee_id)                       │
│                                                                 │
│ 1. SELECT * FROM time_records                                  │
│    WHERE employee_id = X                                       │
│    ORDER BY timestamp ASC                                      │
│                                                                 │
│ 2. ALGORITMO FORMACION PARES:                                  │
│    pares = []                                                  │
│    par_actual = null                                           │
│                                                                 │
│    FOR registro IN registros:                                  │
│      IF registro.tipo == ENTRADA:                              │
│        IF par_actual EXISTE:                                   │
│          pares.push(par_actual)                                │
│        par_actual = {entrada: registro, salida: null}          │
│                                                                 │
│      IF registro.tipo == SALIDA AND par_actual EXISTE:         │
│        par_actual.salida = registro                            │
│        par_actual.total = calcularHoras(par)                   │
│        pares.push(par_actual)                                  │
│        par_actual = null                                       │
│                                                                 │
│    IF par_actual EXISTE: // ENTRADA sin SALIDA                 │
│      pares.push(par_actual)                                    │
│                                                                 │
│ 3. pares.reverse() // Mas reciente primero                     │
│ 4. return pares.slice(0, 10) // Ultimos 10                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ UTILIDAD: calcularHorasTrabajadas(entrada, salida, almuerzo)  │
│                                                                 │
│ 1. parseTime(hora) → minutos totales                           │
│    "08:30" → 510 minutos                                       │
│                                                                 │
│ 2. diff = salida_min - entrada_min                             │
│    IF diff < 0: diff += 24*60 // Cruza medianoche             │
│                                                                 │
│ 3. diff -= almuerzo_min                                        │
│    IF diff < 0: diff = 0                                       │
│                                                                 │
│ 4. horas = floor(diff / 60)                                    │
│    minutos = diff % 60                                         │
│                                                                 │
│ 5. total_horas = "HH:MM"                                       │
│    total_decimal = horas + (minutos/60)                        │
│                                                                 │
│ 6. return {total_horas, total_decimal}                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ VISTA: EmployeeView.jsx o AdminView.jsx                       │
│                                                                 │
│ TABLA DE PAREJAS:                                              │
│ ┌──────────────────────────────────────────────────────┐      │
│ │ FECHA | DIA | ENTRADA | SALIDA | ALMUERZO | TOTAL   │      │
│ ├──────────────────────────────────────────────────────┤      │
│ │ 2026/ | Vie | 08:00   | 18:00  | 02:00    | 08:00   │      │
│ │ 02/06 |     |         |        |          | (8.00)  │      │
│ └──────────────────────────────────────────────────────┘      │
│                                                                 │
│ Formato fecha: AAAA/MM/DD (convertido desde DD/MM/YYYY)       │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════

FLUJO SECUNDARIO: EDICION TIEMPO ALMUERZO

┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: Hace clic en campo tiempo_almuerzo                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ VALIDACION PREVIA: tiempo_almuerzo_editado == false?          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │ Ya editado?       │
                    └─────────┬─────────┘
                    SÍ ↓      │ NO
        ┌───────────────┐    ↓
        │ MOSTRAR ERROR │    └→ MOSTRAR INPUT
        │ No editable   │       type="time"
        └───────────────┘       min="00:00"
                                max="02:00"
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: Edita valor y presiona ENTER                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ VALIDACION FORMATO: Regex /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/│
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │ Formato correcto? │
                    └─────────┬─────────┘
                    SÍ ↓      │ NO
        ┌───────────────┐    ↓
        │   CONTINUAR   │    └→ ERROR: "Formato invalido"
        └───────────────┘       └→ RETURN
                ↓
┌─────────────────────────────────────────────────────────────────┐
│ VALIDACION RANGO: totalMinutes <= 120?                        │
│ (120 minutos = 02:00)                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    │ Dentro rango?     │
                    └─────────┬─────────┘
                    SÍ ↓      │ NO
        ┌───────────────┐    ↓
        │   CONTINUAR   │    └→ ERROR: "Maximo 02:00"
        └───────────────┘       └→ RETURN
                ↓
┌─────────────────────────────────────────────────────────────────┐
│ BASE DE DATOS: UPDATE time_records                             │
│                                                                 │
│ SET tiempo_almuerzo = nuevo_valor,                             │
│     tiempo_almuerzo_editado = true                             │
│ WHERE id = entrada_id                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: Recalcular total_horas del par                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ VISTA: Actualizar tabla                                        │
│ - Input pasa a disabled                                        │
│ - Total horas recalculado                                      │
│ - Total decimal recalculado                                    │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════

MAPA DE DEPENDENCIAS DE ARCHIVOS

time_records (DB)
    ↓
    ├→ attendance.service.js
    │   ├→ recordAttendance()
    │   └→ checkLastRecord()
    │
    ├→ pairs.service.js
    │   ├→ getEmployeePairs()
    │   ├→ calcularHorasTrabajadas()
    │   └→ updateTiempoAlmuerzo()
    │
    └→ dateTime.util.js
        └→ getCurrentDateTimeColombia()

pairs.service.js
    ↓
    ├→ EmployeeView.jsx
    │   └→ Tabla parejas empleado
    │
    └→ AdminView.jsx
        └→ Tabla parejas admin

attendance.service.js
    ↓
    ├→ EmployeeView.jsx
    │   └→ Boton marcar
    │
    └→ AdminView.jsx
        └→ Dashboard tiempo real

ARQUITECTURA_SCHEDULE_IA.md
    ↓
    └→ TODAS las IAs deben leerlo

MODELO_DATOS_MAESTRO.md
    ↓
    └→ TODAS las IAs deben leerlo

═══════════════════════════════════════════════════════════════════════

PUNTOS CRITICOS (NO TOCAR SIN LEER MODELO_DATOS_MAESTRO.md)

1. Algoritmo formacion pares → pairs.service.js:getEmployeePairs()
2. Formula calculo horas → pairs.service.js:calcularHorasTrabajadas()
3. Validacion secuencia ENTRADA-SALIDA → attendance.service.js:checkLastRecord()
4. Formato fecha display → EmployeeView.jsx y AdminView.jsx (conversion DD/MM → AAAA/MM)
5. Bloqueo edicion almuerzo → EmployeeView.jsx (input disabled)

SI CAMBIAS CUALQUIERA:
1. LEER MODELO_DATOS_MAESTRO.md COMPLETO
2. IDENTIFICAR reglas afectadas
3. VERIFICAR dependencias
4. ACTUALIZAR MODELO_DATOS_MAESTRO.md si cambia regla
5. ACTUALIZAR TODOS archivos afectados

═══════════════════════════════════════════════════════════════════════
