/**
 * VISTA EMPLEADO V3.0
 * 
 * Marcación de asistencia con validación en tiempo real.
 * RIGOR ABSOLUTO: Sin mocks, sin simulaciones, solo Supabase.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Toast } from '@/components/common';
import { checkLastRecord } from '@/modules/auth/services/auth.service';
import { recordAttendance, getTodayRecords } from '@/services/attendance/attendance.service';
import { RECORD_TYPES } from '@/utils/constants.util';

export function EmployeeView() {
  const { currentUser, handleLogout } = useAuth();
  
  // Estado
  const [nextAction, setNextAction] = useState(null); // 'ENTRADA' o 'SALIDA'
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [todayRecords, setTodayRecords] = useState([]);
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');

  // Cargar estado inicial al montar componente
  useEffect(() => {
    loadInitialState();
  }, [currentUser]);

  const loadInitialState = async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    
    try {
      // 1. Verificar última marcación (determina botón)
      const lastCheck = await checkLastRecord(currentUser.id);
      
      if (lastCheck.success) {
        setNextAction(lastCheck.nextAction);
      } else {
        setNextAction(RECORD_TYPES.ENTRADA); // Default seguro
      }

      // 2. Cargar registros del día
      const records = await getTodayRecords(currentUser.id);
      if (records.success) {
        setTodayRecords(records.data);
      }

    } catch (error) {
      setToastMessage('Error al cargar datos');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!nextAction || processing) return;

    setProcessing(true);

    try {
      const result = await recordAttendance(currentUser, nextAction);

      if (result.success) {
        // Éxito
        setToastMessage(result.message || `${nextAction} registrada`);
        setToastType('success');
        setShowToast(true);

        // Actualizar estado
        setNextAction(result.nextAction);
        
        // Recargar registros del día
        const records = await getTodayRecords(currentUser.id);
        if (records.success) {
          setTodayRecords(records.data);
        }

      } else {
        // Error
        setToastMessage(result.error || 'Error al registrar marcación');
        setToastType('error');
        setShowToast(true);

        // Si hay una acción esperada diferente, actualizar
        if (result.expectedAction) {
          setNextAction(result.expectedAction);
        }
      }

    } catch (error) {
      setToastMessage('Error al procesar marcación');
      setToastType('error');
      setShowToast(true);
    } finally {
      setProcessing(false);
    }
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

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              👋 Hola, {currentUser?.name}!
            </h1>
            <p className="text-slate-400 text-sm md:text-base">
              Empleado • Cédula: {currentUser?.cedula}
            </p>
          </div>
          <Button onClick={onLogout} variant="danger" className="text-sm md:text-base">
            Cerrar Sesión
          </Button>
        </div>

        {/* Botón de Marcación */}
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

            <p className="text-slate-400 text-sm mt-4">
              {nextAction === RECORD_TYPES.ENTRADA 
                ? 'Presiona para registrar tu entrada' 
                : 'Presiona para registrar tu salida'}
            </p>
          </div>
        </div>

        {/* Registros del día */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            📊 Registros de Hoy
          </h3>
          
          {todayRecords.length === 0 ? (
            <p className="text-slate-400 text-center py-4">
              No hay registros para hoy
            </p>
          ) : (
            <div className="space-y-3">
              {todayRecords.map((record) => (
                <div 
                  key={record.id} 
                  className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl ${
                      record.tipo === RECORD_TYPES.ENTRADA ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {record.tipo === RECORD_TYPES.ENTRADA ? '🟢' : '🔴'}
                    </span>
                    <div>
                      <p className="text-white font-medium">{record.tipo}</p>
                      <p className="text-slate-400 text-sm">{record.dia}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-mono">{record.hora}</p>
                    <p className="text-slate-400 text-sm">{record.fecha}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
