// ItemForm.jsx
// Formulário dinâmico de cadastro de itens de estoque.
// Campos base sempre visíveis; seção de extensão renderizada condicionalmente pela categoria.
// Submit empacota tudo em um único JSON e envia via POST /rpc/inserir_item_estoque.
//
// Extensões detalhadas implementadas: PROTECAO_CHAVEAMENTO, ACIONAMENTO_CONTROLE.
// Extensões em placeholder: TRANSFORMADORES, AUTOMACAO_MEDICAO, INFRAESTRUTURA.

import { useState, useEffect } from 'react';
import { POSTGREST_URL } from '../../config.js';
import './ItemForm.css';

// ─── Dados de domínio ────────────────────────────────────────────────────────

const CATEGORIAS = [
  { value: '', label: '— Selecione a categoria —' },
  // Proteção & Chaveamento
  { value: 'DISJUNTOR',       label: 'Disjuntor',        grupo: 'PROTECAO_CHAVEAMENTO' },
  { value: 'MINI_DISJUNTOR',  label: 'Mini Disjuntor',   grupo: 'PROTECAO_CHAVEAMENTO' },
  { value: 'FUSIVEL',         label: 'Fusível',           grupo: 'PROTECAO_CHAVEAMENTO' },
  { value: 'CHAVE',           label: 'Chave',             grupo: 'PROTECAO_CHAVEAMENTO' },
  { value: 'PARA_RAIO',       label: 'Para-Raio',         grupo: 'PROTECAO_CHAVEAMENTO' },
  // Acionamento & Controle
  { value: 'CONTATOR',        label: 'Contator',          grupo: 'ACIONAMENTO_CONTROLE' },
  { value: 'RELE',            label: 'Relé',              grupo: 'ACIONAMENTO_CONTROLE' },
  { value: 'CONTATO_AUXILIAR',label: 'Contato Auxiliar',  grupo: 'ACIONAMENTO_CONTROLE' },
  { value: 'COMANDO_ELETRICO',label: 'Comando Elétrico',  grupo: 'ACIONAMENTO_CONTROLE' },
  { value: 'SOFTSTARTER',     label: 'Softstarter',       grupo: 'ACIONAMENTO_CONTROLE' },
  // Transformadores
  { value: 'TC',              label: 'TC (Transformador de Corrente)', grupo: 'TRANSFORMADORES' },
  { value: 'TT',              label: 'TT (Transformador de Tensão)',   grupo: 'TRANSFORMADORES' },
  { value: 'AUTOTRANSFORMADOR',label: 'Autotransformador',            grupo: 'TRANSFORMADORES' },
  { value: 'INVERSOR_FREQUENCIA',label: 'Inversor de Frequência',     grupo: 'TRANSFORMADORES' },
  { value: 'REGULADOR',       label: 'Regulador',                     grupo: 'TRANSFORMADORES' },
  // Automação & Medição
  { value: 'CLP_IHM',         label: 'CLP / IHM',         grupo: 'AUTOMACAO_MEDICAO' },
  { value: 'USCA',            label: 'USCA / Controlador', grupo: 'AUTOMACAO_MEDICAO' },
  { value: 'INSTRUMENTO_SENSOR',label: 'Instrumento / Sensor', grupo: 'AUTOMACAO_MEDICAO' },
  { value: 'CAPACITOR',       label: 'Capacitor',          grupo: 'AUTOMACAO_MEDICAO' },
  // Infraestrutura
  { value: 'ILUMINACAO',      label: 'Iluminação',         grupo: 'INFRAESTRUTURA' },
  { value: 'CONECTIVIDADE',   label: 'Conectividade',      grupo: 'INFRAESTRUTURA' },
  { value: 'FERRAMENTAL_ATUADOR',label: 'Ferramental / Atuador', grupo: 'INFRAESTRUTURA' },
  { value: 'FIXADOR_FERRAGEM',label: 'Fixador / Ferragem', grupo: 'INFRAESTRUTURA' },
  { value: 'CONDUTOR',        label: 'Condutor',           grupo: 'INFRAESTRUTURA' },
  { value: 'INFRA_ACONDICIONAMENTO',label: 'Infra / Acondicionamento', grupo: 'INFRAESTRUTURA' },
  { value: 'TERMINAL_CONEXAO',label: 'Terminal / Conexão', grupo: 'INFRAESTRUTURA' },
  { value: 'DISPOSITIVO_MANOBRA',label: 'Dispositivo de Manobra', grupo: 'INFRAESTRUTURA' },
  { value: 'BATERIA_FONTE',   label: 'Bateria / Fonte',    grupo: 'INFRAESTRUTURA' },
  { value: 'KIT_CONJUNTO',    label: 'Kit / Conjunto',     grupo: 'INFRAESTRUTURA' },
];

const GRUPO_COR = {
  PROTECAO_CHAVEAMENTO: { bg: 'rgba(249,115,22,.15)', color: '#f97316', label: 'Proteção & Chaveamento' },
  ACIONAMENTO_CONTROLE: { bg: 'rgba(139,92,246,.15)', color: '#8b5cf6', label: 'Acionamento & Controle' },
  TRANSFORMADORES:      { bg: 'rgba(6,182,212,.15)',  color: '#06b6d4', label: 'Transformadores' },
  AUTOMACAO_MEDICAO:    { bg: 'rgba(16,185,129,.15)', color: '#10b981', label: 'Automação & Medição' },
  INFRAESTRUTURA:       { bg: 'rgba(100,116,139,.15)',color: '#64748b', label: 'Infraestrutura' },
};

// Subtipos por categoria
const SUBTIPOS = {
  DISJUNTOR:        ['Termomagnético', 'Caixa Moldada', 'Motor', 'NEMA'],
  MINI_DISJUNTOR:   ['Termomagnético'],
  FUSIVEL:          ['Diazed', 'NH', 'Euro Fuse'],
  CHAVE:            ['Rotativa', 'Comutadora', 'Seletora', 'Boia', 'Fim de Curso'],
  PARA_RAIO:        ['Polimérico', 'Cerâmico'],
  CONTATOR:         ['Potência', 'Auxiliar'],
  RELE:             ['Térmico', 'Temporizador', 'Acoplador', 'Falta de Fase', 'Monitor de Tensão', 'Controlador de Temperatura', 'Fotoelétrico', 'URP'],
  CONTATO_AUXILIAR: ['Bloco Instantâneo', 'Bloco Temporizador'],
  COMANDO_ELETRICO: ['Botão de Pulso', 'Botoeira de Comando', 'LED/Sinaleiro'],
  SOFTSTARTER:      ['Padrão'],
  TC:               ['Bipartido', 'Fechado'],
  TT:               ['Distribuição', 'Isolamento'],
  AUTOTRANSFORMADOR:['Padrão'],
  INVERSOR_FREQUENCIA:['Monofásico', 'Trifásico'],
  REGULADOR:        ['AVR (Tensão)', 'Governador (Velocidade)'],
  CLP_IHM:          ['CLP', 'IHM', 'Módulo de Expansão'],
  USCA:             ['Singelo', 'Paralelismo', 'Monitoramento'],
  INSTRUMENTO_SENSOR:['Amperímetro', 'Voltímetro', 'Multímetro', 'Pirômetro', 'Transdutor de Potência', 'Sensor de Temperatura', 'Contador', 'Horômetro', 'Pressostato', 'Termostato'],
  CAPACITOR:        ['Célula Capacitiva (Correção FP)', 'Eletrolítico'],
  ILUMINACAO:       ['Lâmpada Vapor de Sódio', 'Lâmpada Fluorescente', 'Reator'],
  CONECTIVIDADE:    ['Tomada Industrial', 'Suporte/Borne Terminal', 'Barra de Aterramento'],
  FERRAMENTAL_ATUADOR:['Ferramenta Elétrica', 'Atuador Solenóide', 'Solenóide de Parada', 'Caixa Metálica/Painel'],
  FIXADOR_FERRAGEM: ['Parafuso', 'Porca', 'Arruela', 'Bucha', 'Barra Roscada'],
  CONDUTOR:         ['Cabo Flexível', 'Cabo Rígido', 'Fio'],
  INFRA_ACONDICIONAMENTO:['Eletroduto', 'Eletrocalha', 'Condulete', 'Unidute', 'Caixa CM/ZC', 'Suporte Vertical', 'Tala Plana', 'Braçadeira'],
  TERMINAL_CONEXAO: ['Olhal', 'Ilhós', 'Conector Tubular', 'Mufla', 'Barramento'],
  DISPOSITIVO_MANOBRA:['Interruptor', 'Tomada Residencial'],
  BATERIA_FONTE:    ['Bateria', 'Fonte DC', 'No-Break', 'Inversor DC/AC'],
  KIT_CONJUNTO:     ['Banco de Capacitores', 'Caixa de Partida', 'Painel Montado'],
};

const ESTADO_INICIAL = {
  // campos base
  descricao: '', categoria: '', fabricante_id: '', modelo_referencia: '',
  quantidade: 1, condicao: 'NOVO', status: 'DISPONIVEL',
  localizacao: 'GARAGEM', localizacao_prateleira: '', observacoes: '',
  // extensão: campos comuns
  subtipo: '',
  // PROTECAO_CHAVEAMENTO
  corrente_nominal_a: '', tensao_nominal_v: '', tensao_nominal_kv: '', tipo_tensao: '', numero_polos: '',
  // ACIONAMENTO_CONTROLE
  tensao_operacao_v: '', corrente_min_a: '', corrente_max_a: '', contatos_na: '', contatos_nf: '',
  // TRANSFORMADORES (placeholder)
  tensao_entrada_v: '', tensao_saida_v: '', potencia_va: '', corrente_saida_a: '',
  // AUTOMACAO_MEDICAO (placeholder)
  tensao_alimentacao_v: '',
  // INFRAESTRUTURA (placeholder)
  tensao_v: '', corrente_a: '',
};

// ─── Componente auxiliar: campo select de subtipo ────────────────────────────
function SubtipoSelect({ categoria, value, onChange }) {
  const opcoes = SUBTIPOS[categoria] || [];
  if (!opcoes.length) return null;
  return (
    <div className="form-field">
      <label htmlFor="subtipo">Subtipo</label>
      <select id="subtipo" value={value} onChange={onChange} name="subtipo" required>
        <option value="">— Selecione —</option>
        {opcoes.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

// ─── Extensão: Proteção & Chaveamento ────────────────────────────────────────
function ExtProtecaoChaveamento({ form, onChange }) {
  return (
    <>
      <div className="form-grid">
        <SubtipoSelect categoria={form.categoria} value={form.subtipo} onChange={onChange} />
        <div className="form-field">
          <label htmlFor="corrente_nominal_a">Corrente Nominal (A)</label>
          <input id="corrente_nominal_a" name="corrente_nominal_a" type="number" step="0.01" min="0"
            placeholder="ex: 32" value={form.corrente_nominal_a} onChange={onChange} />
        </div>
        <div className="form-field">
          <label htmlFor="tensao_nominal_v">Tensão Nominal (V)</label>
          <input id="tensao_nominal_v" name="tensao_nominal_v" type="number" min="0"
            placeholder="ex: 380" value={form.tensao_nominal_v} onChange={onChange} />
        </div>
        <div className="form-field">
          <label htmlFor="tipo_tensao">Tipo de Tensão</label>
          <select id="tipo_tensao" name="tipo_tensao" value={form.tipo_tensao} onChange={onChange}>
            <option value="">—</option>
            <option value="AC">AC</option>
            <option value="DC">DC</option>
            <option value="AC_DC">AC/DC</option>
          </select>
        </div>
        {/* Polos: apenas para DISJUNTOR e MINI_DISJUNTOR */}
        {['DISJUNTOR','MINI_DISJUNTOR'].includes(form.categoria) && (
          <div className="form-field">
            <label htmlFor="numero_polos">Número de Polos</label>
            <select id="numero_polos" name="numero_polos" value={form.numero_polos} onChange={onChange}>
              <option value="">—</option>
              <option value="MONOPOLAR">Monopolar</option>
              <option value="BIPOLAR">Bipolar</option>
              <option value="TRIPOLAR">Tripolar</option>
              <option value="TETRAPOLAR">Tetrapolar</option>
            </select>
          </div>
        )}
        {/* Tensão kV: PARA_RAIO e FUSIVEL */}
        {['PARA_RAIO','FUSIVEL'].includes(form.categoria) && (
          <div className="form-field">
            <label htmlFor="tensao_nominal_kv">Tensão Nominal (kV)</label>
            <input id="tensao_nominal_kv" name="tensao_nominal_kv" type="number" step="0.001" min="0"
              placeholder="ex: 12.7" value={form.tensao_nominal_kv} onChange={onChange} />
          </div>
        )}
      </div>
    </>
  );
}

// ─── Extensão: Acionamento & Controle ────────────────────────────────────────
function ExtAcionamentoControle({ form, onChange }) {
  const showContatos = ['CONTATOR','RELE','CONTATO_AUXILIAR','COMANDO_ELETRICO'].includes(form.categoria);
  const showCorrenteRange = ['RELE','CONTATO_AUXILIAR'].includes(form.categoria);
  const showCorrenteNominal = ['CONTATOR','SOFTSTARTER'].includes(form.categoria);

  return (
    <>
      <div className="form-grid">
        <SubtipoSelect categoria={form.categoria} value={form.subtipo} onChange={onChange} />
        <div className="form-field">
          <label htmlFor="tensao_operacao_v">Tensão de Operação (V)</label>
          <input id="tensao_operacao_v" name="tensao_operacao_v" type="number" min="0"
            placeholder="ex: 220" value={form.tensao_operacao_v} onChange={onChange} />
        </div>
        <div className="form-field">
          <label htmlFor="tipo_tensao_ac">Tipo de Tensão</label>
          <select id="tipo_tensao_ac" name="tipo_tensao" value={form.tipo_tensao} onChange={onChange}>
            <option value="">—</option>
            <option value="AC">AC</option>
            <option value="DC">DC</option>
            <option value="AC_DC">AC/DC</option>
          </select>
        </div>
        {showCorrenteRange && (
          <>
            <div className="form-field">
              <label htmlFor="corrente_min_a">Corrente Mínima (A)</label>
              <input id="corrente_min_a" name="corrente_min_a" type="number" step="0.01" min="0"
                placeholder="ex: 0.63" value={form.corrente_min_a} onChange={onChange} />
            </div>
            <div className="form-field">
              <label htmlFor="corrente_max_a">Corrente Máxima (A)</label>
              <input id="corrente_max_a" name="corrente_max_a" type="number" step="0.01" min="0"
                placeholder="ex: 10" value={form.corrente_max_a} onChange={onChange} />
            </div>
          </>
        )}
        {showCorrenteNominal && (
          <div className="form-field">
            <label htmlFor="corrente_nominal_a_ac">Corrente Nominal (A)</label>
            <input id="corrente_nominal_a_ac" name="corrente_nominal_a" type="number" step="0.01" min="0"
              placeholder="ex: 25" value={form.corrente_nominal_a} onChange={onChange} />
          </div>
        )}
        {showContatos && (
          <>
            <div className="form-field">
              <label htmlFor="contatos_na">Contatos NA</label>
              <input id="contatos_na" name="contatos_na" type="number" min="0" step="1"
                placeholder="0" value={form.contatos_na} onChange={onChange} />
            </div>
            <div className="form-field">
              <label htmlFor="contatos_nf">Contatos NF</label>
              <input id="contatos_nf" name="contatos_nf" type="number" min="0" step="1"
                placeholder="0" value={form.contatos_nf} onChange={onChange} />
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── Extensão placeholder (outros 3 grupos) ───────────────────────────────────
function ExtPlaceholder({ grupo, form, onChange }) {
  const labels = {
    TRANSFORMADORES:   { label: 'Subtipo do Transformador', tensaoLabel: 'Tensão Entrada (V)', tensaoKey: 'tensao_entrada_v' },
    AUTOMACAO_MEDICAO: { label: 'Subtipo do Instrumento',   tensaoLabel: 'Tensão Alimentação (V)', tensaoKey: 'tensao_alimentacao_v' },
    INFRAESTRUTURA:    { label: 'Subtipo',                  tensaoLabel: 'Tensão (V)', tensaoKey: 'tensao_v' },
  };
  const cfg = labels[grupo];
  return (
    <div className="form-grid">
      <SubtipoSelect categoria={form.categoria} value={form.subtipo} onChange={onChange} />
      <div className="form-field">
        <label htmlFor={`ext_tensao_${grupo}`}>{cfg.tensaoLabel}</label>
        <input id={`ext_tensao_${grupo}`} name={cfg.tensaoKey} type="number" min="0"
          placeholder="—" value={form[cfg.tensaoKey]} onChange={onChange} />
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ItemForm({ onItemSalvo }) {
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [fabricantes, setFabricantes] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState(null); // { tipo: 'success'|'error', msg: string }

  // Carrega lista de fabricantes no mount
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
      // Ao mudar categoria, limpar campos de extensão
      if (name === 'categoria') {
        return { ...ESTADO_INICIAL, ...prev, categoria: value, subtipo: '' };
      }
      return { ...prev, [name]: value };
    });
    // Limpa feedback ao editar
    if (feedback) setFeedback(null);
  };

  const handleReset = () => {
    setForm(ESTADO_INICIAL);
    setFeedback(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setEnviando(true);
    setFeedback(null);

    // Monta payload — valores vazios viram null (omitidos pela procedure)
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      const val = typeof v === 'string' ? v.trim() : v;
      if (val !== '' && val !== null && val !== undefined) {
        payload[k] = val;
      }
    });
    // fabricante_id deve ser número
    if (payload.fabricante_id) payload.fabricante_id = Number(payload.fabricante_id);
    // quantidade como número
    if (payload.quantidade) payload.quantidade = Number(payload.quantidade);

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
      setFeedback({ tipo: 'success', msg: `Item cadastrado com sucesso! ID: ${resultado.id}` });
      setForm(ESTADO_INICIAL);
      if (onItemSalvo) onItemSalvo();
    } catch (err) {
      setFeedback({ tipo: 'error', msg: err.message });
    } finally {
      setEnviando(false);
    }
  };

  // Determina o grupo funcional da categoria selecionada
  const catInfo = CATEGORIAS.find(c => c.value === form.categoria);
  const grupo = catInfo?.grupo || null;
  const grupoCor = grupo ? GRUPO_COR[grupo] : null;

  return (
    <div className="item-form-wrapper">
      <div className="item-form-header">
        <h2>Cadastrar Item de Estoque</h2>
        <p>Preencha os campos abaixo. Campos técnicos específicos aparecem ao selecionar a categoria.</p>
      </div>

      {feedback && (
        <div className={`form-feedback ${feedback.tipo}`}>
          {feedback.tipo === 'success' ? '✅' : '⚠️'} {feedback.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>

        {/* ── Seção 1: Classificação ── */}
        <div className="form-section">
          <div className="form-section-title">Classificação</div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="categoria">Categoria *</label>
              <select id="categoria" name="categoria" value={form.categoria} onChange={handleChange} required>
                {CATEGORIAS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {grupoCor && (
                <span className="cat-info-pill"
                  style={{ background: grupoCor.bg, color: grupoCor.color }}>
                  {grupoCor.label}
                </span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="fabricante_id">Fabricante</label>
              <select id="fabricante_id" name="fabricante_id" value={form.fabricante_id} onChange={handleChange}>
                <option value="">— Sem fabricante / Genérico —</option>
                {fabricantes.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}{f.apelido && f.apelido !== f.nome ? ` (${f.apelido})` : ''}</option>
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

        {/* ── Seção 2: Identificação e Localização ── */}
        <div className="form-section">
          <div className="form-section-title">Identificação e Localização</div>
          <div className="form-grid">
            <div className="form-field full-width">
              <label htmlFor="descricao">Descrição Técnica *</label>
              <textarea id="descricao" name="descricao" required
                placeholder="ex: Disjuntor Motor Tripolar 380V 7,5CV"
                value={form.descricao} onChange={handleChange} />
            </div>
            <div className="form-field">
              <label htmlFor="localizacao">Depósito *</label>
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

        {/* ── Seção 3: Controle de Estoque ── */}
        <div className="form-section">
          <div className="form-section-title">Controle de Estoque</div>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="quantidade">Quantidade *</label>
              <input id="quantidade" name="quantidade" type="number" min="0" required
                value={form.quantidade} onChange={handleChange} />
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

        {/* ── Seção 4 (condicional): Especificações Técnicas da Extensão ── */}
        {grupo && (
          <div className="form-section extension">
            <div className="form-section-title">
              Especificações Técnicas — {grupoCor?.label}
            </div>

            {/* PROTECAO_CHAVEAMENTO — implementado */}
            {grupo === 'PROTECAO_CHAVEAMENTO' && (
              <ExtProtecaoChaveamento form={form} onChange={handleChange} />
            )}

            {/* ACIONAMENTO_CONTROLE — implementado */}
            {grupo === 'ACIONAMENTO_CONTROLE' && (
              <ExtAcionamentoControle form={form} onChange={handleChange} />
            )}

            {/* TRANSFORMADORES, AUTOMACAO_MEDICAO, INFRAESTRUTURA — placeholder v1 */}
            {['TRANSFORMADORES','AUTOMACAO_MEDICAO','INFRAESTRUTURA'].includes(grupo) && (
              <ExtPlaceholder grupo={grupo} form={form} onChange={handleChange} />
            )}
          </div>
        )}

        {/* ── Ações ── */}
        <div className="form-actions">
          <button type="button" className="btn-reset" onClick={handleReset}>
            Limpar
          </button>
          <button type="submit" className="btn-submit" disabled={enviando || !form.categoria || !form.descricao}>
            {enviando ? 'Salvando…' : '💾 Salvar Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
