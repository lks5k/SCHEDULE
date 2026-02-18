/**
 * Wrapper para consultas Supabase con try-catch y logging unificado.
 */

import { logger } from './logger.util.js';

export const withSupabaseQuery = async (queryFn, fallbackValue = null) => {
  try {
    const result = await queryFn();
    if (result.error) {
      logger.error('Supabase query error:', result.error);
      return { success: false, error: result.error.message, data: fallbackValue };
    }
    return { success: true, data: result.data, error: null };
  } catch (error) {
    logger.error('Supabase query exception:', error);
    return { success: false, error: error.message, data: fallbackValue };
  }
};
