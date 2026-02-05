/**
 * APP PRINCIPAL V3.0
 * 
 * Configuración de React Router con rutas protegidas.
 * Gestión de autenticación y redirecciones según protocolo de rigor.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LoginScreen } from '@/components/auth';
import { AdminView } from '@/components/admin';
import { EmployeeView } from '@/components/employee';
import { ROLES } from '@/utils/constants.util';

// Componente de ruta protegida
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-white text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    // Redireccionar a la ruta correcta según el rol
    if (currentUser?.role === ROLES.EMPLOYEE) {
      return <Navigate to="/employee" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated, currentUser } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            currentUser?.role === ROLES.EMPLOYEE ? 
              <Navigate to="/employee" replace /> : 
              <Navigate to="/admin" replace />
          ) : (
            <LoginScreen />
          )
        } 
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.MASTER]}>
            <AdminView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
            <EmployeeView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      {/* Ruta catch-all para 404 */}
      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
