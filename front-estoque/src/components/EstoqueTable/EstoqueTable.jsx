// EstoqueTable.jsx
// Consome GET /v_estoque_completo via PostgREST — v2.
// Colunas: Grupo (grupo_funcional badge) + Ativo (tipo_ativo) + demais.
// Especificações lidas de row.especificacoes (JSONB plano da view).

import { useState, useEffect } from 'react';
import { POSTGREST_URL } from '../../config.js';
import EditModal from '../EditModal/EditModal.jsx';
import { useTiposAtivo } from '../../context/TiposAtivoContext.jsx';
import './EstoqueTable.css';

// Extrai resumo de especificações técnicas do JSONB para exibição na tabela
function getInfoTecnica(row) {
  const spec = row.especificacoes || {};
  const partes = [];

  // Campos comuns mais relevantes para exibição
  if (spec.tipo)         partes.push(`${spec.tipo}`);
  if (spec.polos)        partes.push(`${spec.polos}`);
  if (spec.curva)        partes.push(`Curva ${spec.curva}`);
  if (spec.corrente_a)   partes.push(`${spec.corrente_a} A`);
  if (spec.corrente_min_a && spec.corrente_max_a)
    partes.push(`${spec.corrente_min_a}–${spec.corrente_max_a} A`);
  if (spec.tensao_v)     partes.push(`${spec.tensao_v} V`);
  if (spec.potencia_kw)  partes.push(`${spec.potencia_kw} kW`);
  if (spec.material)     partes.push(spec.material);
  if (spec.bitola_mm2)   partes.push(`${spec.bitola_mm2} mm²`);
  if (spec.isolamento)   partes.push(spec.isolamento);
  if (spec.tipo_corrente)    partes.push(spec.tipo_corrente);
  if (spec.corrente_cc)      partes.push(`${spec.corrente_cc} kA Icc`);
  if (spec.tensao_isolamento) partes.push(`${spec.tensao_isolamento} Vi`);


  return partes.length > 0 ? partes.join(' · ') : '—';
}

export default function EstoqueTable({ refreshTrigger }) {
  const { LABEL_ATIVO, GRUPO_COR, loading: loadingTipos } = useTiposAtivo();
  const [dados, setDados] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  
  // Paginação
  const [pagina, setPagina] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const LIMIT = 50;

  const [modoEdicao, setModoEdicao] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [fabricantes, setFabricantes] = useState([]);

  const recarregar = () => { setLoading(true); setErro(null); setPagina(1); };

  useEffect(() => {
    let ativo = true;
    setLoading(true);
    fetch(`${POSTGREST_URL}/v_estoque_completo?order=criado_em.desc&limit=${LIMIT}&offset=${(pagina - 1) * LIMIT}`, {
      headers: { Accept: 'application/json', Prefer: 'count=exact' },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
        const contentRange = res.headers.get('Content-Range');
        if (contentRange) {
          const total = parseInt(contentRange.split('/')[1], 10);
          setTotalItems(total);
        }
        return res.json();
      })
      .then(json => { if (ativo) { setDados(json); setLoading(false); } })
      .catch(e => { if (ativo) { setErro(e.message); setLoading(false); } });
    return () => { ativo = false; };
  }, [pagina, refreshTrigger]);

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
          {loading || loadingTipos ? '…' : `Página ${pagina} — ${totalItems > 0 ? totalItems + ' itens totais' : filtrado.length + ' / ' + dados.filter(r => r.status !== 'DESCARTADO').length + ' itens na página'}`}
        </span>
        <div className="estoque-pagination">
          <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={loading || pagina === 1}>Anterior</button>
          <button onClick={() => setPagina(p => p + 1)} disabled={loading || dados.length < LIMIT}>Próxima</button>
        </div>
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
      {(loading || loadingTipos) && <div className="estoque-state"><span>⏳</span> Carregando estoque…</div>}
      {(!loading && !loadingTipos) && erro && <div className="estoque-state error"><span>⚠️</span> Erro ao carregar: {erro}</div>}
      {(!loading && !loadingTipos) && !erro && filtrado.length === 0 && (
        <div className="estoque-state"><span>📦</span> Nenhum item encontrado.</div>
      )}

      {/* Tabela */}
      {(!loading && !loadingTipos) && !erro && filtrado.length > 0 && (
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
