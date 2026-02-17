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
          const formatted = formatTimeInput(e.target.value);
          if (formatted.length <= 5) {
            setValue(formatted);
          }
        }}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            if (validateTimeInput(value) && validateAlmuerzoRange(value)) {
              onSave(pair.entrada.id, value);
              setIsEditing(false);
            } else {
              onError('Formato invalido o fuera de rango 00:00-02:00');
            }
          }
        }}
        onBlur={() => setIsEditing(false)}
        placeholder="HH:MM"
        maxLength="5"
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
