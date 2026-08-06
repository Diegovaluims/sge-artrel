// src/config.js
// Ponto único de configuração da API.
// Altere POSTGREST_URL se a porta ou host do PostgREST mudar.
export const POSTGREST_URL = import.meta.env.VITE_POSTGREST_URL || 'http://localhost:3000';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function apiHeaders(extra = {}) {
  return {
    Accept: 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}