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
import { getEmployeePairs } from '@/services/attendance/pairs.service';
import { supabase } from '@/config/supabase.config';
import { RECORD_TYPES } from '@/utils/constants.util';

export function AdminView() {
  const { currentUser, handleLogout } = useAuth();
  
  // Estado
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'ENTRADA', 'SALIDA'
  const [viewMode, setViewMode] = useState('table'); // 'table' o 'realtime'
  const [allPairs, setAllPairs] = useState([]);
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // Cargar registros al montar
  useEffect(() => {
    loadRecords();
    loadAllPairs();
    
    // Suscripción a cambios en tiempo real
    const subscription = subscribeToRecords((newRecord) => {
      // Agregar nuevo registro al inicio
      setRecords(prev => [newRecord, ...prev]);
      
      // Recargar pares cuando hay nuevo registro
      loadAllPairs();
      
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

  const loadAllPairs = async () => {
    try {
      const { data: employees } = await supabase
        .from('employees')
        .select('id, name')
        .is('deleted_at', null);

      if (!employees) return;

      const allPairsData = [];
      
      for (const employee of employees) {
        const result = await getEmployeePairs(employee.id);
        if (result.success && result.pairs) {
          const pairsWithName = result.pairs.map(pair => ({
            ...pair,
            employee_name: employee.name
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
      console.error('Error cargando parejas:', error);
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

        {/* Tabs de Vista */}
        <div className="bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-700">
          <div className="flex gap-4">
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
              onClick={() => {
                loadRecords();
                loadAllPairs();
              }}
              className="ml-auto px-4 py-2 rounded-lg font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Filtros (solo para vista Tiempo Real) */}
        {viewMode === 'realtime' && (
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
            </div>
          </div>
        )}

        {/* Contenido condicional */}
        {viewMode === 'table' ? (
          /* TABLA DE PAREJAS */
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">
                📊 Registros de Asistencia (Parejas)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Empleado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Día</th>
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
                        No hay registros para mostrar
                      </td>
                    </tr>
                  ) : (
                    allPairs.map((pair) => (
                      <tr key={pair.entrada?.id || `salida-${pair.salida?.id}-${pair.employee_name}`} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3 text-white font-medium text-sm">
                          {pair.employee_name}
                        </td>
                        <td className="px-4 py-3 text-white font-mono text-sm">
                          {pair.fecha}
                        </td>
                        <td className="px-4 py-3 text-slate-300 capitalize text-sm">
                          {pair.dia}
                        </td>
                        <td className="px-4 py-3 text-green-400 font-mono font-semibold text-sm">
                          {pair.entrada ? pair.entrada.hora : '—'}
                        </td>
                        <td className="px-4 py-3 text-red-400 font-mono font-semibold text-sm">
                          {pair.salida ? pair.salida.hora : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-sm">
                          {pair.tiempo_almuerzo}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pair.licencia_remunerada ? (
                            <span className="text-blue-400">Si</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* TABLA DE REGISTROS TIEMPO REAL */
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
        )}

        {/* Stats */}
        {viewMode === 'realtime' ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <p className="text-slate-400 text-sm mb-1">Total Pares</p>
              <p className="text-3xl font-bold text-white">{allPairs.length}</p>
            </div>
            <div className="bg-blue-600/10 rounded-xl p-4 border border-blue-600/30">
              <p className="text-blue-400 text-sm mb-1">Pares Completos</p>
              <p className="text-3xl font-bold text-blue-400">
                {allPairs.filter(p => p.entrada && p.salida).length}
              </p>
            </div>
            <div className="bg-yellow-600/10 rounded-xl p-4 border border-yellow-600/30">
              <p className="text-yellow-400 text-sm mb-1">Pares Incompletos</p>
              <p className="text-3xl font-bold text-yellow-400">
                {allPairs.filter(p => !p.entrada || !p.salida).length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
