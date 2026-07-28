// App.jsx — Shell principal da aplicação ARTREL ESTOQUE
// Gerencia navegação via tabs (sem react-router) e integra os componentes.

import { useState } from 'react';
import EstoqueTable from './components/EstoqueTable/EstoqueTable.jsx';
import ItemForm from './components/ItemForm/ItemForm.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ToastContainer from './components/ToastContainer/ToastContainer.jsx';
import './App.css';

const TABS = [
  { id: 'estoque',   label: '📦 Estoque',        title: 'Consulta de Estoque' },
  { id: 'cadastrar', label: '➕ Cadastrar Item',  title: 'Novo Item' },
];

export default function App() {
  const [tabAtiva, setTabAtiva] = useState('estoque');
  // Contador usado para forçar refresh da tabela ao salvar novo item
  const [refreshKey, setRefreshKey] = useState(0);

  const handleItemSalvo = () => {
    // Muda para a tab de estoque e força recarregamento
    setTabAtiva('estoque');
    setRefreshKey(k => k + 1);
  };

  return (
    <ToastProvider>
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
            <EstoqueTable key={refreshKey} />
          )}
          {tabAtiva === 'cadastrar' && (
            <ItemForm onItemSalvo={handleItemSalvo} />
          )}
        </main>
      </div>
    </ToastProvider>
  );
}
