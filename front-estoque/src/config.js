// src/config.js
// Ponto único de configuração da API.
// Altere POSTGREST_URL se a porta ou host do PostgREST mudar.
export const POSTGREST_URL = import.meta.env.VITE_POSTGREST_URL || 'http://localhost:3000';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function apiHeaders(extra = {}) {
  const headers = { Accept: 'application/json', ...extra };

  // Injeta autenticação apenas quando a chave existe (Supabase).
  // Dev local (PostgREST sem jwt-secret) não recebe Bearer vazio — evita HTTP 400.
  if (SUPABASE_ANON_KEY) {
    headers.apikey = SUPABASE_ANON_KEY;
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  return headers;
}
