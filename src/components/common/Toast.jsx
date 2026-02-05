/**
 * COMPONENTE TOAST
 * 
 * Notificaciones temporales con auto-cierre.
 * Diseño moderno con animaciones.
 */

import { useEffect } from 'react';

export function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const types = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600'
  };

  return (
    <div className={`
      fixed top-4 right-4 z-50
      ${types[type]} text-white
      px-6 py-4 rounded-lg shadow-2xl
      animate-slide-in-right
      max-w-md
    `}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{message}</p>
        <button 
          onClick={onClose} 
          className="text-2xl hover:scale-110 transition-transform"
        >
          ×
        </button>
      </div>
    </div>
  );
}
