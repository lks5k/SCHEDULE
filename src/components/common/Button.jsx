/**
 * COMPONENTE BUTTON REUTILIZABLE
 * 
 * Botón con variantes de estilo y estados de carga.
 * Diseño moderno con Tailwind CSS.
 */

export function Button({ 
  onClick, 
  children, 
  type = 'button',
  variant = 'primary', 
  disabled = false,
  loading = false,
  className = ''
}) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        px-6 py-3 rounded-lg font-semibold
        transition-all duration-200
        ${variants[variant]}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      {loading ? 'Cargando...' : children}
    </button>
  );
}
