// AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { POSTGREST_URL } from '../config.js';

const AuthContext = createContext(null);

// =============================================================================
// Helpers de JWT local (dev offline) — Web Crypto API nativa, zero dependências.
// Utilizado apenas em modo de desenvolvimento (import.meta.env.DEV).
// =============================================================================
function _b64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function _assinarJwtLocal(payload) {
  // O segredo é lido das variáveis de ambiente de dev ou usa o segredo padrão local do postgrest.conf
  const devSecret = import.meta.env.VITE_DEV_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(devSecret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const header = _b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = _b64url(JSON.stringify(payload));
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${header}.${body}.${sigB64}`;
}

async function _loginLocal(email, password) {
  // 1. Valida credenciais na tabela auth_dev.dev_users via RPC PostgREST (schema auth_dev)
  const res = await fetch(`${POSTGREST_URL}/rpc/login_local`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Profile': 'auth_dev',
    },
    body: JSON.stringify({ p_email: email, p_senha: password }),
  });
  if (!res.ok) throw new Error('Serviço de autenticação local indisponível.');
  const dados = await res.json();
  const resultado = Array.isArray(dados) ? dados[0] : dados;
  if (!resultado?.ok) throw new Error('E-mail ou senha incorretos.');

  // 2. Gera JWT localmente com Web Crypto — compatível com a validação do PostgREST local
  const now = Math.floor(Date.now() / 1000);
  const token = await _assinarJwtLocal({
    role: 'authenticated',
    email: resultado.user_email,
    user_metadata: { role: resultado.user_role },
    sub: crypto.randomUUID(),
    iat: now,
    exp: now + 60 * 60 * 24 * 30, // 30 dias de validade offline
  });
  return token;
}

// Tenta extrair o payload do JWT para pegar a role e o email
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  // No mount, verifica se tem token salvo
  useEffect(() => {
    const token = localStorage.getItem('sge_token');
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.exp * 1000 > Date.now()) {
        const isAdmin = payload.user_metadata?.role === 'admin';
        setUsuario({
          email: payload.email,
          role: isAdmin ? 'admin' : 'viewer',
          token: token
        });
      } else {
        localStorage.removeItem('sge_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    // Em produção: chama a API do Supabase Auth (GoTrue).
    // Em dev local (localhost): autentica via RPC auth_dev.login_local + JWT local.
    const authUrl = POSTGREST_URL.replace('/rest/v1', '') + '/auth/v1/token?grant_type=password';
    
    // Dev local: valida na tabela auth_dev.dev_users e gera JWT com Web Crypto
    if (POSTGREST_URL.includes('localhost')) {
      const token = await _loginLocal(email, password);
      localStorage.setItem('sge_token', token);
      const payload = parseJwt(token);
      setUsuario({
        email: payload.email,
        role: payload.user_metadata?.role === 'admin' ? 'admin' : 'viewer',
        token,
      });
      return;
    }

    // Chave anon_key é obrigatória no header apikey para acessar a rota do GoTrue
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const res = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error_description || errorData.msg || 'Falha ao autenticar.');
    }

    const data = await res.json();
    const token = data.access_token;
    localStorage.setItem('sge_token', token);
    
    const payload = parseJwt(token);
    const isAdmin = payload.user_metadata?.role === 'admin';
    setUsuario({
      email: payload.email,
      role: isAdmin ? 'admin' : 'viewer',
      token: token
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sge_token');
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
