// EstoqueTable.jsx
// Consome GET /v_estoque_completo via PostgREST.
// Filtro local por descricao ou modelo_referencia.
// Sem dependências externas — React puro com fetch.

import { useState, useEffect } from 'react';
import { POSTGREST_URL } from '../../config.js';
import './EstoqueTable.css';

// Mapa de categoria → grupo_funcional (para a tag colorida)
const GRUPO_MAP = {
  DISJUNTOR: 'PROTECAO_CHAVEAMENTO', MINI_DISJUNTOR: 'PROTECAO_CHAVEAMENTO',
  FUSIVEL: 'PROTECAO_CHAVEAMENTO', CHAVE: 'PROTECAO_CHAVEAMENTO', PARA_RAIO: 'PROTECAO_CHAVEAMENTO',
  CONTATOR: 'ACIONAMENTO_CONTROLE', RELE: 'ACIONAMENTO_CONTROLE',
  CONTATO_AUXILIAR: 'ACIONAMENTO_CONTROLE', COMANDO_ELETRICO: 'ACIONAMENTO_CONTROLE',
  SOFTSTARTER: 'ACIONAMENTO_CONTROLE',
  TC: 'TRANSFORMADORES', TT: 'TRANSFORMADORES', AUTOTRANSFORMADOR: 'TRANSFORMADORES',
  INVERSOR_FREQUENCIA: 'TRANSFORMADORES', REGULADOR: 'TRANSFORMADORES',
  CLP_IHM: 'AUTOMACAO_MEDICAO', USCA: 'AUTOMACAO_MEDICAO',
  INSTRUMENTO_SENSOR: 'AUTOMACAO_MEDICAO', CAPACITOR: 'AUTOMACAO_MEDICAO',
};

// Retorna o subtipo e os campos técnicos resumidos de uma row da view
function getInfoTecnica(row) {
  const g = row.grupo_funcional;
  if (g === 'PROTECAO_CHAVEAMENTO') {
    const parts = [row.pc_subtipo, row.pc_corrente_nominal_a && `${row.pc_corrente_nominal_a}A`,
                   row.pc_tensao_nominal_v && `${row.pc_tensao_nominal_v}V`, row.pc_numero_polos].filter(Boolean);
    return parts.join(' · ') || '—';
  }
  if (g === 'ACIONAMENTO_CONTROLE') {
    const parts = [row.ac_subtipo, row.ac_tensao_operacao_v && `${row.ac_tensao_operacao_v}V`,
                   row.ac_corrente_nominal_a && `${row.ac_corrente_nominal_a}A`].filter(Boolean);
    return parts.join(' · ') || '—';
  }
  if (g === 'TRANSFORMADORES') {
    const parts = [row.tr_subtipo, row.tr_tensao_entrada_v && `${row.tr_tensao_entrada_v}V→${row.tr_tensao_saida_v}V`].filter(Boolean);
    return parts.join(' · ') || '—';
  }
  if (g === 'AUTOMACAO_MEDICAO') {
    return [row.am_subtipo, row.am_tensao_alimentacao_v && `${row.am_tensao_alimentacao_v}V`].filter(Boolean).join(' · ') || '—';
  }
  return [row.inf_subtipo, row.inf_tensao_v && `${row.inf_tensao_v}V`].filter(Boolean).join(' · ') || '—';
}

export default function EstoqueTable() {
  const [dados, setDados] = useState([]);
  const [filtro, setFiltro] = useState('');
  // loading inicia true para mostrar estado enquanto o primeiro fetch ocorre
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  // Incrementar este contador força o useEffect a re-executar o fetch
  const [fetchTick, setFetchTick] = useState(0);

  const recarregar = () => {
    setLoading(true);
    setErro(null);
    setFetchTick(t => t + 1);
  };

  useEffect(() => {
    let ativo = true; // evita setState após desmontagem

    fetch(`${POSTGREST_URL}/v_estoque_completo?order=criado_em.desc`, {
      headers: { Accept: 'application/json' },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
        return res.json();
      })
      .then(json => { if (ativo) { setDados(json); setLoading(false); } })
      .catch(e => { if (ativo) { setErro(e.message); setLoading(false); } });

    return () => { ativo = false; };
  }, [fetchTick]);

  // Filtro local — busca em descricao e modelo_referencia
  const filtrado = filtro.trim() === ''
    ? dados
    : dados.filter(row => {
        const haystack = [row.descricao, row.modelo_referencia, row.categoria, row.fabricante]
          .filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(filtro.toLowerCase());
      });

  return (
    <div className="estoque-table-wrapper">
      {/* Toolbar */}
      <div className="estoque-toolbar">
        <div className="estoque-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="estoque-filtro"
            type="text"
            placeholder="Filtrar por descrição, modelo ou categoria..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
        <span className="estoque-count">
          {loading ? '…' : `${filtrado.length} / ${dados.length} itens`}
        </span>
        <button
          className="estoque-reload-btn"
          onClick={recarregar}
          title="Recarregar dados"
          disabled={loading}
        >
          ↺ Atualizar
        </button>
      </div>

      {/* Estados */}
      {loading && (
        <div className="estoque-state">
          <span>⏳</span> Carregando estoque…
        </div>
      )}
      {!loading && erro && (
        <div className="estoque-state error">
          <span>⚠️</span> Erro ao carregar: {erro}
        </div>
      )}
      {!loading && !erro && dados.length === 0 && (
        <div className="estoque-state">
          <span>📦</span> Nenhum item cadastrado ainda.
        </div>
      )}

      {/* Tabela */}
      {!loading && !erro && dados.length > 0 && (
        <div className="table-scroll">
          <table className="estoque-table" aria-label="Tabela de estoque">
            <thead>
              <tr>
                <th>Prateleira</th>
                <th>Categoria</th>
                <th>Fabricante</th>
                <th>Modelo / Ref.</th>
                <th>Descrição</th>
                <th>Info Técnica</th>
                <th>Qtd</th>
                <th>Condição</th>
                <th>Status</th>
                <th>Local</th>
              </tr>
            </thead>
            <tbody>
              {filtrado.map(row => {
                const grupo = row.grupo_funcional || GRUPO_MAP[row.categoria] || 'INFRAESTRUTURA';
                return (
                  <tr key={row.id}>
                    <td className="muted">{row.localizacao_prateleira || '—'}</td>
                    <td>
                      <span className={`cat-tag ${grupo}`}>{row.categoria}</span>
                    </td>
                    <td>{row.fabricante || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                    <td className="muted">{row.modelo_referencia || '—'}</td>
                    <td>{row.descricao || '—'}</td>
                    <td className="muted">{getInfoTecnica(row)}</td>
                    <td>
                      <span className={`qty-cell${row.quantidade === 0 ? ' zero' : ''}`}>
                        {row.quantidade}
                      </span>
                    </td>
                    <td className="muted">{row.condicao}</td>
                    <td>
                      <span className={`status-badge ${row.status}`}>{row.status}</span>
                    </td>
                    <td className="muted">{row.localizacao}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
