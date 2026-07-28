// ExtensaoFields.jsx
// Subcomponentes de campos técnicos por grupo funcional — v2.
// Arquitetura:
//   1. ATIVOS_POR_GRUPO  — mapa grupo → ativos disponíveis no dropdown
//   2. GRUPO_COR         — paleta de cores por grupo
//   3. ESTADO_SPECS      — flat state de todos os campos de especificação
//   4. CAMPOS_SPECS      — Set de nomes que vão exclusivamente para JSONB
//   5. montarEspecificacoes(tipoAtivo, form) — serializa para JSONB
//   6. Um componente Ext* por grupo, com dropdown de tipo_ativo + campos condicionais

// ─── 1. Mapa de grupos → ativos ──────────────────────────────────────────────

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
  CONDUTORES: [
    { value: 'CABO',        label: 'Cabo' },
    { value: 'BARRAMENTO',  label: 'Barramento' },
  ],
  PAINEL_AUTOMACAO: [
    { value: 'CAIXA',       label: 'Caixa' },
    { value: 'PAINEL',      label: 'Painel' },
    { value: 'SOFTSTARTER', label: 'Softstarter' },
    { value: 'INVERSOR',    label: 'Inversor' },
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

// ─── 2. Paleta de cores por grupo ─────────────────────────────────────────────

export const GRUPO_COR = {
  PROTECAO_CHAVEAMENTO:    { bg: 'rgba(249,115,22,.15)',  color: '#f97316', label: 'Proteção e Chaveamento' },
  CONDUTORES:              { bg: 'rgba(234,179,8,.15)',   color: '#ca8a04', label: 'Condutores' },
  PAINEL_AUTOMACAO:        { bg: 'rgba(139,92,246,.15)',  color: '#8b5cf6', label: 'Painéis e Automação' },
  INFRAESTRUTURA_FERRAGEM: { bg: 'rgba(100,116,139,.15)', color: '#64748b', label: 'Infraestrutura e Ferragem' },
  TRANSFORMADORES:         { bg: 'rgba(6,182,212,.15)',   color: '#06b6d4', label: 'Transformadores' },
};

// ─── 3. Estado flat de todos os campos de especificação ───────────────────────

export const ESTADO_SPECS = {
  // Disjuntor
  dj_tipo: '', dj_polos: '', dj_tensao_v: '', dj_corrente_a: '', dj_potencia_kw: '',
  // Mini-Disjuntor
  md_corrente_a: '', md_curva: '', md_polos: '',
  // Relé
  rl_tipo: '', rl_corrente_min_a: '', rl_corrente_max_a: '',
  rl_contatos_na: '', rl_contatos_nf: '', rl_faixa_tempo_s: '',
  // Fusível
  fus_tipo: '', fus_corrente_a: '',
  // Chave
  chv_tipo: '', chv_tensao_v: '', chv_corrente_a: '',
  // Pára-Raio
  pr_material: '', pr_tensao_v: '', pr_corrente_ka: '',
  // Cabo
  cb_material: '', cb_bitola_mm2: '', cb_tensao_v: '', cb_isolamento: '',
};

// ─── 4. Set de campos que vão exclusivamente para JSONB ───────────────────────

export const CAMPOS_SPECS = new Set(Object.keys(ESTADO_SPECS));

// ─── 5. Serialização para JSONB ───────────────────────────────────────────────

export function montarEspecificacoes(tipoAtivo, form) {
  const n = (v) => (v !== '' && v !== null && v !== undefined ? Number(v) : undefined);
  const s = (v) => (v !== '' && v !== null && v !== undefined ? String(v).trim() : undefined);
  const add = (obj, key, val) => { if (val !== undefined && val !== '') obj[key] = val; };

  const spec = {};

  switch (tipoAtivo) {
    case 'DISJUNTOR':
      add(spec, 'tipo',        s(form.dj_tipo));
      add(spec, 'polos',       s(form.dj_polos));
      add(spec, 'tensao_v',    n(form.dj_tensao_v));
      add(spec, 'corrente_a',  n(form.dj_corrente_a));
      add(spec, 'potencia_kw', n(form.dj_potencia_kw));
      break;

    case 'MINI_DISJUNTOR':
      add(spec, 'corrente_a', n(form.md_corrente_a));
      add(spec, 'curva',      s(form.md_curva));
      add(spec, 'polos',      s(form.md_polos));
      break;

    case 'RELE':
      add(spec, 'tipo',            s(form.rl_tipo));
      add(spec, 'corrente_min_a',  n(form.rl_corrente_min_a));
      add(spec, 'corrente_max_a',  n(form.rl_corrente_max_a));
      add(spec, 'contatos_na',     n(form.rl_contatos_na));
      add(spec, 'contatos_nf',     n(form.rl_contatos_nf));
      add(spec, 'faixa_tempo_s',   n(form.rl_faixa_tempo_s));
      break;

    case 'FUSIVEL':
      add(spec, 'tipo',       s(form.fus_tipo));
      add(spec, 'corrente_a', n(form.fus_corrente_a));
      break;

    case 'CHAVE':
      add(spec, 'tipo',       s(form.chv_tipo));
      add(spec, 'tensao_v',   n(form.chv_tensao_v));
      add(spec, 'corrente_a', n(form.chv_corrente_a));
      break;

    case 'PARA_RAIO':
      add(spec, 'material',    s(form.pr_material));
      add(spec, 'tensao_v',    n(form.pr_tensao_v));
      add(spec, 'corrente_ka', n(form.pr_corrente_ka));
      break;

    case 'CABO':
      add(spec, 'material',   s(form.cb_material));
      add(spec, 'bitola_mm2', n(form.cb_bitola_mm2));
      add(spec, 'tensao_v',   n(form.cb_tensao_v));
      add(spec, 'isolamento', s(form.cb_isolamento));
      break;

    // Ativos sem campos definidos ainda: JSONB vazio
    default:
      break;
  }

  return Object.keys(spec).length > 0 ? spec : null;
}

// ─── 6. Componente auxiliar: CorrenteInput ────────────────────────────────────
// Combina um select de valores padrão com um input numérico.
// O input é sempre a fonte de verdade. O select serve de atalho.

const CORRENTES_PADRAO = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 630];

export function CorrenteInput({ id, name, value, onChange, label = 'Corrente (A)' }) {
  function handleSelect(e) {
    const v = e.target.value;
    if (v === '') return;
    // Dispara onChange sintético com o nome e valor corretos
    onChange({ target: { name, value: v } });
  }

  return (
    <div className="form-field corrente-input-group">
      <label htmlFor={id}>{label}</label>
      <div className="corrente-input-row">
        <select
          className="corrente-select"
          value={CORRENTES_PADRAO.includes(Number(value)) ? value : ''}
          onChange={handleSelect}
          aria-label={`${label} — valores padrão`}
        >
          <option value="">Padrão…</option>
          {CORRENTES_PADRAO.map(a => (
            <option key={a} value={a}>{a} A</option>
          ))}
        </select>
        <input
          id={id}
          name={name}
          type="number"
          step="0.01"
          min="0"
          placeholder="Valor exato"
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

      {/* Campos condicionais por tipo */}
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
            <label htmlFor="dj_tensao_v">Tensão (V)</label>
            <input id="dj_tensao_v" name="dj_tensao_v" type="number" min="0"
              placeholder="ex: 380" value={form.dj_tensao_v} onChange={onChange} />
          </div>
          <CorrenteInput id="dj_corrente_a" name="dj_corrente_a"
            value={form.dj_corrente_a} onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="dj_potencia_kw">Potência (kW)</label>
            <input id="dj_potencia_kw" name="dj_potencia_kw" type="number" step="0.1" min="0"
              placeholder="ex: 5.5" value={form.dj_potencia_kw} onChange={onChange} />
          </div>
        </div>
      )}

      {tipo === 'MINI_DISJUNTOR' && (
        <div className="form-grid">
          <CorrenteInput id="md_corrente_a" name="md_corrente_a"
            value={form.md_corrente_a} onChange={onChange} label="Corrente (A)" />
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
        </div>
      )}

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
          <CorrenteInput id="rl_corrente_min_a" name="rl_corrente_min_a"
            value={form.rl_corrente_min_a} onChange={onChange} label="Corrente Mínima (A)" />
          <CorrenteInput id="rl_corrente_max_a" name="rl_corrente_max_a"
            value={form.rl_corrente_max_a} onChange={onChange} label="Corrente Máxima (A)" />
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
        </div>
      )}

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
          <CorrenteInput id="fus_corrente_a" name="fus_corrente_a"
            value={form.fus_corrente_a} onChange={onChange} label="Corrente (A)" />
        </div>
      )}

      {tipo === 'CHAVE' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="chv_tipo">Tipo de Chave</label>
            <select id="chv_tipo" name="chv_tipo" value={form.chv_tipo} onChange={onChange}>
              <option value="">—</option>
              <option>Rotativa</option>
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
          <CorrenteInput id="chv_corrente_a" name="chv_corrente_a"
            value={form.chv_corrente_a} onChange={onChange} label="Corrente (A)" />
        </div>
      )}

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
            <label htmlFor="pr_corrente_ka">Corrente de Descarga (kA)</label>
            <input id="pr_corrente_ka" name="pr_corrente_ka" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.pr_corrente_ka} onChange={onChange} />
          </div>
        </div>
      )}

      {tipo === 'BARRA_ATERRAMENTO' && (
        <p className="specs-placeholder">Campos a definir — especificações em texto livre nas Observações.</p>
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
            <label htmlFor="cb_tensao_v">Tensão (V)</label>
            <input id="cb_tensao_v" name="cb_tensao_v" type="number" min="0"
              placeholder="ex: 750" value={form.cb_tensao_v} onChange={onChange} />
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
        </div>
      )}

      {tipo === 'BARRAMENTO' && (
        <p className="specs-placeholder">Campos a definir — especificações em texto livre nas Observações.</p>
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
