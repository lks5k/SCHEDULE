/**
 * VISTA ADMINISTRADOR/MAESTRO V3.0
 * 
 * Dashboard en tiempo real con marcaciones de todos los empleados.
 * RIGOR ABSOLUTO: Sin mocks, Supabase Realtime funcional.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Toast } from '@/components/common';
import { getAllRecordsRealtime, subscribeToRecords } from '@/services/attendance/attendance.service';
import { RECORD_TYPES } from '@/utils/constants.util';

export function AdminView() {
  const { currentUser, handleLogout } = useAuth();
  
  // Estado
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'ENTRADA', 'SALIDA'
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // Cargar registros al montar
  useEffect(() => {
    loadRecords();
    
    // Suscripción a cambios en tiempo real
    const subscription = subscribeToRecords((newRecord) => {
      // Agregar nuevo registro al inicio
      setRecords(prev => [newRecord, ...prev]);
      
      // Mostrar notificación
      setToastMessage(`Nueva marcación: ${newRecord.employee_name} - ${newRecord.tipo}`);
      setToastType('info');
      setShowToast(true);
    });

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const onLogout = async () => {
    await handleLogout();
  };

  // Filtrar registros
  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true;
    if (filter === 'today') {
      const today = new Date().toLocaleDateString('es-CO');
      const recordDate = new Date(record.timestamp).toLocaleDateString('es-CO');
      return today === recordDate;
    }
    return record.tipo === filter;
  });

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
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setShowToast(false)} 
        />
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
          <Button onClick={onLogout} variant="danger" className="text-sm md:text-base">
            Cerrar Sesión
          </Button>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-700">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Todos ({records.length})
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'today' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilter(RECORD_TYPES.ENTRADA)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === RECORD_TYPES.ENTRADA 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🟢 Entradas
            </button>
            <button
              onClick={() => setFilter(RECORD_TYPES.SALIDA)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === RECORD_TYPES.SALIDA 
                  ? 'bg-red-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              🔴 Salidas
            </button>
            <button
              onClick={loadRecords}
              className="ml-auto px-4 py-2 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Tabla de Registros */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                    Empleado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                    Hora
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">
                    Día
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                      No hay registros para mostrar
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3 text-white">
                        {record.employee_name}
                      </td>
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
                      <td className="px-4 py-3 text-slate-300 font-mono text-sm">
                        {record.fecha}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-mono text-sm font-semibold">
                        {record.hora}
                      </td>
                      <td className="px-4 py-3 text-slate-400 capitalize text-sm">
                        {record.dia}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Total Registros</p>
            <p className="text-3xl font-bold text-white">{records.length}</p>
          </div>
          <div className="bg-green-600/10 rounded-xl p-4 border border-green-600/30">
            <p className="text-green-400 text-sm mb-1">Entradas</p>
            <p className="text-3xl font-bold text-green-400">
              {records.filter(r => r.tipo === RECORD_TYPES.ENTRADA).length}
            </p>
          </div>
          <div className="bg-red-600/10 rounded-xl p-4 border border-red-600/30">
            <p className="text-red-400 text-sm mb-1">Salidas</p>
            <p className="text-3xl font-bold text-red-400">
              {records.filter(r => r.tipo === RECORD_TYPES.SALIDA).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
