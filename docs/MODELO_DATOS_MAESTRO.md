MANUAL MAESTRO: LÓGICA DE TIEMPOS Y ASISTENCIA
1. PROTOCOLO DE CÁLCULO (DECIMAL PRIMERO)
Para evitar errores de redondeo y facilitar operaciones matemáticas, el sistema debe ignorar el formato visual para cálculos internos.

Entrada: Timestamps en formato ISO (UTC).

Proceso: 1. Calcular diferencia en milisegundos. 2. Convertir a Minutos Totales (milisegundos / 60,000). 3. Restar Minutos de Almuerzo (Entero). 4. Generar Valor Decimal (Minutos / 60).

Salida Visual: Solo al renderizar la UI, convertir el Decimal a HH:mm.

2. REGLAS DE NEGOCIO (EL ALMUERZO)
Sugerencia automática: El sistema propone 60 min por defecto.

Estado de edición: * null: No ingresado.

valor + editado: false: Sugerido (editable).

valor + editado: true: Confirmado (bloqueado/readonly).

Validación: El almuerzo no puede ser superior al tiempo total entre Entrada y Salida.

3. ARQUITECTURA DE DATOS (SUPABASE)
Tabla asistencia:

entrada: timestamptz

salida: timestamptz

almuerzo: int4 (almacenado siempre en minutos)

editado_manual: boolean (default: false)

4. ESTÁNDARES DE INTERFAZ
Formato de Fecha: YYYY/MM/DD.

Precisión: Los reportes de horas totales deben mostrar 2 decimales (ej: 8.25 en lugar de 8:15).