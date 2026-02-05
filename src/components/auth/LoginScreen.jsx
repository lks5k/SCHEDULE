/**
 * PANTALLA DE LOGIN V3.0
 * 
 * Autenticación con cédula y contraseña.
 * Consulta directa a Supabase (SIN datos hardcoded).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Input, Button, Toast } from '@/components/common';
import { validatePassword } from '@/utils/validation.util';
import { ROLES } from '@/utils/constants.util';

export function LoginScreen() {
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const { handleLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de campos vacíos
    if (!cedula.trim()) {
      setToastMessage('Ingrese su cédula');
      setToastType('error');
      setShowToast(true);
      return;
    }
    
    if (!password.trim()) {
      setToastMessage('Ingrese su contraseña');
      setToastType('error');
      setShowToast(true);
      return;
    }
    
    // Validar contraseña con servicio REAL
    const validation = validatePassword(password);
    if (!validation.valid) {
      setToastMessage(validation.error);
      setToastType('error');
      setShowToast(true);
      return;
    }
    
    // Login REAL (llama a AuthContext que llama a auth.service.js)
    const result = await handleLogin(cedula, password);
    
    if (result.success) {
      setToastMessage('Inicio de sesión exitoso');
      setToastType('success');
      setShowToast(true);
      
      // Redirigir según rol REAL del usuario
      setTimeout(() => {
        if (result.user.role === ROLES.MASTER || result.user.role === ROLES.ADMIN) {
          navigate('/admin');
        } else if (result.user.role === ROLES.EMPLOYEE) {
          navigate('/employee');
        }
      }, 1000);
    } else {
      setToastMessage(result.error || 'Error al iniciar sesión');
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setShowToast(false)} 
        />
      )}
      
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              📊 SCHEDULE
            </h1>
            <p className="text-slate-400">
              Sistema de Control de Horarios
            </p>
          </div>
          
          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cédula
              </label>
              <Input
                type="text"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ej: 10101010"
                autoFocus
                disabled={loading}
                maxLength={20}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                disabled={loading}
                maxLength={20}
              />
            </div>
            
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
              className="w-full"
            >
              Iniciar Sesión
            </Button>
          </form>
          
          {/* Info de prueba (SOLO para desarrollo) */}
          <div className="mt-6 p-4 bg-slate-700 rounded-lg">
            <p className="text-xs text-slate-400 text-center mb-2">
              👨‍💼 Usuario de Prueba:
            </p>
            <p className="text-xs text-slate-300 text-center">
              Cédula: <span className="font-mono">10101010</span>
            </p>
            <p className="text-xs text-slate-300 text-center">
              Contraseña: <span className="font-mono">Lukas2026</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
