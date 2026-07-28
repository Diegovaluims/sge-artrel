// ToastContainer.jsx
// Renderiza a lista de toasts ativos no canto superior direito.

import { useToast } from '../../context/ToastContext.jsx';
import './ToastContainer.css';

const ICONE = { success: '✅', error: '⚠️' };

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  if (!toasts.length) return null;

  return (
    <div className="toast-container" role="region" aria-live="polite" aria-label="Notificações">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.tipo}`} role="alert">
          <span className="toast-icon">{ICONE[t.tipo]}</span>
          <span className="toast-msg">{t.msg}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Fechar">✕</button>
        </div>
      ))}
    </div>
  );
}
