// src/config.js
// Ponto único de configuração da API.
export const POSTGREST_URL = import.meta.env.VITE_POSTGREST_URL ?? 'http://localhost:3000';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Monta os headers padrão para todas as chamadas à API.
 * - Em produção (Supabase): injeta apikey + Authorization com a anon key.
 * - Em dev local (PostgREST): lê o JWT de localStorage['sge_token'].
 *   Gere o token com: node scripts/gerar_jwt_local.js
 */
export function apiHeaders(extra = {}) {
  const token = localStorage.getItem('sge_token') || SUPABASE_ANON_KEY || '';
  return {
    'Content-Type': 'application/json',
    ...(SUPABASE_ANON_KEY ? { 'apikey': SUPABASE_ANON_KEY } : {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra,
  };
}
