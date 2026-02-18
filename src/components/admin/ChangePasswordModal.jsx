import { useState } from 'react';
import { supabase } from '@/config/supabase.config';
import { Button, Toast } from '@/components/common';

export function ChangePasswordModal({ isOpen, onClose, userId, userName }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    setNewPassword(pwd);
    setConfirmPassword(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setToastMessage('Password mínimo 8 caracteres');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setToastMessage('Password debe tener mayúscula, minúscula y número');
      setToastType('error');
      setShowToast(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setToastMessage('Contraseñas no coinciden');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('employees')
      .update({ password: newPassword })
      .eq('id', userId);

    if (error) {
      setToastMessage('Error: ' + error.message);
      setToastType('error');
    } else {
      setToastMessage('Contraseña actualizada');
      setToastType('success');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => onClose(), 1500);
    }

    setShowToast(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">
          Cambiar Contraseña — {userName}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2">Nueva Contraseña</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
                placeholder="Min 8 caracteres, Aa1"
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              placeholder="Repetir contraseña"
              required
              minLength="8"
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Cambiar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
