// EditModal.jsx
// Modal de edição de item — v2.
// Hidrata estado a partir de row.especificacoes (JSONB plano da v_estoque_completo).
// grupo_funcional e tipo_ativo são imutáveis após o cadastro.

import { useState, useEffect } from 'react';
import { POSTGREST_URL } from '../../config.js';
import {
  GRUPO_COR,
  CAMPOS_SPECS, ESTADO_SPECS, montarEspecificacoes,
  ExtProtecaoChaveamento, ExtContatores, ExtCondutores,
  ExtDispositivosPartida, ExtPainelAutomacao, ExtAcessorios,
  ExtInfraestruturaFerragem, ExtTransformadores,
} from '../ItemForm/ExtensaoFields.jsx';
import NumberInput from '../NumberInput/NumberInput.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import './EditModal.css';

// Rótulos de ativo (mesma referência da EstoqueTable, definida localmente para isolamento)
const LABEL_ATIVO = {
  DISJUNTOR: 'Disjuntor',
  MINI_DISJUNTOR: 'Mini-Disjuntor',
  RELE: 'Relé',
  FUSIVEL: 'Fusível',
  CHAVE: 'Chave',
  PARA_RAIO: 'Pára-Raio',
  BARRA_ATERRAMENTO: 'Barra de Aterramento',
  CONTATOR: 'Contator',
  CABO: 'Cabo',
  BARRAMENTO: 'Barramento',
  BARRA_CHATA: 'Barra Chata',
  SOFTSTARTER: 'Softstarter',
  INVERSOR: 'Inversor',
  CHAVE_COMPENSADORA: 'Chave Compensadora',
  CAIXA: 'Caixa',
  PAINEL: 'Painel',
  CONTATOS_AUXILIARES: 'Contatos Auxiliares',
  PARAFUSO: 'Parafuso',
  PORCA: 'Porca',
  ARRUELA: 'Arruela',
  TERMINAL: 'Terminal',
  TRANSFORMADOR_TENSAO: 'Transf. de Tensão',
  TRANSFORMADOR_CORRENTE: 'Transf. de Corrente',
  AUTOTRANSFORMADOR: 'Autotransformador',
};

// Achata especificacoes JSONB para o estado flat de specs
function hidratarSpecs(tipoAtivo, jsonb) {
  if (!jsonb || typeof jsonb !== 'object') return {};
  const g = (key, fallback = '') => jsonb[key] !== undefined ? String(jsonb[key]) : fallback;

  const specsEletricas = {
    ce_tipo_corrente:     g('tipo_corrente'),
    ce_corrente_min_a:    g('corrente_min_a'),
    ce_corrente_cc:       g('corrente_cc'),
    ce_tensao_isolamento: g('tensao_isolamento'),
  };

  switch (tipoAtivo) {
    case 'DISJUNTOR':
      return {
        ...specsEletricas,
        dj_tipo:        g('tipo'),
        dj_polos:       g('polos'),
        dj_tensao_v:    g('tensao_v'),
        dj_corrente_a:  g('corrente_a'),
        dj_potencia_kw: g('potencia_kw'),
      };
    case 'MINI_DISJUNTOR':
      return {
        ...specsEletricas,
        md_curva:     g('curva'),
        md_polos:     g('polos'),
        md_tensao_v:  g('tensao_v'),
        md_corrente_a: g('corrente_a'),
      };
    case 'RELE':
      return {
        ...specsEletricas,
        rl_tipo:          g('tipo'),
        rl_tensao_v:      g('tensao_v'),
        rl_corrente_a:    g('corrente_a'),
        rl_contatos_na:   g('contatos_na'),
        rl_contatos_nf:   g('contatos_nf'),
        rl_faixa_tempo_s: g('faixa_tempo_s'),
      };
    case 'FUSIVEL':
      return {
        ...specsEletricas,
        fus_tipo:      g('tipo'),
        fus_tensao_v:  g('tensao_v'),
        fus_corrente_a: g('corrente_a'),
      };
    case 'CHAVE':
      return {
        ...specsEletricas,
        chv_tipo:      g('tipo'),
        chv_tensao_v:  g('tensao_v'),
        chv_corrente_a: g('corrente_a'),
      };
    case 'PARA_RAIO':
      return {
        ...specsEletricas,
        pr_material:   g('material'),
        pr_tensao_v:   g('tensao_v'),
        pr_corrente_ka: g('corrente_ka'),
      };
    case 'CABO':
      return {
        ...specsEletricas,
        cb_material:   g('material'),
        cb_bitola_mm2: g('bitola_mm2'),
        cb_isolamento: g('isolamento'),
      };
    case 'CONTATOR':
      return {
        ...specsEletricas,
        ct_tipo:        g('tipo'),
        ct_polos:       g('polos'),
        ct_tensao_v:    g('tensao_v'),
        ct_corrente_a:  g('corrente_a'),
        ct_contatos_na: g('contatos_na'),
        ct_contatos_nf: g('contatos_nf'),
      };
    case 'CONTATOS_AUXILIARES':
      return {
        ...specsEletricas,
        ca_contatos_na: g('contatos_na'),
        ca_contatos_nf: g('contatos_nf'),
        ca_corrente_a:  g('corrente_a'),
      };
    default:
      return specsEletricas;
  }
}

export default function EditModal({ item, fabricantes, onClose, onSalvo }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!item) return;
    setFeedback(null);
    setForm({
      // Campos base editáveis
      descricao: item.descricao || '',
      fabricante_id: String(item.fabricante_id ?? ''),
      modelo_referencia: item.modelo_referencia || '',
      quantidade: String(item.quantidade ?? 0),
      condicao: item.condicao || 'NOVO',
      status: item.status || 'DISPONIVEL',
      localizacao: item.localizacao || 'GARAGEM',
      localizacao_prateleira: item.localizacao_prateleira || '',
      observacoes: item.observacoes || '',
      // Imutáveis — usados pelos Ext* para renderização correta
      grupo_funcional: item.grupo_funcional || '',
      tipo_ativo: item.tipo_ativo || '',
      // Specs hidratadas do JSONB
      ...ESTADO_SPECS,
      ...hidratarSpecs(item.tipo_ativo, item.especificacoes),
    });
  }, [item]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (feedback) setFeedback(null);
  };

  const handleSalvar = async e => {
    e.preventDefault();
    setEnviando(true);
    setFeedback(null);

    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      // Imutáveis: não enviar
      if (k === 'grupo_funcional' || k === 'tipo_ativo') return;
      // Specs: vão separadas
      if (CAMPOS_SPECS.has(k)) return;
      const val = typeof v === 'string' ? v.trim() : v;
      if (val !== '' && val !== null && val !== undefined) payload[k] = val;
    });
    if (payload.fabricante_id) payload.fabricante_id = Number(payload.fabricante_id);
    if (payload.quantidade !== undefined) payload.quantidade = Number(payload.quantidade);

    const especificacoes = montarEspecificacoes(form.tipo_ativo, form);
    // Envia especificacoes mesmo que nulo para permitir limpeza pelo backend
    payload.especificacoes = especificacoes
      ? JSON.stringify(especificacoes)
      : '{}';

    try {
      const res = await fetch(`${POSTGREST_URL}/rpc/atualizar_item_estoque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ p_id: item.id, p_dados: payload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.hint || `HTTP ${res.status}`);
      }
      addToast('success', 'Item atualizado com sucesso.');
      if (onSalvo) onSalvo();
    } catch (err) {
      setFeedback({ tipo: 'error', msg: err.message });
    } finally {
      setEnviando(false);
    }
  };

  const handleSoftDelete = async () => {
    const label = item.descricao || LABEL_ATIVO[item.tipo_ativo] || item.tipo_ativo;
    if (!window.confirm(`Descartar o item "${label}"?\nEsta ação registra o item como DESCARTADO.`)) return;
    setEnviando(true);
    setFeedback(null);
    try {
      const res = await fetch(`${POSTGREST_URL}/rpc/atualizar_item_estoque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ p_id: item.id, p_dados: { status: 'DESCARTADO' } }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.hint || `HTTP ${res.status}`);
      }
      addToast('success', 'Item descartado com sucesso.');
      if (onSalvo) onSalvo();
    } catch (err) {
      setFeedback({ tipo: 'error', msg: err.message });
      setEnviando(false);
    }
  };

  if (!item || !form) return null;

  const grupo = item.grupo_funcional || '';
  const grupoCor = GRUPO_COR[grupo] || null;
  const labelAtivo = LABEL_ATIVO[item.tipo_ativo] || item.tipo_ativo || '';

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="modal-title">

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span id="modal-title" style={{ fontWeight: 600, color: 'var(--color-text)' }}>
              Editar Item
            </span>
            {grupoCor && (
              <span className="modal-categoria-badge"
                style={{ background: grupoCor.bg, color: grupoCor.color }}>
                {grupoCor.label}
              </span>
            )}
            {labelAtivo && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                — {labelAtivo}
              </span>
            )}
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Fechar modal">✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {feedback && (
            <div className={`modal-feedback ${feedback.tipo}`}>
              {feedback.tipo === 'success' ? '✅' : '⚠️'} {feedback.msg}
            </div>
          )}

          <form id="edit-modal-form" onSubmit={handleSalvar} noValidate>

            {/* Classificação — somente leitura */}
            <div className="form-section">
              <div className="form-section-title">Classificação</div>
              <div className="form-grid">
                <div className="form-field">
                  <label>Grupo</label>
                  <div className="modal-field-readonly">
                    <span>{grupoCor?.label || grupo}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.5 }}>(não editável)</span>
                  </div>
                </div>
                <div className="form-field">
                  <label>Tipo de Ativo</label>
                  <div className="modal-field-readonly">
                    <span>{labelAtivo}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', opacity: 0.5 }}>(não editável)</span>
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="m-fabricante_id">Fabricante</label>
                  <select id="m-fabricante_id" name="fabricante_id" value={form.fabricante_id} onChange={handleChange}>
                    <option value="">— Sem fabricante / Genérico —</option>
                    {fabricantes.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.nome}{f.apelido && f.apelido !== f.nome ? ` (${f.apelido})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="m-modelo_referencia">Modelo / Referência</label>
                  <input id="m-modelo_referencia" name="modelo_referencia" type="text"
                    value={form.modelo_referencia} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Identificação */}
            <div className="form-section">
              <div className="form-section-title">Identificação e Localização</div>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label htmlFor="m-descricao">Descrição Técnica</label>
                  <textarea id="m-descricao" name="descricao"
                    value={form.descricao} onChange={handleChange} />
                </div>
                <div className="form-field">
                  <label htmlFor="m-localizacao">Depósito</label>
                  <select id="m-localizacao" name="localizacao" value={form.localizacao} onChange={handleChange}>
                    <option value="GARAGEM">Garagem</option>
                    <option value="MEZANINO">Mezanino</option>
                    <option value="GALPAO">Galpão</option>
                    <option value="OFICINA">Oficina</option>
                    <option value="OFICINA_MONTAGEM">Oficina de Montagem</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="m-localizacao_prateleira">Prateleira / Gaveta</label>
                  <input id="m-localizacao_prateleira" name="localizacao_prateleira" type="text"
                    value={form.localizacao_prateleira} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Estoque */}
            <div className="form-section">
              <div className="form-section-title">Controle de Estoque</div>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="m-quantidade" className="required-label">Quantidade</label>
                  <NumberInput name="quantidade" value={form.quantidade} onChange={handleChange} min={0} disabled={enviando} />
                </div>
                <div className="form-field">
                  <label htmlFor="m-condicao">Condição</label>
                  <select id="m-condicao" name="condicao" value={form.condicao} onChange={handleChange}>
                    <option value="NOVO">Novo</option>
                    <option value="USADO">Usado</option>
                    <option value="TESTAR">A Testar</option>
                    <option value="DEFEITO">Com Defeito</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="m-status">Status</label>
                  <select id="m-status" name="status" value={form.status} onChange={handleChange}>
                    <option value="DISPONIVEL">Disponível</option>
                    <option value="INDISPONIVEL">Indisponível</option>
                    <option value="RETIRADO">Retirado</option>
                  </select>
                </div>
                <div className="form-field full-width">
                  <label htmlFor="m-observacoes">Observações</label>
                  <textarea id="m-observacoes" name="observacoes"
                    value={form.observacoes} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Especificações Técnicas */}
            {grupo && (
              <div className="form-section extension">
                <div className="form-section-title">
                  Especificações Técnicas
                  {grupoCor && (
                    <span className="cat-info-pill"
                      style={{ background: grupoCor.bg, color: grupoCor.color, marginLeft: '0.5rem' }}>
                      {labelAtivo}
                    </span>
                  )}
                </div>
                {/* tipo_ativo readonly — apenas campos de spec */}
                {grupo === 'PROTECAO_CHAVEAMENTO'    && <ExtProtecaoChaveamento    form={form} onChange={handleChange} />}
                {grupo === 'CONTATORES'              && <ExtContatores             form={form} onChange={handleChange} />}
                {grupo === 'CONDUTORES'              && <ExtCondutores             form={form} onChange={handleChange} />}
                {grupo === 'DISPOSITIVOS_PARTIDA'    && <ExtDispositivosPartida    form={form} onChange={handleChange} />}
                {grupo === 'PAINEL_AUTOMACAO'        && <ExtPainelAutomacao        form={form} onChange={handleChange} />}
                {grupo === 'ACESSORIOS'              && <ExtAcessorios             form={form} onChange={handleChange} />}
                {grupo === 'INFRAESTRUTURA_FERRAGEM' && <ExtInfraestruturaFerragem form={form} onChange={handleChange} />}
                {grupo === 'TRANSFORMADORES'         && <ExtTransformadores        form={form} onChange={handleChange} />}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-modal-delete" type="button" onClick={handleSoftDelete} disabled={enviando}>
            🗑 Descartar Item
          </button>
          <div className="modal-footer-actions">
            <button className="btn-modal-cancel" type="button" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button
              className="btn-modal-save"
              type="submit"
              form="edit-modal-form"
              disabled={enviando || form.quantidade === '' || Number(form.quantidade) < 0}
            >
              {enviando ? 'Salvando…' : '💾 Salvar Alterações'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
