/**
 * VISTA EMPLEADO V4.0 - FASE 4
 * 
 * Implementa parejas ENTRADA/SALIDA con cálculos automáticos.
 * RIGOR ABSOLUTO: Sin mocks, sin simulaciones, solo Supabase.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Toast } from '@/components/common';
import { EditableTimeCell } from '@/components/common/EditableTimeCell';
import { checkLastRecord } from '@/modules/auth/services/auth.service';
import { recordAttendance } from '@/services/attendance/attendance.service';
import { getEmployeePairs, updateTiempoAlmuerzo } from '@/services/attendance/pairs.service';
import { RECORD_TYPES } from '@/utils/constants.util';
import { logger } from '@/utils/logger.util';

export function EmployeeView() {
  const { currentUser, handleLogout } = useAuth();
  
  const [nextAction, setNextAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pairs, setPairs] = useState([]);
  
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  const loadInitialState = useCallback(async () => {
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
      setToastMessage('Error al cargar datos');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

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
      logger.error('Error marcando asistencia:', error);
      setToastMessage('Error al procesar marcación');
      setToastType('error');
      setShowToast(true);
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveAlmuerzo = async (entradaId, newValue) => {
    try {
      setPairs(prevPairs =>
        prevPairs.map(pair =>
          pair.entrada?.id === entradaId
            ? {
                ...pair,
                tiempo_almuerzo: newValue,
                tiempo_almuerzo_editado: true
              }
            : pair
        )
      );

      const result = await updateTiempoAlmuerzo(entradaId, newValue);

      if (result.success) {
        setToastMessage('Actualizado');
        setToastType('success');
        setShowToast(true);
        await loadPairs();
      } else {
        setToastMessage(result.error);
        setToastType('error');
        setShowToast(true);
        await loadPairs();
      }
    } catch (error) {
      setToastMessage('Error');
      setToastType('error');
      setShowToast(true);
      await loadPairs();
    }
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
          <Button onClick={handleLogout} variant="danger" className="text-sm md:text-base">
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Dia</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Hora Entrada</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Hora Salida</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">T. Almuerzo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Lic. Remun.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Total Horas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Total Decimal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {pairs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  pairs.map((pair, index) => {
                    const fechaParts = pair.fecha.split('/');
                    const fechaISO = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;
                    
                    return (
                      <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-sm">
                          {fechaISO}
                        </td>
                        <td className="px-4 py-3 text-slate-300 capitalize text-sm">
                          {pair.dia}
                        </td>
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
                          />
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
