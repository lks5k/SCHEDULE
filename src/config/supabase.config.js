/**
 * CONFIGURACIÓN DE SUPABASE
 * 
 * Cliente de Supabase inicializado con variables de entorno.
 * Valida que las credenciales estén disponibles antes de crear el cliente.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  console.error('Verifica que el archivo .env tenga VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  throw new Error('Faltan las variables VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY');
}

// Cliente de Supabase configurado con anon_key de .env
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verificar conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Conexión a Supabase establecida correctamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al conectar con Supabase:', error.message);
    return { success: false, error: error.message };
  }
};

export default supabase;
