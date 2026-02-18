import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase.config';
import { Button, Toast } from '@/components/common';
import { ChangePasswordModal } from './ChangePasswordModal';

export function UsersListModal({ isOpen, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // CAMBIO 6: Estado para modal de cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (isOpen) loadUsers();
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const toggleBlock = async (userId, currentBlocked) => {
    const newBlocked = !currentBlocked;
    const { error } = await supabase
      .from('employees')
      .update({ blocked: newBlocked })
      .eq('id', userId);

    if (!error) {
      setToastMessage(newBlocked ? 'Usuario bloqueado' : 'Usuario desbloqueado');
      setShowToast(true);
      await loadUsers();
    } else {
      setToastMessage('Error: ' + error.message);
      setShowToast(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {showToast && (
        <Toast message={toastMessage} type="success" onClose={() => setShowToast(false)} />
      )}
      <div className="bg-slate-800 rounded-2xl p-8 max-w-4xl w-full border border-slate-700 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <p className="text-white text-center py-8">Cargando...</p>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-white font-semibold">Nombre</th>
                <th className="px-4 py-3 text-left text-white font-semibold">Cédula</th>
                <th className="px-4 py-3 text-left text-white font-semibold">Rol</th>
                <th className="px-4 py-3 text-left text-white font-semibold">Estado</th>
                {/* CAMBIO 6: Columna de acciones con botón cambiar contraseña */}
                <th className="px-4 py-3 text-left text-white font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-white">{user.name}</td>
                  <td className="px-4 py-3 text-slate-300">{user.cedula}</td>
                  <td className="px-4 py-3 text-slate-300 capitalize">{user.role}</td>
                  <td className="px-4 py-3">
                    {user.blocked
                      ? <span className="text-red-400 font-medium">Bloqueado</span>
                      : <span className="text-green-400 font-medium">Activo</span>
                    }
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      onClick={() => toggleBlock(user.id, user.blocked)}
                      variant={user.blocked ? 'primary' : 'danger'}
                      className="text-sm px-3 py-1"
                    >
                      {user.blocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                    <Button
                      onClick={() => { setSelectedUser(user); setShowChangePassword(true); }}
                      variant="secondary"
                      className="text-sm px-3 py-1"
                    >
                      Cambiar Pass
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CAMBIO 6: Modal de cambio de contraseña */}
      {selectedUser && (
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => { setShowChangePassword(false); setSelectedUser(null); }}
          userId={selectedUser.id}
          userName={selectedUser.name}
        />
      )}
    </div>
  );
}
