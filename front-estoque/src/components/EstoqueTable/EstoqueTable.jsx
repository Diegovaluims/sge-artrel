// EstoqueTable.jsx
// Consome GET /v_estoque_completo via PostgREST — v2.
// Colunas: Grupo (grupo_funcional badge) + Ativo (tipo_ativo) + demais.
// Especificações lidas de row.especificacoes (JSONB plano da view).

import { useState, useEffect } from 'react';
import { POSTGREST_URL } from '../../config.js';
import { GRUPO_COR } from '../ItemForm/ExtensaoFields.jsx';
import EditModal from '../EditModal/EditModal.jsx';
import './EstoqueTable.css';

// Rótulos legíveis para cada tipo_ativo
const LABEL_ATIVO = {
  DISJUNTOR:               'Disjuntor',
  MINI_DISJUNTOR:          'Mini-Disjuntor',
  RELE:                    'Relé',
  FUSIVEL:                 'Fusível',
  CHAVE:                   'Chave',
  PARA_RAIO:               'Pára-Raio',
  BARRA_ATERRAMENTO:       'Barra de Aterramento',
  CABO:                    'Cabo',
  BARRAMENTO:              'Barramento',
  CAIXA:                   'Caixa',
  PAINEL:                  'Painel',
  SOFTSTARTER:             'Softstarter',
  INVERSOR:                'Inversor',
  PARAFUSO:                'Parafuso',
  PORCA:                   'Porca',
  ARRUELA:                 'Arruela',
  TERMINAL:                'Terminal',
  TRANSFORMADOR_TENSAO:    'Transf. de Tensão',
  TRANSFORMADOR_CORRENTE:  'Transf. de Corrente',
  AUTOTRANSFORMADOR:       'Autotransformador',
};

// Extrai resumo de especificações técnicas do JSONB para exibição na tabela
function getInfoTecnica(row) {
  const spec = row.especificacoes || {};
  const partes = [];

  // Campos comuns mais relevantes para exibição
  if (spec.tipo)         partes.push(spec.tipo);
  if (spec.polos)        partes.push(spec.polos);
  if (spec.curva)        partes.push(`Curva ${spec.curva}`);
  if (spec.corrente_a)   partes.push(`${spec.corrente_a} A`);
  if (spec.corrente_min_a && spec.corrente_max_a)
    partes.push(`${spec.corrente_min_a}–${spec.corrente_max_a} A`);
  if (spec.tensao_v)     partes.push(`${spec.tensao_v} V`);
  if (spec.potencia_kw)  partes.push(`${spec.potencia_kw} kW`);
  if (spec.material)     partes.push(spec.material);
  if (spec.bitola_mm2)   partes.push(`${spec.bitola_mm2} mm²`);
  if (spec.isolamento)   partes.push(spec.isolamento);

  return partes.length > 0 ? partes.join(' · ') : '—';
}

export default function EstoqueTable() {
  const [dados, setDados] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [fetchTick, setFetchTick] = useState(0);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [fabricantes, setFabricantes] = useState([]);

  const recarregar = () => { setLoading(true); setErro(null); setFetchTick(t => t + 1); };

  useEffect(() => {
    let ativo = true;
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

  useEffect(() => {
    fetch(`${POSTGREST_URL}/fabricantes?order=nome.asc&select=id,nome,apelido`, {
      headers: { Accept: 'application/json' },
    })
      .then(r => r.json())
      .then(setFabricantes)
      .catch(() => setFabricantes([]));
  }, []);

  const filtrado = dados
    .filter(row => row.status !== 'DESCARTADO')
    .filter(row => {
      if (!filtro.trim()) return true;
      const haystack = [
        row.descricao, row.modelo_referencia,
        row.tipo_ativo, row.grupo_funcional, row.fabricante,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(filtro.toLowerCase());
    });

  const handleSelecionarItem = row => setItemSelecionado(row);

  const handleModalSalvo = () => {
    setItemSelecionado(null);
    recarregar();
  };

  return (
    <div className="estoque-table-wrapper">

      {itemSelecionado && (
        <EditModal
          item={itemSelecionado}
          fabricantes={fabricantes}
          onClose={() => setItemSelecionado(null)}
          onSalvo={handleModalSalvo}
        />
      )}

      {/* Toolbar */}
      <div className="estoque-toolbar">
        <div className="estoque-search-wrap">
          <span className="search-icon">🔍</span>
          <input
            id="estoque-filtro"
            type="text"
            placeholder="Filtrar por descrição, modelo, tipo ou grupo..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
        <span className="estoque-count">
          {loading ? '…' : `${filtrado.length} / ${dados.filter(r => r.status !== 'DESCARTADO').length} itens`}
        </span>
        <button
          className={`estoque-edit-btn${modoEdicao ? ' active' : ''}`}
          onClick={() => setModoEdicao(m => !m)}
          title={modoEdicao ? 'Sair do modo de edição' : 'Entrar no modo de edição'}
        >
          {modoEdicao ? '✕ Sair da Edição' : '✏️ Editar'}
        </button>
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
      {loading && <div className="estoque-state"><span>⏳</span> Carregando estoque…</div>}
      {!loading && erro && <div className="estoque-state error"><span>⚠️</span> Erro ao carregar: {erro}</div>}
      {!loading && !erro && filtrado.length === 0 && (
        <div className="estoque-state"><span>📦</span> Nenhum item encontrado.</div>
      )}

      {/* Tabela */}
      {!loading && !erro && filtrado.length > 0 && (
        <div className="table-scroll">
          <table className="estoque-table" aria-label="Tabela de estoque">
            <thead>
              <tr>
                {modoEdicao && <th style={{ width: 52 }}></th>}
                <th>Grupo</th>
                <th>Ativo</th>
                <th>Especificações</th>
                <th>Fabricante</th>
                <th>Modelo / Ref.</th>
                <th>Descrição</th>
                <th>Condição</th>
                <th>Qtd</th>
                <th>Status</th>
                <th>Local</th>
                <th>Prateleira</th>
              </tr>
            </thead>
            <tbody>
              {filtrado.map(row => {
                const grupo    = row.grupo_funcional || '';
                const grupoCor = GRUPO_COR[grupo] || {};
                const labelAtivo = LABEL_ATIVO[row.tipo_ativo] || row.tipo_ativo || '—';

                return (
                  <tr key={row.id} className={modoEdicao ? 'row-editavel' : ''}>
                    {modoEdicao && (
                      <td>
                        <button
                          className="row-edit-btn"
                          title="Editar este item"
                          onClick={() => handleSelecionarItem(row)}
                        >
                          ✏️
                        </button>
                      </td>
                    )}
                    <td>
                      <span
                        className="cat-tag"
                        style={{ background: grupoCor.bg, color: grupoCor.color }}
                      >
                        {grupoCor.label || grupo}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{labelAtivo}</td>
                    <td className="muted">{getInfoTecnica(row)}</td>
                    <td>{row.fabricante || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                    <td className="muted">{row.modelo_referencia || '—'}</td>
                    <td>{row.descricao || '—'}</td>
                    <td className="muted">{row.condicao}</td>
                    <td>
                      <span className={`qty-cell${row.quantidade === 0 ? ' zero' : ''}`}>
                        {row.quantidade}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${row.status}`}>{row.status}</span>
                    </td>
                    <td className="muted">{row.localizacao}</td>
                    <td className="muted">{row.localizacao_prateleira || '—'}</td>
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
