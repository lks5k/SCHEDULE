import { useState, useEffect } from 'react';
import { Button, Toast } from '@/components/common';

export function ConfigView() {
  const [employeeTimeout, setEmployeeTimeout] = useState('10000');
  const [adminTimeout, setAdminTimeout] = useState('10000');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const TIMEOUT_OPTIONS = [
    { label: '10 segundos', value: '10000' },
    { label: '20 segundos', value: '20000' },
    { label: '1 minuto', value: '60000' },
    { label: '5 minutos', value: '300000' },
    { label: '15 minutos', value: '900000' }
  ];

  useEffect(() => {
    const empTimeout = localStorage.getItem('employeeLogoutTimeout') || '10000';
    const admTimeout = localStorage.getItem('adminLogoutTimeout') || '10000';
    setEmployeeTimeout(empTimeout);
    setAdminTimeout(admTimeout);
  }, []);

  const handleSave = () => {
    localStorage.setItem('employeeLogoutTimeout', employeeTimeout);
    localStorage.setItem('adminLogoutTimeout', adminTimeout);

    setToastMessage('✅ Configuración guardada. Los cambios aplicarán en próximo login.');
    setShowToast(true);

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          ⚙️ Configuración del Sistema
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2">
              🕐 Logout automático - Empleados
            </label>
            <select
              value={employeeTimeout}
              onChange={(e) => setEmployeeTimeout(e.target.value)}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              {TIMEOUT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-slate-400 text-sm mt-2">
              Tiempo de inactividad antes de cerrar sesión automáticamente
            </p>
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              🕐 Logout automático - Administradores
            </label>
            <select
              value={adminTimeout}
              onChange={(e) => setAdminTimeout(e.target.value)}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              {TIMEOUT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-slate-400 text-sm mt-2">
              Tiempo de inactividad antes de cerrar sesión automáticamente
            </p>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSave}
              variant="primary"
              className="w-full py-3"
            >
              💾 Guardar Configuración
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
