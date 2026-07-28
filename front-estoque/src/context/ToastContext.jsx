// ToastContext.jsx
// Context global de notificações Toast.
// Uso: const { addToast } = useToast();
//      addToast('success', 'Mensagem'); | addToast('error', 'Erro.');

import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let _nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((tipo, msg) => {
    const id = _nextId++;
    setToasts(prev => [...prev, { id, tipo, msg }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback(id => {
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
