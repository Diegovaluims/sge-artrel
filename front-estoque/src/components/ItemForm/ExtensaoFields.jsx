// ExtensaoFields.jsx
// Subcomponentes de campos técnicos por grupo funcional — v3 (Sprint 3.5).
// Arquitetura:
//   1. ATIVOS_POR_GRUPO  — mapa grupo -> ativos disponíveis no dropdown
//   2. GRUPO_COR         — paleta de cores por grupo
//   3. ESTADO_SPECS      — flat state de todos os campos de especificação
//   4. CAMPOS_SPECS      — Set de nomes que vão exclusivamente para JSONB
//   5. montarEspecificacoes(tipoAtivo, form) — serializa para JSONB
//   6. CorrenteInput     — select de tipo + input(s) numérico(s) com range opcional
//   7. Um componente Ext* por grupo, com dropdown de tipo_ativo + campos condicionais
//
// Convenção de prefixos de state:
//   ce_  — campos elétricos comuns a todos os ativos
//   dj_  — Disjuntor
//   md_  — Mini-Disjuntor
//   rl_  — Relé
//   fus_ — Fusível
//   chv_ — Chave
//   pr_  — Pará-Raio
//   cb_  — Cabo
//   ct_  — Contator
//   ca_  — Contatos Auxiliares

// ─── 1. Mapa de grupos → ativos ───────────────────────────────────────────────

export const ATIVOS_POR_GRUPO = {
  PROTECAO_CHAVEAMENTO: [
    { value: 'DISJUNTOR',         label: 'Disjuntor' },
    { value: 'MINI_DISJUNTOR',    label: 'Mini-Disjuntor' },
    { value: 'RELE',              label: 'Relé' },
    { value: 'FUSIVEL',           label: 'Fusível' },
    { value: 'CHAVE',             label: 'Chave' },
    { value: 'PARA_RAIO',         label: 'Pára-Raio' },
    { value: 'BARRA_ATERRAMENTO', label: 'Barra de Aterramento' },
  ],
  CONTATORES: [
    { value: 'CONTATOR', label: 'Contator' },
  ],
  CONDUTORES: [
    { value: 'CABO',        label: 'Cabo' },
    { value: 'BARRAMENTO',  label: 'Barramento' },
    { value: 'BARRA_CHATA', label: 'Barra Chata' },
  ],
  DISPOSITIVOS_PARTIDA: [
    { value: 'SOFTSTARTER',        label: 'Softstarter' },
    { value: 'INVERSOR',           label: 'Inversor' },
    { value: 'CHAVE_COMPENSADORA', label: 'Chave Compensadora' },
  ],
  PAINEL_AUTOMACAO: [
    { value: 'CAIXA',  label: 'Caixa' },
    { value: 'PAINEL', label: 'Painel' },
  ],
  ACESSORIOS: [
    { value: 'CONTATOS_AUXILIARES', label: 'Contatos Auxiliares' },
  ],
  INFRAESTRUTURA_FERRAGEM: [
    { value: 'PARAFUSO', label: 'Parafuso' },
    { value: 'PORCA',    label: 'Porca' },
    { value: 'ARRUELA',  label: 'Arruela' },
    { value: 'TERMINAL', label: 'Terminal' },
  ],
  TRANSFORMADORES: [
    { value: 'TRANSFORMADOR_TENSAO',   label: 'Transformador de Tensão' },
    { value: 'TRANSFORMADOR_CORRENTE', label: 'Transformador de Corrente' },
    { value: 'AUTOTRANSFORMADOR',      label: 'Autotransformador' },
  ],
};

// ─── 2. Paleta de cores por grupo ──────────────────────────────────────────────

export const GRUPO_COR = {
  PROTECAO_CHAVEAMENTO:    { bg: 'rgba(249,115,22,.15)',  color: '#f97316', label: 'Proteção e Chaveamento' },
  CONTATORES:              { bg: 'rgba(236,72,153,.15)',  color: '#ec4899', label: 'Contatores' },
  CONDUTORES:              { bg: 'rgba(234,179,8,.15)',   color: '#ca8a04', label: 'Condutores' },
  DISPOSITIVOS_PARTIDA:    { bg: 'rgba(16,185,129,.15)',  color: '#10b981', label: 'Dispositivos de Partida' },
  PAINEL_AUTOMACAO:        { bg: 'rgba(139,92,246,.15)',  color: '#8b5cf6', label: 'Painéis e Automação' },
  ACESSORIOS:              { bg: 'rgba(113,113,122,.15)', color: '#71717a', label: 'Acessórios' },
  INFRAESTRUTURA_FERRAGEM: { bg: 'rgba(100,116,139,.15)', color: '#64748b', label: 'Infraestrutura e Ferragem' },
  TRANSFORMADORES:         { bg: 'rgba(6,182,212,.15)',   color: '#06b6d4', label: 'Transformadores' },
};

// ─── 3. Estado flat de todos os campos de especificação ────────────────────────

export const ESTADO_SPECS = {
  // Campos elétricos comuns
  ce_tipo_corrente: '', ce_corrente_min_a: '', ce_corrente_cc: '', ce_tensao_isolamento: '',
  // Disjuntor
  dj_tipo: '', dj_polos: '', dj_tensao_v: '', dj_corrente_a: '', dj_potencia_kw: '',
  // Mini-Disjuntor
  md_corrente_a: '', md_curva: '', md_polos: '', md_tensao_v: '',
  // Relé
  rl_tipo: '', rl_tensao_v: '', rl_corrente_a: '',
  rl_contatos_na: '', rl_contatos_nf: '', rl_faixa_tempo_s: '',
  // Fusível
  fus_tipo: '', fus_tensao_v: '', fus_corrente_a: '',
  // Chave
  chv_tipo: '', chv_tensao_v: '', chv_corrente_a: '',
  // Pára-Raio
  pr_material: '', pr_tensao_v: '', pr_corrente_ka: '',
  // Cabo (cb_tensao_v mantido para não quebrar dados legados, não exibido no form)
  cb_material: '', cb_bitola_mm2: '', cb_tensao_v: '', cb_isolamento: '',
  // Contator
  ct_tipo: '', ct_polos: '', ct_tensao_v: '', ct_corrente_a: '', ct_contatos_na: '', ct_contatos_nf: '',
  // Contatos Auxiliares
  ca_contatos_na: '', ca_contatos_nf: '', ca_corrente_a: '',
};
// ─── 4. Set de campos que vão exclusivamente para JSONB ───────────────────────

export const CAMPOS_SPECS = new Set(Object.keys(ESTADO_SPECS));

// ─── 5. Serialização para JSONB ───────────────────────────────────────────────

export function montarEspecificacoes(tipoAtivo, form) {
  const n = (v) => (v !== '' && v !== null && v !== undefined ? Number(v) : undefined);
  const s = (v) => (v !== '' && v !== null && v !== undefined ? String(v).trim() : undefined);
  const add = (obj, key, val) => { if (val !== undefined && val !== '') obj[key] = val; };

  // Campos elétricos comuns — injetados em todos os ativos elétricos
  const addCamposEletricos = (spec) => {
    add(spec, 'tipo_corrente',     s(form.ce_tipo_corrente));
    add(spec, 'corrente_min_a',    n(form.ce_corrente_min_a));
    add(spec, 'corrente_cc',       n(form.ce_corrente_cc));
    add(spec, 'tensao_isolamento', n(form.ce_tensao_isolamento));
  };

  const spec = {};

  switch (tipoAtivo) {
    case 'DISJUNTOR':
      add(spec, 'tipo',        s(form.dj_tipo));
      add(spec, 'polos',       s(form.dj_polos));
      add(spec, 'potencia_kw', n(form.dj_potencia_kw));
      add(spec, 'tensao_v',    n(form.dj_tensao_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',  n(form.dj_corrente_a));
      break;

    case 'MINI_DISJUNTOR':
      add(spec, 'curva',    s(form.md_curva));
      add(spec, 'polos',    s(form.md_polos));
      add(spec, 'tensao_v', n(form.md_tensao_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a', n(form.md_corrente_a));
      break;

    case 'RELE':
      add(spec, 'tipo',          s(form.rl_tipo));
      add(spec, 'contatos_na',   n(form.rl_contatos_na));
      add(spec, 'contatos_nf',   n(form.rl_contatos_nf));
      add(spec, 'faixa_tempo_s', n(form.rl_faixa_tempo_s));
      add(spec, 'tensao_v',      n(form.rl_tensao_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',    n(form.rl_corrente_a));
      break;

    case 'FUSIVEL':
      add(spec, 'tipo',     s(form.fus_tipo));
      add(spec, 'tensao_v', n(form.fus_tensao_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a', n(form.fus_corrente_a));
      break;

    case 'CHAVE':
      add(spec, 'tipo',     s(form.chv_tipo));
      add(spec, 'tensao_v', n(form.chv_tensao_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a', n(form.chv_corrente_a));
      break;

    case 'PARA_RAIO':
      add(spec, 'material', s(form.pr_material));
      add(spec, 'tensao_v', n(form.pr_tensao_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_ka', n(form.pr_corrente_ka));
      break;

    case 'CABO':
      add(spec, 'material',   s(form.cb_material));
      add(spec, 'bitola_mm2', n(form.cb_bitola_mm2));
      add(spec, 'isolamento', s(form.cb_isolamento));
      // cb_tensao_v intencionalmente omitido — tensão relevante é Vi/Ui
      addCamposEletricos(spec);
      break;

    case 'CONTATOR':
      add(spec, 'tipo',        s(form.ct_tipo));
      add(spec, 'polos',       n(form.ct_polos));
      add(spec, 'contatos_na', n(form.ct_contatos_na));
      add(spec, 'contatos_nf', n(form.ct_contatos_nf));
      add(spec, 'tensao_v',    n(form.ct_tensao_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',  n(form.ct_corrente_a));
      break;

    case 'CONTATOS_AUXILIARES':
      add(spec, 'contatos_na', n(form.ca_contatos_na));
      add(spec, 'contatos_nf', n(form.ca_contatos_nf));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',  n(form.ca_corrente_a));
      break;

    // Ativos sem campos definidos ainda: JSONB vazio
    default:
      break;
  }

  return Object.keys(spec).length > 0 ? spec : null;
}

// ─── 6. Componente auxiliar: CorrenteInput ────────────────────────────────────
// select de tipo (AC / DC / AC/DC) + um ou dois inputs numéricos.
// Quando minName for passado → modo range: renderiza Mín. e Máx.
// O select e os inputs emitem eventos nativos independentes via onChange.

export function CorrenteInput({
  id,
  name,
  value,
  minName,
  minValue,
  tipoName = 'ce_tipo_corrente',
  tipoValue = '',
  onChange,
  label = 'Corrente (A)',
}) {
  const temRange = !!minName;
  return (
    <div className="form-field corrente-input-group">
      <label htmlFor={id}>{label}</label>
      <div className="corrente-input-row">
        <select
          className="corrente-select"
          name={tipoName}
          value={tipoValue}
          onChange={onChange}
          aria-label="Tipo de corrente"
        >
          <option value="">Tipo...</option>
          <option value="AC">AC</option>
          <option value="DC">DC</option>
          <option value="AC/DC">AC/DC</option>
        </select>
        {temRange && (
          <input
            id={`${id}_min`}
            name={minName}
            type="number"
            step="0.01"
            min="0"
            placeholder="Mín. (A)"
            value={minValue}
            onChange={onChange}
          />
        )}
        <input
          id={id}
          name={name}
          type="number"
          step="0.01"
          min="0"
          placeholder={temRange ? 'Máx. (A)' : 'Valor (A)'}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
// ─── Ext: Proteção e Chaveamento ──────────────────────────────────────────────

export function ExtProtecaoChaveamento({ form, onChange }) {
  const tipo = form.tipo_ativo;

  return (
    <>
      {/* Dropdown de tipo — sempre o primeiro campo */}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO.PROTECAO_CHAVEAMENTO.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── DISJUNTOR ── */}
      {tipo === 'DISJUNTOR' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="dj_tipo">Tipo de Disjuntor</label>
            <select id="dj_tipo" name="dj_tipo" value={form.dj_tipo} onChange={onChange}>
              <option value="">—</option>
              <option>Termomagnético</option>
              <option>Caixa Moldada</option>
              <option>Motor</option>
              <option>NEMA</option>
              <option>Aberto</option>
              <option>DDR</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="dj_polos">Polos</label>
            <select id="dj_polos" name="dj_polos" value={form.dj_polos} onChange={onChange}>
              <option value="">—</option>
              <option>Monopolar</option>
              <option>Bipolar</option>
              <option>Tripolar</option>
              <option>Tetrapolar</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="dj_potencia_kw">Potência (kW)</label>
            <input id="dj_potencia_kw" name="dj_potencia_kw" type="number" step="0.1" min="0"
              placeholder="ex: 5.5" value={form.dj_potencia_kw} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="dj_tensao_v">Tensão (V)</label>
            <input id="dj_tensao_v" name="dj_tensao_v" type="number" min="0"
              placeholder="ex: 380" value={form.dj_tensao_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ce_tensao_isolamento">Tensão de Isolamento — Vi/Ui (V)</label>
            <input id="ce_tensao_isolamento" name="ce_tensao_isolamento" type="number" min="0"
              placeholder="ex: 690" value={form.ce_tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput id="dj_corrente_a" name="dj_corrente_a"
            value={form.dj_corrente_a} tipoValue={form.ce_tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="ce_corrente_cc">Corrente de Curto-Circuito — Icc (kA)</label>
            <input id="ce_corrente_cc" name="ce_corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.ce_corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── MINI_DISJUNTOR ── */}
      {tipo === 'MINI_DISJUNTOR' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="md_curva">Curva de Disparo</label>
            <select id="md_curva" name="md_curva" value={form.md_curva} onChange={onChange}>
              <option value="">—</option>
              <option>B</option>
              <option>C</option>
              <option>D</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="md_polos">Polos</label>
            <select id="md_polos" name="md_polos" value={form.md_polos} onChange={onChange}>
              <option value="">—</option>
              <option>Monopolar</option>
              <option>Bipolar</option>
              <option>Tripolar</option>
              <option>Tetrapolar</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="md_tensao_v">Tensão (V)</label>
            <input id="md_tensao_v" name="md_tensao_v" type="number" min="0"
              placeholder="ex: 230" value={form.md_tensao_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ce_tensao_isolamento">Tensão de Isolamento — Vi/Ui (V)</label>
            <input id="ce_tensao_isolamento" name="ce_tensao_isolamento" type="number" min="0"
              placeholder="ex: 440" value={form.ce_tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput id="md_corrente_a" name="md_corrente_a"
            value={form.md_corrente_a} tipoValue={form.ce_tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="ce_corrente_cc">Corrente de Curto-Circuito — Icc (kA)</label>
            <input id="ce_corrente_cc" name="ce_corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 6" value={form.ce_corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── RELE ── */}
      {tipo === 'RELE' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="rl_tipo">Tipo de Relé</label>
            <select id="rl_tipo" name="rl_tipo" value={form.rl_tipo} onChange={onChange}>
              <option value="">—</option>
              <option>Térmico</option>
              <option>Temporizador</option>
              <option>Falta de Fase</option>
              <option>Monitor de Tensão</option>
              <option>Controlador de Temperatura</option>
              <option>Fotoelétrico</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="rl_contatos_na">Contatos NA</label>
            <input id="rl_contatos_na" name="rl_contatos_na" type="number" min="0" step="1"
              placeholder="0" value={form.rl_contatos_na} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="rl_contatos_nf">Contatos NF</label>
            <input id="rl_contatos_nf" name="rl_contatos_nf" type="number" min="0" step="1"
              placeholder="0" value={form.rl_contatos_nf} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="rl_faixa_tempo_s">Faixa de Tempo (s)</label>
            <input id="rl_faixa_tempo_s" name="rl_faixa_tempo_s" type="number" step="0.1" min="0"
              placeholder="ex: 30" value={form.rl_faixa_tempo_s} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="rl_tensao_v">Tensão de Bobina (V)</label>
            <input id="rl_tensao_v" name="rl_tensao_v" type="number" min="0"
              placeholder="ex: 220" value={form.rl_tensao_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ce_tensao_isolamento">Tensão de Isolamento — Vi/Ui (V)</label>
            <input id="ce_tensao_isolamento" name="ce_tensao_isolamento" type="number" min="0"
              placeholder="ex: 690" value={form.ce_tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput
            id="rl_corrente_a"          name="rl_corrente_a"          value={form.rl_corrente_a}
            minName="ce_corrente_min_a" minValue={form.ce_corrente_min_a}
            tipoValue={form.ce_tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="ce_corrente_cc">Corrente de Curto-Circuito — Icc (kA)</label>
            <input id="ce_corrente_cc" name="ce_corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.ce_corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── FUSIVEL ── */}
      {tipo === 'FUSIVEL' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="fus_tipo">Tipo de Fusível</label>
            <select id="fus_tipo" name="fus_tipo" value={form.fus_tipo} onChange={onChange}>
              <option value="">—</option>
              <option>Diazed</option>
              <option>NH</option>
              <option>Euro Fuse</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="fus_tensao_v">Tensão (V)</label>
            <input id="fus_tensao_v" name="fus_tensao_v" type="number" min="0"
              placeholder="ex: 500" value={form.fus_tensao_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ce_tensao_isolamento">Tensão de Isolamento — Vi/Ui (V)</label>
            <input id="ce_tensao_isolamento" name="ce_tensao_isolamento" type="number" min="0"
              placeholder="ex: 690" value={form.ce_tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput id="fus_corrente_a" name="fus_corrente_a"
            value={form.fus_corrente_a} tipoValue={form.ce_tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="ce_corrente_cc">Corrente de Curto-Circuito — Icc (kA)</label>
            <input id="ce_corrente_cc" name="ce_corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.ce_corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── CHAVE ── */}
      {tipo === 'CHAVE' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="chv_tipo">Tipo de Chave</label>
            <select id="chv_tipo" name="chv_tipo" value={form.chv_tipo} onChange={onChange}>
              <option value="">—</option>
              <option>Seccionadora</option>
              <option>Comutadora</option>
              <option>Seletora</option>
              <option>Boia</option>
              <option>Fim de Curso</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="chv_tensao_v">Tensão (V)</label>
            <input id="chv_tensao_v" name="chv_tensao_v" type="number" min="0"
              placeholder="ex: 380" value={form.chv_tensao_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ce_tensao_isolamento">Tensão de Isolamento — Vi/Ui (V)</label>
            <input id="ce_tensao_isolamento" name="ce_tensao_isolamento" type="number" min="0"
              placeholder="ex: 690" value={form.ce_tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput id="chv_corrente_a" name="chv_corrente_a"
            value={form.chv_corrente_a} tipoValue={form.ce_tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="ce_corrente_cc">Corrente de Curto-Circuito — Icc (kA)</label>
            <input id="ce_corrente_cc" name="ce_corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.ce_corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── PARA_RAIO ── */}
      {tipo === 'PARA_RAIO' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="pr_material">Material</label>
            <select id="pr_material" name="pr_material" value={form.pr_material} onChange={onChange}>
              <option value="">—</option>
              <option>Polimérico</option>
              <option>Cerâmico</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="pr_tensao_v">Tensão (V)</label>
            <input id="pr_tensao_v" name="pr_tensao_v" type="number" min="0"
              placeholder="ex: 12700" value={form.pr_tensao_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ce_tensao_isolamento">Tensão de Isolamento — Vi/Ui (V)</label>
            <input id="ce_tensao_isolamento" name="ce_tensao_isolamento" type="number" min="0"
              placeholder="ex: 690" value={form.ce_tensao_isolamento} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="pr_corrente_ka">Corrente de Descarga (kA)</label>
            <input id="pr_corrente_ka" name="pr_corrente_ka" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.pr_corrente_ka} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ce_corrente_cc">Corrente de Curto-Circuito — Icc (kA)</label>
            <input id="ce_corrente_cc" name="ce_corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.ce_corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {tipo === 'BARRA_ATERRAMENTO' && (
        <p className="specs-placeholder">Campos a definir — especificações em texto livre nas Observações.</p>
      )}
    </>
  );
}
// ─── Ext: Contatores ──────────────────────────────────────────────────────────

export function ExtContatores({ form, onChange }) {
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO.CONTATORES.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {tipo === 'CONTATOR' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="ct_tipo">Classe (IEC)</label>
            <select id="ct_tipo" name="ct_tipo" value={form.ct_tipo} onChange={onChange}>
              <option value="">—</option>
              <option>AC-1</option>
              <option>AC-2</option>
              <option>AC-3</option>
              <option>AC-4</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="ct_polos">Polos</label>
            <input id="ct_polos" name="ct_polos" type="number" min="1" step="1"
              placeholder="ex: 3" value={form.ct_polos} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ct_contatos_na">Contatos NA</label>
            <input id="ct_contatos_na" name="ct_contatos_na" type="number" min="0" step="1"
              placeholder="0" value={form.ct_contatos_na} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ct_contatos_nf">Contatos NF</label>
            <input id="ct_contatos_nf" name="ct_contatos_nf" type="number" min="0" step="1"
              placeholder="0" value={form.ct_contatos_nf} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ct_tensao_v">Tensão de Funcionamento (V)</label>
            <input id="ct_tensao_v" name="ct_tensao_v" type="number" min="0"
              placeholder="ex: 380" value={form.ct_tensao_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ce_tensao_isolamento">Tensão de Isolamento — Vi/Ui (V)</label>
            <input id="ce_tensao_isolamento" name="ce_tensao_isolamento" type="number" min="0"
              placeholder="ex: 690" value={form.ce_tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput
            id="ct_corrente_a"          name="ct_corrente_a"          value={form.ct_corrente_a}
            minName="ce_corrente_min_a" minValue={form.ce_corrente_min_a}
            tipoValue={form.ce_tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="ce_corrente_cc">Corrente de Curto-Circuito — Icc (kA)</label>
            <input id="ce_corrente_cc" name="ce_corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.ce_corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Ext: Condutores ──────────────────────────────────────────────────────────

export function ExtCondutores({ form, onChange }) {
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO.CONDUTORES.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {tipo === 'CABO' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="cb_material">Material</label>
            <select id="cb_material" name="cb_material" value={form.cb_material} onChange={onChange}>
              <option value="">—</option>
              <option>Cobre</option>
              <option>Alumínio</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="cb_bitola_mm2">Bitola (mm²)</label>
            <input id="cb_bitola_mm2" name="cb_bitola_mm2" type="number" step="0.5" min="0"
              placeholder="ex: 16.0" value={form.cb_bitola_mm2} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="cb_isolamento">Isolamento</label>
            <select id="cb_isolamento" name="cb_isolamento" value={form.cb_isolamento} onChange={onChange}>
              <option value="">—</option>
              <option>PVC 450/750V</option>
              <option>PVC 0.6/1kV</option>
              <option>XLPE</option>
              <option>Borracha</option>
            </select>
          </div>
          {/* Sem tensao nominal — somente Vi/Ui e semanticamente correto para cabos */}
          <div className="form-field">
            <label htmlFor="ce_tensao_isolamento">Tensão de Isolamento — Vi/Ui (V)</label>
            <input id="ce_tensao_isolamento" name="ce_tensao_isolamento" type="number" min="0"
              placeholder="ex: 1000" value={form.ce_tensao_isolamento} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ce_corrente_cc">Corrente de Curto-Circuito — Icc (kA)</label>
            <input id="ce_corrente_cc" name="ce_corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.ce_corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {tipo === 'BARRAMENTO' && (
        <p className="specs-placeholder">Campos a definir — especificações em texto livre nas Observações.</p>
      )}
    </>
  );
}

// ─── Ext: Dispositivos de Partida ─────────────────────────────────────────────

export function ExtDispositivosPartida({ form, onChange }) {
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO.DISPOSITIVOS_PARTIDA.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>
      {tipo && (
        <p className="specs-placeholder">Campos técnicos a definir — use Observações para detalhes.</p>
      )}
    </>
  );
}

// ─── Ext: Painéis e Automação ─────────────────────────────────────────────────

export function ExtPainelAutomacao({ form, onChange }) {
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO.PAINEL_AUTOMACAO.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>
      {tipo && (
        <p className="specs-placeholder">Campos técnicos a definir — use Observações para detalhes.</p>
      )}
    </>
  );
}

// ─── Ext: Acessórios ──────────────────────────────────────────────────────────

export function ExtAcessorios({ form, onChange }) {
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO.ACESSORIOS.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── CONTATOS_AUXILIARES ── */}
      {tipo === 'CONTATOS_AUXILIARES' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="ca_contatos_na">Contatos NA</label>
            <input id="ca_contatos_na" name="ca_contatos_na" type="number" min="0" step="1"
              placeholder="0" value={form.ca_contatos_na} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="ca_contatos_nf">Contatos NF</label>
            <input id="ca_contatos_nf" name="ca_contatos_nf" type="number" min="0" step="1"
              placeholder="0" value={form.ca_contatos_nf} onChange={onChange} />
          </div>
          {/* Sem tensao nominal — somente Vi/Ui */}
          <div className="form-field">
            <label htmlFor="ce_tensao_isolamento">Tensão de Isolamento — Vi/Ui (V)</label>
            <input id="ce_tensao_isolamento" name="ce_tensao_isolamento" type="number" min="0"
              placeholder="ex: 690" value={form.ce_tensao_isolamento} onChange={onChange} />
          </div>
          {/* Correntes com range: Min = referencia DC, Max = referencia AC (quando AC/DC) */}
          <CorrenteInput
            id="ca_corrente_a"          name="ca_corrente_a"          value={form.ca_corrente_a}
            minName="ce_corrente_min_a" minValue={form.ce_corrente_min_a}
            tipoValue={form.ce_tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="ce_corrente_cc">Corrente de Curto-Circuito — Icc (kA)</label>
            <input id="ce_corrente_cc" name="ce_corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.ce_corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Ext: Infraestrutura e Ferragem ───────────────────────────────────────────

export function ExtInfraestruturaFerragem({ form, onChange }) {
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO.INFRAESTRUTURA_FERRAGEM.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>
      {tipo && (
        <p className="specs-placeholder">Campos técnicos a definir — use Observações para detalhes.</p>
      )}
    </>
  );
}

// ─── Ext: Transformadores ─────────────────────────────────────────────────────

export function ExtTransformadores({ form, onChange }) {
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO.TRANSFORMADORES.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>
      {tipo && (
        <p className="specs-placeholder">Campos técnicos a definir — use Observações para detalhes.</p>
      )}
    </>
  );
}