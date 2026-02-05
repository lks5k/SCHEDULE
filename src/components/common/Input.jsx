/**
 * COMPONENTE INPUT REUTILIZABLE
 * 
 * Input con estilos Tailwind CSS profesionales.
 * Soporta validación y mensajes de error.
 */

export function Input({ 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  error, 
  disabled = false,
  autoFocus = false,
  minLength,
  maxLength,
  id,
  pattern,
  inputMode
}) {
  return (
    <div className="w-full">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        inputMode={inputMode}
        className={`
          w-full px-4 py-3 
          bg-gray-800 text-white 
          border-2 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-all duration-200
          placeholder-gray-400
          ${error ? 'border-red-500' : 'border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
