// ItemForm.jsx
// Formulário dinâmico de cadastro de itens de estoque — v2.
// Fluxo: grupo_funcional (5 grandes grupos) → tipo_ativo → campos de spec (JSONB).

import { useState, useEffect } from 'react';
import { POSTGREST_URL } from '../../config.js';
import {
  ATIVOS_POR_GRUPO, GRUPO_COR, CAMPOS_SPECS, ESTADO_SPECS, montarEspecificacoes,
  ExtProtecaoChaveamento, ExtCondutores,
  ExtPainelAutomacao, ExtInfraestruturaFerragem, ExtTransformadores,
} from './ExtensaoFields.jsx';
import NumberInput from '../NumberInput/NumberInput.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import './ItemForm.css';

const GRUPOS = [
  { value: 'PROTECAO_CHAVEAMENTO',    label: 'Proteção e Chaveamento' },
  { value: 'CONDUTORES',              label: 'Condutores' },
  { value: 'PAINEL_AUTOMACAO',        label: 'Painéis e Automação' },
  { value: 'INFRAESTRUTURA_FERRAGEM', label: 'Infraestrutura e Ferragem' },
  { value: 'TRANSFORMADORES',         label: 'Transformadores' },
];

const ESTADO_INICIAL = {
  grupo_funcional: '',
  tipo_ativo: '',
  fabricante_id: '',
  modelo_referencia: '',
  descricao: '',
  localizacao: 'GARAGEM',
  localizacao_prateleira: '',
  quantidade: 1,
  condicao: 'NOVO',
  status: 'DISPONIVEL',
  observacoes: '',
  ...ESTADO_SPECS,
};

export default function ItemForm({ onItemSalvo }) {
  const { addToast } = useToast();
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [fabricantes, setFabricantes] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch(`${POSTGREST_URL}/fabricantes?order=nome.asc&select=id,nome,apelido`, {
      headers: { Accept: 'application/json' },
    })
      .then(r => r.json())
      .then(setFabricantes)
      .catch(() => setFabricantes([]));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => {
      // Ao trocar grupo, reseta tipo_ativo e todas as specs
      if (name === 'grupo_funcional') {
        return { ...ESTADO_INICIAL, ...prev, grupo_funcional: value, tipo_ativo: '' };
      }
      // Ao trocar tipo_ativo, reseta apenas as specs
      if (name === 'tipo_ativo') {
        return { ...prev, tipo_ativo: value, ...ESTADO_SPECS };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleReset = () => setForm(ESTADO_INICIAL);

  const handleSubmit = async e => {
    e.preventDefault();
    setEnviando(true);

    // Monta payload base (exclui campos de spec)
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      if (CAMPOS_SPECS.has(k)) return;
      const val = typeof v === 'string' ? v.trim() : v;
      if (val !== '' && val !== null && val !== undefined) payload[k] = val;
    });
    if (payload.fabricante_id) payload.fabricante_id = Number(payload.fabricante_id);
    if (payload.quantidade !== undefined) payload.quantidade = Number(payload.quantidade);

    // Monta especificacoes JSONB
    const especificacoes = montarEspecificacoes(form.tipo_ativo, form);
    if (especificacoes) payload.especificacoes = JSON.stringify(especificacoes);

    try {
      const res = await fetch(`${POSTGREST_URL}/rpc/inserir_item_estoque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ p_dados: payload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.hint || `HTTP ${res.status}`);
      }
      const resultado = await res.json();
      addToast('success', `Item cadastrado! ID: ${resultado.id}`);
      setForm(ESTADO_INICIAL);
      if (onItemSalvo) onItemSalvo();
    } catch (err) {
      addToast('error', err.message);
    } finally {
      setEnviando(false);
    }
  };

  const grupo    = form.grupo_funcional;
  const grupoCor = grupo ? GRUPO_COR[grupo] : null;
  const temTipo  = !!form.tipo_ativo;

  const podeSubmeter =
    !enviando &&
    !!grupo &&
    !!form.tipo_ativo &&
    form.quantidade !== '' &&
    Number(form.quantidade) >= 0;

  return (
    <div className="item-form-wrapper">
      <div className="item-form-header">
        <h2>Cadastrar Item de Estoque</h2>
        <p>Selecione o grupo e o tipo do ativo. Os campos de especificação aparecem em seguida.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Classificação ── */}
        <div className="form-section">
          <div className="form-section-title">Classificação</div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="grupo_funcional" className="required-label">Categoria</label>
              <select id="grupo_funcional" name="grupo_funcional" value={grupo} onChange={handleChange} required>
                <option value="">— Selecione a categoria —</option>
                {GRUPOS.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              {grupoCor && (
                <span className="cat-info-pill" style={{ background: grupoCor.bg, color: grupoCor.color }}>
                  {grupoCor.label}
                </span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="fabricante_id">Fabricante</label>
              <select id="fabricante_id" name="fabricante_id" value={form.fabricante_id} onChange={handleChange}>
                <option value="">— Sem fabricante / Genérico —</option>
                {fabricantes.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nome}{f.apelido && f.apelido !== f.nome ? ` (${f.apelido})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="modelo_referencia">Modelo / Referência</label>
              <input id="modelo_referencia" name="modelo_referencia" type="text"
                placeholder="ex: 3VU13, RE7TL11BU" value={form.modelo_referencia} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* ── Identificação e Localização ── */}
        <div className="form-section">
          <div className="form-section-title">Identificação e Localização</div>
          <div className="form-grid">
            <div className="form-field full-width">
              <label htmlFor="descricao">Descrição Técnica</label>
              <textarea id="descricao" name="descricao"
                placeholder="ex: Disjuntor Motor Tripolar 380V 7,5CV"
                value={form.descricao} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label htmlFor="localizacao" className="required-label">Depósito</label>
              <select id="localizacao" name="localizacao" value={form.localizacao} onChange={handleChange} required>
                <option value="GARAGEM">Garagem</option>
                <option value="MEZANINO">Mezanino</option>
                <option value="GALPAO">Galpão</option>
                <option value="OFICINA">Oficina</option>
                <option value="OFICINA_MONTAGEM">Oficina de Montagem</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="localizacao_prateleira">Prateleira / Gaveta</label>
              <input id="localizacao_prateleira" name="localizacao_prateleira" type="text"
                placeholder="ex: DJ 01, RL TÉRMICO" value={form.localizacao_prateleira} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* ── Controle de Estoque ── */}
        <div className="form-section">
          <div className="form-section-title">Controle de Estoque</div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="quantidade" className="required-label">Quantidade</label>
              <NumberInput name="quantidade" value={form.quantidade} onChange={handleChange} min={0} disabled={enviando} />
            </div>
            <div className="form-field">
              <label htmlFor="condicao">Condição</label>
              <select id="condicao" name="condicao" value={form.condicao} onChange={handleChange}>
                <option value="NOVO">Novo</option>
                <option value="USADO">Usado</option>
                <option value="TESTAR">A Testar</option>
                <option value="DEFEITO">Com Defeito</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={form.status} onChange={handleChange}>
                <option value="DISPONIVEL">Disponível</option>
                <option value="INDISPONIVEL">Indisponível</option>
                <option value="RETIRADO">Retirado</option>
                <option value="DESCARTADO">Descartado</option>
              </select>
            </div>
            <div className="form-field full-width">
              <label htmlFor="observacoes">Observações</label>
              <textarea id="observacoes" name="observacoes"
                placeholder="Notas adicionais, número de série, histórico..."
                value={form.observacoes} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* ── Especificações Técnicas (condicional ao grupo) ── */}
        {grupo && (
          <div className="form-section extension">
            <div className="form-section-title">
              Especificações Técnicas
              {grupoCor && (
                <span className="cat-info-pill" style={{ background: grupoCor.bg, color: grupoCor.color, marginLeft: '0.5rem' }}>
                  {grupoCor.label}
                </span>
              )}
            </div>
            {grupo === 'PROTECAO_CHAVEAMENTO'    && <ExtProtecaoChaveamento    form={form} onChange={handleChange} />}
            {grupo === 'CONDUTORES'              && <ExtCondutores             form={form} onChange={handleChange} />}
            {grupo === 'PAINEL_AUTOMACAO'        && <ExtPainelAutomacao        form={form} onChange={handleChange} />}
            {grupo === 'INFRAESTRUTURA_FERRAGEM' && <ExtInfraestruturaFerragem form={form} onChange={handleChange} />}
            {grupo === 'TRANSFORMADORES'         && <ExtTransformadores        form={form} onChange={handleChange} />}
          </div>
        )}

        {/* ── Ações ── */}
        <div className="form-actions">
          <button type="button" className="btn-reset" onClick={handleReset} disabled={enviando}>Limpar</button>
          <button type="submit" className="btn-submit" disabled={!podeSubmeter}>
            {enviando ? 'Salvando…' : '💾 Salvar Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
