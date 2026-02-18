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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setToastMessage('Las contraseñas no coinciden');
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
      setToastMessage('Error al cambiar contraseña');
      setToastType('error');
    } else {
      setToastMessage('Contraseña actualizada exitosamente');
      setToastType('success');
      setTimeout(() => {
        onClose();
        setNewPassword('');
        setConfirmPassword('');
      }, 1500);
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
            <label className="block text-white mb-2">Nueva contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-white mb-2">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500"
              required
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
