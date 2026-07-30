// App.jsx — Shell principal da aplicação ARTREL ESTOQUE
// Gerencia navegação via tabs (sem react-router) e integra os componentes.

import { useState, useCallback } from 'react';
import EstoqueTable from './components/EstoqueTable/EstoqueTable.jsx';
import ItemForm from './components/ItemForm/ItemForm.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { TiposAtivoProvider } from './context/TiposAtivoContext.jsx';
import ToastContainer from './components/ToastContainer/ToastContainer.jsx';
import './App.css';

const TABS = [
  { id: 'estoque',   label: '📦 Estoque',        title: 'Consulta de Estoque' },
  { id: 'cadastrar', label: '➕ Cadastrar Item',  title: 'Novo Item' },
];

export default function App() {
  const [tabAtiva, setTabAtiva] = useState('estoque');
  // Trigger usado para notificar a tabela ao salvar novo item
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleItemSalvo = useCallback(() => {
    // Muda para a tab de estoque e força recarregamento
    setTabAtiva('estoque');
    setRefreshTrigger(k => k + 1);
  }, []);

  return (
    <ToastProvider>
      <TiposAtivoProvider>
        <div className="app-shell">
          <ToastContainer />
        {/* Header */}
        <header className="app-header">
          <div className="app-header-brand">
            <div className="brand-icon">⚡</div>
            <h1><span>ARTREL</span> Estoque</h1>
          </div>
          <span className="app-header-badge">Protótipo v0.1</span>
        </header>

        {/* Tabs */}
        <nav className="app-tabs" aria-label="Navegação principal">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              className={`tab-btn${tabAtiva === tab.id ? ' active' : ''}`}
              onClick={() => setTabAtiva(tab.id)}
              aria-current={tabAtiva === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Conteúdo principal */}
        <main className="app-main">
          {tabAtiva === 'estoque' && (
            <EstoqueTable refreshTrigger={refreshTrigger} />
          )}
          {tabAtiva === 'cadastrar' && (
            <ItemForm onItemSalvo={handleItemSalvo} />
          )}
        </main>
      </div>
      </TiposAtivoProvider>
    </ToastProvider>
  );
}
