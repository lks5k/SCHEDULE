COMO USAR LOS DOCUMENTOS MAESTROS

DOCUMENTOS CREADOS:

1. MODELO_DATOS_MAESTRO.md
   - Que es: Definicion completa reglas negocio
   - Cuando leerlo: SIEMPRE antes cambio
   - Para que: Entender COMO funcionan datos

2. DIAGRAMA_FLUJO_SISTEMA.md
   - Que es: Flujos visuales del sistema
   - Cuando leerlo: Para entender secuencias
   - Para que: Ver dependencias entre componentes

3. ARQUITECTURA_SCHEDULE_IA.md
   - Que es: Estructura archivos + formatos
   - Cuando leerlo: Antes de crear archivos
   - Para que: Saber donde va cada cosa

═══════════════════════════════════════════════════════════════════════
USO CON CURSOR/CLAUDE
═══════════════════════════════════════════════════════════════════════

PROMPT TEMPLATE:

```
Implementar Excelencia Tecnica bajo protocolo Rigor.

Lee OBLIGATORIO:
@MODELO_DATOS_MAESTRO.md
@DIAGRAMA_FLUJO_SISTEMA.md
@ARQUITECTURA_SCHEDULE_IA.md
@.cursorrules

[Tu solicitud de cambio]

ANTES de generar codigo:
1. Identifica reglas negocio afectadas
2. Lista archivos dependientes
3. Verifica que cambio no rompe otras reglas
```

═══════════════════════════════════════════════════════════════════════
EJEMPLO PRACTICO
═══════════════════════════════════════════════════════════════════════

Quieres: Cambiar formato hora de HH:MM a HH:MM:SS

PASO 1: Leer MODELO_DATOS_MAESTRO.md
Buscar: REGLA 7 (Formato hora)
Resultado: "Siempre HH:MM, NUNCA HH:MM:SS"

PASO 2: Decidir si cambiar regla
Opcion A: Mantener HH:MM (recomendado)
Opcion B: Cambiar regla (requiere actualizar documento)

PASO 3: Si decides cambiar regla
1. Actualizar MODELO_DATOS_MAESTRO.md
   - REGLA 7: Cambiar a "Siempre HH:MM:SS"
2. Actualizar ARQUITECTURA_SCHEDULE_IA.md
   - Seccion formatos: hora: HH:MM:SS
3. Git commit documentos actualizados

PASO 4: Generar codigo
Prompt a Cursor:
```
Lee: @MODELO_DATOS_MAESTRO.md @DIAGRAMA_FLUJO_SISTEMA.md

Cambiar formato hora HH:MM a HH:MM:SS

Archivos afectar segun diagrama:
- dateTime.util.js
- pairs.service.js
- EmployeeView.jsx
- AdminView.jsx

Verifica REGLA 7 actualizada permite HH:MM:SS
```

PASO 5: Validar resultado
- Verificar en TODAS vistas formato HH:MM:SS
- Probar calculos siguen correctos
- Verificar MODELO_DATOS_MAESTRO.md refleja cambio

═══════════════════════════════════════════════════════════════════════
BENEFICIOS
═══════════════════════════════════════════════════════════════════════

ANTES (sin documentos):
Usuario: "Cambia el formato de hora"
IA: Cambia solo en EmployeeView
Resultado: AdminView muestra formato diferente (BUG)

DESPUES (con documentos):
Usuario: "Cambia el formato de hora"
IA: Lee MODELO_DATOS_MAESTRO.md
IA: Identifica REGLA 7 afectada
IA: Lee DIAGRAMA_FLUJO_SISTEMA.md
IA: Identifica archivos dependientes:
    - dateTime.util.js
    - pairs.service.js
    - EmployeeView.jsx
    - AdminView.jsx
IA: Cambia TODOS los archivos
Resultado: Formato consistente en TODA la app

═══════════════════════════════════════════════════════════════════════
MANTENIMIENTO DOCUMENTOS
═══════════════════════════════════════════════════════════════════════

CUANDO ACTUALIZAR:

MODELO_DATOS_MAESTRO.md:
- Cuando cambias regla negocio
- Cuando agregas nueva validacion
- Cuando cambias calculo
- Cuando agregas caso borde

DIAGRAMA_FLUJO_SISTEMA.md:
- Cuando agregas nuevo flujo
- Cuando cambias secuencia pasos
- Cuando agregas archivo nuevo
- Cuando cambias dependencias

ARQUITECTURA_SCHEDULE_IA.md:
- Cuando agregas tabla DB
- Cuando cambias estructura archivos
- Cuando agregas nuevo formato
- Cuando cambias configuracion

REGLA ORO:
Si cambias logica → Actualizar documento PRIMERO
Luego generar codigo basado en documento actualizado

═══════════════════════════════════════════════════════════════════════
PREVENCION BUGS
═══════════════════════════════════════════════════════════════════════

BUG TIPICO: Cambiar algo y romper otra cosa

CAUSA: No saber dependencias

SOLUCION: Antes de cambiar
1. Buscar en DIAGRAMA_FLUJO_SISTEMA.md
2. Ver seccion "MAPA DE DEPENDENCIAS"
3. Identificar archivos afectados
4. Cambiar TODOS o ninguno

EJEMPLO:
Cambias calcularHorasTrabajadas()
DIAGRAMA dice:
  pairs.service.js
      ↓
      ├→ EmployeeView.jsx
      └→ AdminView.jsx

Debes probar en:
- Vista empleado
- Vista admin
- Verificar total_horas
- Verificar total_decimal

═══════════════════════════════════════════════════════════════════════
CHECKLIST ANTES CAMBIO
═══════════════════════════════════════════════════════════════════════

Antes de pedir cambio a IA:

[ ] Lei MODELO_DATOS_MAESTRO.md completo
[ ] Identifique reglas negocio afectadas
[ ] Revise DIAGRAMA_FLUJO_SISTEMA.md
[ ] Liste archivos dependientes
[ ] Decidi si cambio requiere actualizar documentos
[ ] Si requiere: Actualice documentos PRIMERO
[ ] Prepare prompt con referencias @ a documentos
[ ] Listo para generar codigo

═══════════════════════════════════════════════════════════════════════
