/**
 * PUNTO DE ENTRADA PRINCIPAL V3.0
 * 
 * Inicializa la aplicación React con StrictMode.
 * SIN datos hardcoded - TODO desde Supabase.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { SpeedInsights } from "@vercel/speed-insights/react"

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <SpeedInsights /> 
  </React.StrictMode>
);
