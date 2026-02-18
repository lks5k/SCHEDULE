import { useState } from 'react';
import { supabase } from '@/config/supabase.config';
import { Button, Toast } from '@/components/common';

export function AddUserModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    cedula: '',
    password: '',
    role: 'employee',
  });
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  if (!isOpen) return null;

  // CAMBIO 5: Generador de contraseña sin caracteres ambiguos
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData({ ...formData, password: pwd });
  };

  // CAMBIO 4: Validación de cédula y nombre antes de insertar
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{7,10}$/.test(formData.cedula)) {
      setToastMessage('Cédula debe tener 7-10 dígitos');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.name)) {
      setToastMessage('Nombre solo permite letras');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setLoading(true);

    try {
      // CAMBIO 4: maybeSingle() evita error PGRST116 cuando no existe
      const { data: existing } = await supabase
        .from('employees')
        .select('id')
        .eq('cedula', formData.cedula)
        .maybeSingle();

      if (existing) {
        setToastMessage('Cédula ya existe');
        setToastType('error');
        setShowToast(true);
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('employees').insert({
        name: formData.name,
        cedula: formData.cedula,
        password: formData.password,
        role: formData.role,
        blocked: false,
      });

      if (error) throw error;

      setToastMessage('Usuario creado');
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({ name: '', cedula: '', password: '', role: 'employee' });
      }, 1500);
    } catch (error) {
      setToastMessage('Error: ' + error.message);
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Agregar Usuario</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Juan Perez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-2">Cédula</label>
            <input
              type="text"
              placeholder="Ej: 1234567890"
              value={formData.cedula}
              maxLength="10"
              onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          {/* CAMBIO 5: Campo contraseña con botón generador */}
          <div>
            <label className="block text-white mb-2">Contraseña</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Min 6 caracteres, incluir números"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
                required
                minLength="6"
              />
              <button
                type="button"
                onClick={generatePassword}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Generar
              </button>
            </div>
          </div>
          <div>
            <label className="block text-white mb-2">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="employee">Empleado</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Crear
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
