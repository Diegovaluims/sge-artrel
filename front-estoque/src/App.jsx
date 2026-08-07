// App.jsx — Shell principal da aplicação ARTREL ESTOQUE
// Gerencia navegação via tabs (sem react-router) e integra os componentes.

import { useState, useCallback } from 'react';
import Footer from './components/Footer/Footer';
import EstoqueTable from './components/EstoqueTable/EstoqueTable.jsx';
import ItemForm from './components/ItemForm/ItemForm.jsx';
import HistoricoMovimentacao from './components/HistoricoMovimentacao/HistoricoMovimentacao.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { TiposAtivoProvider } from './context/TiposAtivoContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './components/Login/Login.jsx';
import ToastContainer from './components/ToastContainer/ToastContainer.jsx';
import logoArtrel from './assets/logo_artrel_novo.png';
import './App.css';

const TABS = [
  { id: 'estoque',   label: 'Estoque',        title: 'Consulta de Estoque' },
  { id: 'cadastrar', label: 'Cadastrar Item',  title: 'Novo Item' },
  { id: 'historico', label: 'Histórico de Movimentação', title: 'Histórico de Movimentação' }
];

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  );
}

// Guard de autenticação — renderiza Login até haver sessão válida
function AppShell() {
  const { usuario, loading, logout } = useAuth();
  const [tabAtiva, setTabAtiva] = useState('estoque');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [focarCategoria, setFocarCategoria] = useState(false);

  const handleItemSalvo = useCallback(() => {
    setTabAtiva('estoque');
    setRefreshTrigger(k => k + 1);
  }, []);

  const handleNovoItem = useCallback(() => {
    setFocarCategoria(true);
    setTabAtiva('cadastrar');
  }, []);

  const handleClickTabCadastrar = () => {
    setFocarCategoria(false);
    setTabAtiva('cadastrar');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted, #888)' }}>
        Verificando sessão…
      </div>
    );
  }

  if (!usuario) return <Login />;

  return (
    <TiposAtivoProvider>
      <div className="app-shell">
        <ToastContainer />
        {/* Header */}
        <header className="app-header">
          <div className="app-header-brand">
            <div className="brand-icon">
              <img src={logoArtrel} alt="Logo ARTREL" />
            </div>
            <h1>Sistema de Gerenciamento</h1>
          </div>
          <div className="app-header-actions">
            <span className="app-header-user">{usuario.email}</span>
            <button className="btn-logout" onClick={logout}>Sair</button>
          </div>
        </header>

        {/* Tabs */}
        <nav className="app-tabs" aria-label="Navegação principal">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              className={`tab-btn${tabAtiva === tab.id ? ' active' : ''}`}
              onClick={() => {
                if (tab.id === 'cadastrar') handleClickTabCadastrar();
                setTabAtiva(tab.id);
              }}
              aria-current={tabAtiva === tab.id ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Conteúdo principal */}
        <main className="app-main">
          {tabAtiva === 'estoque' && (
            <EstoqueTable refreshTrigger={refreshTrigger} onNovoItem={handleNovoItem} />
          )}
          {tabAtiva === 'cadastrar' && (
            <ItemForm onItemSalvo={handleItemSalvo} focarCategoria={focarCategoria}/>
          )}
          {tabAtiva === 'historico' && (
            <HistoricoMovimentacao />
          )}
        </main>
        <Footer />
      </div>
    </TiposAtivoProvider>
  );
}
