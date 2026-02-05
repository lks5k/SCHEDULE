/**
 * VISTA EMPLEADO V3.0
 * 
 * Vista placeholder para FASE 3.
 * Protocolo de rigor: integración con servicios reales.
 */

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common';

export function EmployeeView() {
  const { currentUser, handleLogout } = useAuth();

  const onLogout = async () => {
    await handleLogout();
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              👋 Hola, {currentUser?.name}!
            </h1>
            <p className="text-slate-400">
              Empleado
            </p>
          </div>
          <Button onClick={onLogout} variant="danger">
            Cerrar Sesión
          </Button>
        </div>

        {/* Contenido */}
        <div className="bg-slate-800 rounded-2xl p-12 text-center border border-slate-700">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Vista Empleado
          </h2>
          <p className="text-slate-400 mb-2">
            FASE 2 completada: Login funcional
          </p>
          <p className="text-slate-500 text-sm">
            FASE 3: Marcación de asistencia (próximamente)
          </p>
        </div>
      </div>
    </div>
  );
}
