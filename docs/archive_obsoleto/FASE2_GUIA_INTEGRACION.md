# 🚀 GUÍA DE INTEGRACIÓN - FASE 2

## Objetivo

Integrar los servicios de la FASE 1 con componentes React para crear la interfaz de usuario.

---

## 📋 Tabla de Contenidos

1. [Preparación del Entorno](#preparación-del-entorno)
2. [Context API](#context-api)
3. [Custom Hooks](#custom-hooks)
4. [Componentes React](#componentes-react)
5. [Ejemplos de Integración](#ejemplos-de-integración)

---

## 1. Preparación del Entorno

### Dependencias a Instalar

```bash
npm install @supabase/supabase-js
npm install react react-dom
npm install xlsx  # Para exportación Excel
```

### Estructura de Carpetas (FASE 2)

```
src/
├── config/                    # ✅ FASE 1
├── utils/                     # ✅ FASE 1
├── modules/                   # ✅ FASE 1
│   ├── auth/
│   │   ├── services/         # ✅ FASE 1
│   │   ├── components/       # 🆕 FASE 2
│   │   ├── hooks/            # 🆕 FASE 2
│   │   └── context/          # 🆕 FASE 2
│   ├── schedule/
│   │   ├── services/         # ✅ FASE 1
│   │   ├── components/       # 🆕 FASE 2
│   │   ├── hooks/            # 🆕 FASE 2
│   │   └── context/          # 🆕 FASE 2
│   └── reports/
│       ├── services/         # ✅ FASE 1
│       └── components/       # 🆕 FASE 2
└── App.jsx                   # 🆕 FASE 2
```

---

## 2. Context API

### AuthContext (Context de Autenticación)

```javascript
// src/modules/auth/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { login, logout, autoLogout } from '../services/auth.service';
import { TIME_CONFIG } from '../../../utils/constants.util';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inactivityTimer, setInactivityTimer] = useState(null);

  // Login
  const handleLogin = async (identifier) => {
    const result = await login(identifier);
    if (result.success) {
      setUser(result.user);
      startInactivityTimer();
    }
    return result;
  };

  // Logout
  const handleLogout = async () => {
    await logout(user);
    setUser(null);
    clearInactivityTimer();
  };

  // Timer de inactividad
  const startInactivityTimer = () => {
    clearInactivityTimer();
    const timer = setTimeout(async () => {
      await autoLogout(user);
      setUser(null);
    }, TIME_CONFIG.INACTIVITY_TIMEOUT);
    setInactivityTimer(timer);
  };

  const clearInactivityTimer = () => {
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      setInactivityTimer(null);
    }
  };

  const resetInactivityTimer = () => {
    if (user) {
      startInactivityTimer();
    }
  };

  // Eventos de actividad
  useEffect(() => {
    if (user) {
      window.addEventListener('mousemove', resetInactivityTimer);
      window.addEventListener('keypress', resetInactivityTimer);
      window.addEventListener('click', resetInactivityTimer);

      return () => {
        window.removeEventListener('mousemove', resetInactivityTimer);
        window.removeEventListener('keypress', resetInactivityTimer);
        window.removeEventListener('click', resetInactivityTimer);
      };
    }
  }, [user]);

  const value = {
    user,
    loading,
    login: handleLogin,
    logout: handleLogout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
```

### ScheduleContext (Context de Horarios)

```javascript
// src/modules/schedule/context/ScheduleContext.jsx

import React, { createContext, useState, useContext, useCallback } from 'react';
import {
  getAllEmployees,
  getAllTimeRecords,
  getActivityLogData
} from '../services';

const ScheduleContext = createContext();

export const ScheduleProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar empleados
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    const result = await getAllEmployees();
    if (result.success) {
      setEmployees(result.data);
    }
    setLoading(false);
    return result;
  }, []);

  // Cargar registros
  const loadRecords = useCallback(async () => {
    setLoading(true);
    const result = await getAllTimeRecords();
    if (result.success) {
      setRecords(result.data);
    }
    setLoading(false);
    return result;
  }, []);

  // Cargar log de actividad
  const loadActivityLog = useCallback(async (limit = 100) => {
    const result = await getActivityLogData(limit);
    if (result.success) {
      setActivityLog(result.data);
    }
    return result;
  }, []);

  // Recargar todos los datos
  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadEmployees(),
      loadRecords(),
      loadActivityLog()
    ]);
  }, [loadEmployees, loadRecords, loadActivityLog]);

  const value = {
    employees,
    records,
    activityLog,
    loading,
    loadEmployees,
    loadRecords,
    loadActivityLog,
    refreshAll
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule debe usarse dentro de ScheduleProvider');
  }
  return context;
};
```

---

## 3. Custom Hooks

### useRecords (Hook para Marcaciones)

```javascript
// src/modules/schedule/hooks/useRecords.js

import { useState } from 'react';
import { recordAttendance, getEmployeeRecentRecords } from '../services/records.service';

export const useRecords = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const markAttendance = async (employeeId, employeeName) => {
    setLoading(true);
    setError(null);

    const result = await recordAttendance(employeeId, employeeName);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  };

  const getRecentRecords = async (employeeId, days = 2) => {
    setLoading(true);
    setError(null);

    const result = await getEmployeeRecentRecords(employeeId, days);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
    return result;
  };

  return {
    markAttendance,
    getRecentRecords,
    loading,
    error
  };
};
```

### useEmployees (Hook para Gestión de Empleados)

```javascript
// src/modules/schedule/hooks/useEmployees.js

import { useState } from 'react';
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  blockEmployee
} from '../services/employees.service';
import { useAuth } from '../../auth/context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';

export const useEmployees = () => {
  const { user } = useAuth();
  const { loadEmployees } = useSchedule();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addEmployee = async (employeeData) => {
    setLoading(true);
    setError(null);

    const result = await createEmployee(employeeData, user);

    if (result.success) {
      await loadEmployees(); // Recargar lista
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  };

  const editEmployee = async (id, updates) => {
    setLoading(true);
    setError(null);

    const result = await updateEmployee(id, updates, user);

    if (result.success) {
      await loadEmployees();
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  };

  const removeEmployee = async (id) => {
    setLoading(true);
    setError(null);

    const result = await deleteEmployee(id, user);

    if (result.success) {
      await loadEmployees();
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  };

  const toggleBlock = async (id, blocked) => {
    setLoading(true);
    setError(null);

    const result = await blockEmployee(id, blocked, user);

    if (result.success) {
      await loadEmployees();
    } else {
      setError(result.error);
    }

    setLoading(false);
    return result;
  };

  return {
    addEmployee,
    editEmployee,
    removeEmployee,
    toggleBlock,
    loading,
    error
  };
};
```

---

## 4. Componentes React

### LoginScreen (Ejemplo)

```javascript
// src/modules/auth/components/LoginScreen.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(password);

    if (!result.success) {
      setError(result.error);
      setPassword('');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>SCHEDULE</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            maxLength="6"
            autoFocus
          />
          <button type="submit">Ingresar</button>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
```

### EmployeeInterface (Ejemplo)

```javascript
// src/modules/schedule/components/EmployeeInterface.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useRecords } from '../hooks/useRecords';
import { checkLastRecord } from '../../auth/services/auth.service';

const EmployeeInterface = () => {
  const { user, logout } = useAuth();
  const { markAttendance, getRecentRecords, loading } = useRecords();
  const [nextAction, setNextAction] = useState('ENTRADA');
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    // Verificar última marcación
    const checkLast = async () => {
      const result = await checkLastRecord(user.id);
      if (result.success) {
        setNextAction(result.nextAction);
      }
    };

    checkLast();
  }, [user.id]);

  const handleAction = async () => {
    const result = await markAttendance(user.id, user.name);

    if (result.success) {
      setNextAction(result.nextAction);

      // Mostrar últimos registros
      const recordsResult = await getRecentRecords(user.id);
      if (recordsResult.success) {
        setRecentRecords(recordsResult.data);
      }

      // Logout automático después de 10 segundos
      setTimeout(() => {
        logout();
      }, 10000);
    }
  };

  return (
    <div className="employee-interface">
      <h2>Hola, {user.name}</h2>

      <button
        onClick={handleAction}
        disabled={loading}
        className={`action-btn ${nextAction.toLowerCase()}`}
      >
        {loading ? 'Procesando...' : nextAction}
      </button>

      {recentRecords.length > 0 && (
        <div className="recent-records">
          <h3>Mis Registros Recientes</h3>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Horas</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.map((record, index) => (
                <tr key={index}>
                  <td>{record.fecha}</td>
                  <td>{record.entrada}</td>
                  <td>{record.salida}</td>
                  <td>{record.horas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={logout}>Cerrar Sesión</button>
    </div>
  );
};

export default EmployeeInterface;
```

---

## 5. App Principal

```javascript
// src/App.jsx

import React from 'react';
import { AuthProvider, useAuth } from './modules/auth/context/AuthContext';
import { ScheduleProvider } from './modules/schedule/context/ScheduleContext';
import LoginScreen from './modules/auth/components/LoginScreen';
import EmployeeInterface from './modules/schedule/components/EmployeeInterface';
import AdminInterface from './modules/schedule/components/AdminInterface';
import { ROLES } from './utils/constants.util';

const AppContent = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (user.role === ROLES.EMPLOYEE) {
    return <EmployeeInterface />;
  }

  if (user.role === ROLES.ADMIN || user.role === ROLES.MASTER) {
    return <AdminInterface />;
  }

  return null;
};

const App = () => {
  return (
    <AuthProvider>
      <ScheduleProvider>
        <AppContent />
      </ScheduleProvider>
    </AuthProvider>
  );
};

export default App;
```

---

## 6. Consejos de Integración

### ✅ DO's (Hacer)

1. **Usar Context API** para estado global
2. **Crear custom hooks** para lógica reutilizable
3. **Importar servicios directamente** cuando no necesites estado
4. **Manejar loading states** en la UI
5. **Mostrar errores** al usuario de forma clara
6. **Validar en frontend** antes de enviar a servicios

### ❌ DON'Ts (No Hacer)

1. **NO poner lógica de negocio** en componentes
2. **NO llamar a Supabase** directamente desde componentes
3. **NO duplicar validaciones** (ya están en services)
4. **NO ignorar errores** de los servicios
5. **NO hacer setState** durante render

---

## 7. Checklist de Migración

### Para cada componente del sistema actual:

- [ ] Identificar la lógica de negocio
- [ ] Buscar el servicio correspondiente en FASE 1
- [ ] Crear el componente React
- [ ] Usar hooks para llamar servicios
- [ ] Manejar estados de loading/error
- [ ] Implementar UI con Tailwind CSS
- [ ] Probar funcionalidad
- [ ] Verificar que no haya lógica duplicada

---

## 8. Ejemplo Completo: Agregar Empleado

```javascript
// Hook personalizado
const useAddEmployee = () => {
  const { addEmployee } = useEmployees();
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return { success: false, error: 'Las contraseñas no coinciden' };
    }

    const result = await addEmployee({
      name: formData.name,
      password: formData.password
    });

    if (result.success) {
      setFormData({ name: '', password: '', confirmPassword: '' });
    }

    return result;
  };

  return {
    formData,
    handleChange,
    handleSubmit
  };
};

// Componente
const AddEmployeeForm = () => {
  const { formData, handleChange, handleSubmit } = useAddEmployee();
  const [message, setMessage] = useState('');

  const onSubmit = async (e) => {
    const result = await handleSubmit(e);
    setMessage(result.success ? '✅ Empleado agregado' : `❌ ${result.error}`);
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Nombre"
      />
      <input
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Contraseña"
      />
      <input
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Confirmar"
      />
      <button type="submit">Agregar</button>
      {message && <div>{message}</div>}
    </form>
  );
};
```

---

## 9. Testing

### Unit Tests para Services

```javascript
// __tests__/auth.service.test.js

import { login } from '../src/modules/auth/services/auth.service';

describe('Auth Service', () => {
  test('Login con contraseña de maestro', async () => {
    const result = await login('111111');
    expect(result.success).toBe(true);
    expect(result.user.role).toBe('master');
  });

  test('Login con contraseña incorrecta', async () => {
    const result = await login('wrongpass');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

---

## 10. Deployment

### Variables de Entorno (.env)

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### Build para Producción

```bash
npm run build
```

---

**¡La FASE 1 está lista para integrarse con React!**

Todos los servicios están probados y documentados. Solo falta crear la UI.
