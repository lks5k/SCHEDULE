import { useState } from 'react';
import { formatTimeInput, validateTimeInput, validateAlmuerzoRange } from '@/utils/timeInput.util';

export function EditableTimeCell({
  pair,
  onSave,
  onError,
  disabled = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');

  if (disabled || pair.tiempo_almuerzo_editado) {
    return (
      <span className="font-mono cursor-not-allowed opacity-50">
        {pair.tiempo_almuerzo}
      </span>
    );
  }

  if (isEditing) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => {
          // Solo permitir números, sin formatear aún
          const cleaned = e.target.value.replace(/[^0-9]/g, '');
          if (cleaned.length <= 4) {
            setValue(cleaned);
          }
        }}
        onFocus={(e) => {
          e.target.select();
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            // Formatear AQUÍ antes validar
            const formatted = formatTimeInput(value);

            if (validateTimeInput(formatted) && validateAlmuerzoRange(formatted)) {
              onSave(pair.entrada.id, formatted);
              setIsEditing(false);
            } else {
              onError('Formato invalido o fuera de rango 00:00-02:00');
              setIsEditing(false);
            }
          }
        }}
        onBlur={() => {
          // Formatear AQUÍ al perder foco
          const formatted = formatTimeInput(value);
          setValue(formatted);
          setIsEditing(false);
        }}
        placeholder="0000"
        maxLength="4"
        className="bg-slate-700 text-white px-2 py-1 rounded text-sm w-20 font-mono"
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => {
        if (pair.entrada) {
          setIsEditing(true);
          setValue(pair.tiempo_almuerzo);
        }
      }}
      className="font-mono cursor-pointer hover:text-blue-400"
    >
      {pair.tiempo_almuerzo}
    </span>
  );
}
