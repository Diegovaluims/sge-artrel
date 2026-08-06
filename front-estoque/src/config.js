// src/config.js
// Ponto único de configuração da API.
// Altere POSTGREST_URL se a porta ou host do PostgREST mudar.
export const POSTGREST_URL = import.meta.env.VITE_POSTGREST_URL || 'http://localhost:3000';
