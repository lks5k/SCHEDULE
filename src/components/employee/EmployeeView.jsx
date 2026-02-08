/**
 * VISTA EMPLEADO V4.0 - FASE 4
 * 
 * Implementa parejas ENTRADA/SALIDA con cálculos automáticos.
 * RIGOR ABSOLUTO: Sin mocks, sin simulaciones, solo Supabase.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Toast } from '@/components/common';
import { checkLastRecord } from '@/modules/auth/services/auth.service';
import { recordAttendance } from '@/services/attendance/attendance.service';
import { getEmployeePairs, updateTiempoAlmuerzo } from '@/services/attendance/pairs.service';
import { RECORD_TYPES } from '@/utils/constants.util';

export function EmployeeView() {
  const { currentUser, handleLogout } = useAuth();
  
  const [nextAction, setNextAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pairs, setPairs] = useState([]);
  
  const [editingAlmuerzoId, setEditingAlmuerzoId] = useState(null);
  const [almuerzoValue, setAlmuerzoValue] = useState('');
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  useEffect(() => {
    loadInitialState();
  }, [currentUser]);

  // Sistema de detección de inactividad
  useEffect(() => {
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Logout automático después de 10 segundos de inactividad
        handleLogout();
      }, 10000); // 10 segundos
    };

    // Detectar actividad del usuario
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    // Iniciar timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [handleLogout]);

  const loadInitialState = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    
    try {
      const lastCheck = await checkLastRecord(currentUser.id);
      
      if (lastCheck.success) {
        setNextAction(lastCheck.nextAction);
      } else {
        setNextAction(RECORD_TYPES.ENTRADA);
      }

      await loadPairs();

    } catch (error) {
      console.error('Error cargando estado:', error);
      setToastMessage('Error al cargar datos');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const loadPairs = async () => {
    const result = await getEmployeePairs(currentUser.id);
    if (result.success) {
      setPairs(result.pairs);
    }
  };

  const handleMarkAttendance = async () => {
    if (!nextAction || processing) return;

    setProcessing(true);

    try {
      const result = await recordAttendance(currentUser, nextAction);

      if (result.success) {
        setToastMessage(result.message || `${nextAction} registrada`);
        setToastType('success');
        setShowToast(true);

        setNextAction(result.nextAction);
        
        await loadPairs();

      } else {
        setToastMessage(result.error || 'Error al registrar marcación');
        setToastType('error');
        setShowToast(true);

        if (result.expectedAction) {
          setNextAction(result.expectedAction);
        }
      }

    } catch (error) {
      console.error('Error marcando asistencia:', error);
      setToastMessage('Error al procesar marcación');
      setToastType('error');
      setShowToast(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleEditAlmuerzo = (pair) => {
    if (pair.tiempo_almuerzo_editado) {
      setToastMessage('El tiempo de almuerzo ya fue editado');
      setToastType('warning');
      setShowToast(true);
      return;
    }

    if (!pair.entrada) {
      setToastMessage('No hay registro de entrada para editar');
      setToastType('warning');
      setShowToast(true);
      return;
    }

    setEditingAlmuerzoId(pair.entrada.id);
    setAlmuerzoValue(pair.tiempo_almuerzo);
  };

  const handleSaveAlmuerzo = async (entradaId) => {
    if (!almuerzoValue || !entradaId) return;

    try {
      const result = await updateTiempoAlmuerzo(entradaId, almuerzoValue);

      if (result.success) {
        setToastMessage('Tiempo actualizado');
        setToastType('success');
        setShowToast(true);
        setEditingAlmuerzoId(null);
        await loadPairs();
      } else {
        setToastMessage(result.error);
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Error al actualizar');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleCancelEdit = () => {
    setEditingAlmuerzoId(null);
    setAlmuerzoValue('');
  };

  const onLogout = async () => {
    await handleLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xl">Cargando...</p>
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

      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              👋 Hola, {currentUser?.name}!
            </h1>
            <p className="text-slate-400 text-sm md:text-base">
              Colaborador • Cédula: {currentUser?.cedula}
            </p>
          </div>
          <Button onClick={onLogout} variant="danger" className="text-sm md:text-base">
            Cerrar Sesión
          </Button>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 mb-6 border border-slate-700">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-6">
              Marcación de Asistencia
            </h2>
            
            <Button
              onClick={handleMarkAttendance}
              variant={nextAction === RECORD_TYPES.ENTRADA ? 'success' : 'danger'}
              loading={processing}
              disabled={processing || !nextAction}
              className="w-full text-lg py-4"
            >
              {nextAction === RECORD_TYPES.ENTRADA ? '🟢 Marcar ENTRADA' : '🔴 Marcar SALIDA'}
            </Button>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">
              📊 Últimos 10 Registros de Asistencia
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700">
                <tr>
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
                {pairs.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                      No hay registros para mostrar
                    </td>
                  </tr>
                ) : (
                  pairs.map((pair) => (
                    <tr key={pair.entrada?.id || `salida-${pair.salida?.id}`} className="hover:bg-slate-700/50 transition-colors">
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
                        {editingAlmuerzoId === pair.entrada?.id ? (
                          <input
                            type="time"
                            value={almuerzoValue}
                            onChange={(e) => setAlmuerzoValue(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveAlmuerzo(pair.entrada.id);
                              }
                            }}
                            onBlur={() => handleCancelEdit()}
                            className={`px-2 py-1 rounded text-sm w-20 ${
                              pair.tiempo_almuerzo_editado 
                                ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                                : 'bg-slate-700 text-white'
                            }`}
                            min="00:00"
                            max="02:00"
                            step="60"
                            readOnly={pair.tiempo_almuerzo_editado}
                            autoFocus
                          />
                        ) : (
                          <span
                            onClick={() => !pair.tiempo_almuerzo_editado && handleEditAlmuerzo(pair)}
                            className={pair.tiempo_almuerzo_editado ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-blue-400'}
                          >
                            {pair.tiempo_almuerzo}
                          </span>
                        )}
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
      </div>
    </div>
  );
}
