/**
 * VISTA ADMINISTRADOR/MAESTRO V4.0
 *
 * Dashboard con gestión de usuarios, filtros con contadores,
 * observaciones inline y sin límite de pares de asistencia.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Toast } from '@/components/common';
import { EditableTimeCell } from '@/components/common/EditableTimeCell';
import { ConfigView } from './ConfigView';
import { AddUserModal } from './AddUserModal';
import { UsersListModal } from './UsersListModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { getAllRecordsRealtime, subscribeToRecords } from '@/services/attendance/attendance.service';
import { getAllEmployeePairs, updateTiempoAlmuerzo } from '@/services/attendance/pairs.service';
import { supabase } from '@/config/supabase.config';
import { RECORD_TYPES } from '@/utils/constants.util';
import { logger } from '@/utils/logger.util';

export function AdminView() {
  const { currentUser, handleLogout } = useAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [viewMode, setViewMode] = useState('table');
  const [allPairs, setAllPairs] = useState([]);

  // Observaciones inline en tabla Tiempo Real
  const [editingObs, setEditingObs] = useState(null);
  const [obsValue, setObsValue] = useState('');

  // Modales gestión de usuarios
  const [showAddUser, setShowAddUser] = useState(false);
  const [showUsersList, setShowUsersList] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // --- Computed ---

  const recordsFiltrados = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    switch (filtro) {
      case 'hoy':      return records.filter(r => r.timestamp?.startsWith(hoy));
      case 'entradas': return records.filter(r => r.tipo === 'ENTRADA');
      case 'salidas':  return records.filter(r => r.tipo === 'SALIDA');
      default:         return records;
    }
  }, [records, filtro]);

  const contadores = useMemo(() => ({
    total:   records.length,
    entradas: records.filter(r => r.tipo === 'ENTRADA').length,
    salidas:  records.filter(r => r.tipo === 'SALIDA').length,
  }), [records]);

  // --- Data loading ---

  const loadData = useCallback(async () => {
    await Promise.all([loadRecords(), loadAllPairs()]);
  }, []);

  useEffect(() => {
    loadData();

    const subscription = subscribeToRecords((newRecord) => {
      setRecords(prev => [newRecord, ...prev]);
      loadAllPairs();
      setToastMessage(`Nueva marcación: ${newRecord.employee_name} - ${newRecord.tipo}`);
      setToastType('info');
      setShowToast(true);
    });

    return () => { subscription.unsubscribe(); };
  }, [loadData]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const result = await getAllRecordsRealtime();
      if (result.success) {
        setRecords(result.data);
      } else {
        setToastMessage('Error al cargar registros');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Error al cargar registros');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPairs = async () => {
    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name')
        .is('deleted_at', null);

      if (!employees) return;

      const allPairsData = [];

      for (const employee of employees) {
        const result = await getAllEmployeePairs(employee.id);
        if (result.success && result.pairs) {
          const pairsWithName = result.pairs.map(pair => ({
            ...pair,
            employee_name: employee.name,
          }));
          allPairsData.push(...pairsWithName);
        }
      }

      allPairsData.sort((a, b) => {
        const tsA = a.entrada?.timestamp || '';
        const tsB = b.entrada?.timestamp || '';
        return tsB.localeCompare(tsA);
      });

      setAllPairs(allPairsData);
    } catch (error) {
      logger.error('Error cargando parejas:', error);
    }
  };

  const handleSaveAlmuerzo = async (entradaId, newValue) => {
    try {
      const result = await updateTiempoAlmuerzo(entradaId, newValue);
      if (result.success) {
        setToastMessage('Actualizado');
        setToastType('success');
        setShowToast(true);
        await loadAllPairs();
      } else {
        setToastMessage(result.error);
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Error');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleSaveObs = async (recordId) => {
    const { error } = await supabase
      .from('time_records')
      .update({ observaciones: obsValue })
      .eq('id', recordId);

    if (!error) {
      setToastMessage('Observación guardada');
      setToastType('success');
      setShowToast(true);
      setEditingObs(null);
      loadRecords();
    }
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8">
      {showToast && (
        <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              👋 Hola, {currentUser?.name}!
            </h1>
            <p className="text-slate-400 text-sm md:text-base">
              Rol: <span className="capitalize">{currentUser?.role}</span>
            </p>
          </div>
          <Button onClick={handleLogout} variant="danger" className="text-sm md:text-base">
            Cerrar Sesión
          </Button>
        </div>

        {/* Tabs de Vista */}
        <div className="bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-700">
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              📊 Vista Parejas
            </button>
            <button
              onClick={() => setViewMode('realtime')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'realtime'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ⚡ Tiempo Real
            </button>
            <button
              onClick={() => setViewMode('config')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'config'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={() => { loadRecords(); loadAllPairs(); }}
              className="ml-auto px-4 py-2 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Contenido según tab */}
        {viewMode === 'config' ? (
          <>
            <div className="flex gap-4 mb-6">
              <Button onClick={() => setShowAddUser(true)}>Agregar Usuario</Button>
              <Button onClick={() => setShowUsersList(true)}>Gestionar Usuarios</Button>
            </div>
            <ConfigView />
          </>
        ) : viewMode === 'table' ? (

          /* ── VISTA PAREJAS ─────────────────────────────────────────── */
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">
                📊 Registros de Asistencia (Parejas)
              </h3>
            </div>

            {/* Barra de contadores Vista Parejas */}
            <div className="flex justify-between items-center py-4 px-6 bg-slate-700 border-y border-slate-600">
              <div className="text-slate-300 text-sm">
                Total:&nbsp;<span className="font-bold text-white">{allPairs.length}</span>
                &nbsp;|&nbsp;
                Completas:&nbsp;<span className="font-bold text-green-400">
                  {allPairs.filter(p => p.entrada && p.salida).length}
                </span>
                &nbsp;|&nbsp;
                Incompletas:&nbsp;<span className="font-bold text-yellow-400">
                  {allPairs.filter(p => !p.entrada || !p.salida).length}
                </span>
              </div>
              <div className="text-white font-semibold">Mostrando: {allPairs.length}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Empleado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Dia</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Hora Entrada</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Hora Salida</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">T. Almuerzo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Lic. Remun.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Total Horas</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Total Decimal</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {allPairs.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-4 py-8 text-center text-slate-400">
                        No hay registros
                      </td>
                    </tr>
                  ) : (
                    allPairs.map((pair, index) => {
                      const fechaParts = pair.fecha.split('/');
                      const fechaISO = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;

                      return (
                        <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                          <td className="px-4 py-3 text-white font-medium text-sm">{pair.employee_name}</td>
                          <td className="px-4 py-3 text-white font-mono text-sm">{fechaISO}</td>
                          <td className="px-4 py-3 text-slate-300 capitalize text-sm">{pair.dia}</td>
                          <td className="px-4 py-3 text-green-400 font-mono font-semibold text-sm">
                            {pair.entrada?.hora?.substring(0, 5) || '—'}
                          </td>
                          <td className="px-4 py-3 text-red-400 font-mono font-semibold text-sm">
                            {pair.salida?.hora?.substring(0, 5) || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-300 font-mono text-sm">
                            <EditableTimeCell
                              pair={pair}
                              onSave={handleSaveAlmuerzo}
                              onError={(msg) => {
                                setToastMessage(msg);
                                setToastType('error');
                                setShowToast(true);
                              }}
                              disabled={true}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {pair.licencia_remunerada
                              ? <span className="text-blue-400">Si</span>
                              : <span className="text-slate-600">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-white font-mono font-semibold text-sm">
                            {pair.total_horas || '—'}
                          </td>
                          <td className="px-4 py-3 text-blue-400 font-mono font-semibold text-sm">
                            {pair.total_horas_decimal ? pair.total_horas_decimal.toFixed(2) : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-sm max-w-xs truncate">
                            {pair.observaciones || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        ) : (

          /* ── VISTA TIEMPO REAL ─────────────────────────────────────── */
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">

            {/* Barra de filtros con contadores */}
            <div className="flex justify-between items-center py-4 px-6 bg-slate-700 border-y border-slate-600">
              <div className="flex gap-4">
                <button
                  onClick={() => setFiltro('todos')}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    filtro === 'todos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Todos ({contadores.total})
                </button>
                <button
                  onClick={() => setFiltro('hoy')}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    filtro === 'hoy'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setFiltro('entradas')}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    filtro === 'entradas'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Entradas ({contadores.entradas})
                </button>
                <button
                  onClick={() => setFiltro('salidas')}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    filtro === 'salidas'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  Salidas ({contadores.salidas})
                </button>
              </div>
              <div className="text-white font-semibold">Mostrando: {recordsFiltrados.length}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Empleado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Hora</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Día</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {recordsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                        No hay registros para mostrar
                      </td>
                    </tr>
                  ) : (
                    recordsFiltrados.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3 text-white">{record.employee_name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                            record.tipo === RECORD_TYPES.ENTRADA
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-red-600/20 text-red-400'
                          }`}>
                            {record.tipo === RECORD_TYPES.ENTRADA ? '🟢' : '🔴'}
                            {record.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white font-mono text-sm">
                          {(() => {
                            const parts = record.fecha.split('/');
                            return parts.length === 3
                              ? `${parts[2]}/${parts[1]}/${parts[0]}`
                              : record.fecha;
                          })()}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-sm font-semibold">
                          {record.hora?.substring(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-slate-400 capitalize text-sm">{record.dia}</td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {editingObs === record.id ? (
                            <input
                              type="text"
                              value={obsValue}
                              onChange={(e) => setObsValue(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveObs(record.id)}
                              onBlur={() => setEditingObs(null)}
                              className="bg-slate-700 text-white px-2 py-1 rounded text-sm w-full focus:outline-none"
                              autoFocus
                            />
                          ) : (
                            <span
                              onClick={() => { setEditingObs(record.id); setObsValue(record.observaciones || ''); }}
                              className="cursor-pointer hover:text-blue-400 transition-colors"
                            >
                              {record.observaciones || 'Agregar...'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modales gestión de usuarios */}
        <AddUserModal
          isOpen={showAddUser}
          onClose={() => setShowAddUser(false)}
          onSuccess={loadRecords}
        />
        <UsersListModal
          isOpen={showUsersList}
          onClose={() => setShowUsersList(false)}
        />
        {selectedUser && (
          <ChangePasswordModal
            isOpen={showChangePassword}
            onClose={() => { setShowChangePassword(false); setSelectedUser(null); }}
            userId={selectedUser.id}
            userName={selectedUser.name}
          />
        )}
      </div>
    </div>
  );
}
