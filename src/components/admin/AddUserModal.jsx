import { useState } from 'react';
import { supabase } from '@/config/supabase.config';
import { Button, Toast } from '@/components/common';

export function AddUserModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    cedula: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
  });
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  if (!isOpen) return null;

  const generatePassword = () => {
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const nums = '23456789';
    const chars = lower + upper + nums;
    let pwd = upper.charAt(Math.floor(Math.random() * upper.length));
    pwd += lower.charAt(Math.floor(Math.random() * lower.length));
    pwd += nums.charAt(Math.floor(Math.random() * nums.length));
    for (let i = 3; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    pwd = pwd.split('').sort(() => Math.random() - 0.5).join('');
    setFormData({ ...formData, password: pwd, confirmPassword: pwd });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{7,10}$/.test(formData.cedula)) {
      setToastMessage('Cedula: 7-10 dígitos numéricos');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.name)) {
      setToastMessage('Nombre: solo letras y espacios');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (formData.password.length < 8) {
      setToastMessage('Password: mínimo 8 caracteres');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setToastMessage('Password: mayúscula, minúscula y número');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setToastMessage('Contraseñas no coinciden');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setLoading(true);

    try {
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

      const { error } = await supabase.from('employees').insert([{
        name: formData.name,
        cedula: formData.cedula,
        password: formData.password,
        role: formData.role,
        blocked: false,
      }]);

      if (error) throw error;

      setToastMessage('Usuario creado exitosamente');
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({ name: '', cedula: '', password: '', confirmPassword: '', role: 'employee' });
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
          <div>
            <label className="block text-white mb-2">Contraseña</label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Min 8 chars, Aa1"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
                required
                minLength="8"
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
            <label className="block text-white mb-2">Confirmar Contraseña</label>
            <input
              type="password"
              placeholder="Repetir contraseña"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              required
              minLength="8"
            />
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
