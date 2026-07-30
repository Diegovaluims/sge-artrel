// ToastContext.jsx
// Context global de notificações Toast.
// Uso: const { addToast } = useToast();
//      addToast('success', 'Mensagem'); | addToast('error', 'Erro.');

import { createContext, useCallback, useContext, useState, useRef } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const addToast = useCallback((tipo, msg) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, tipo, msg }]);
    
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      timers.current.delete(id);
    }, 5000);
    timers.current.set(id, timer);
  }, []);

  const removeToast = useCallback(id => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}
