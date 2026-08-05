// ExtensaoFields.jsx
// Subcomponentes de campos técnicos por grupo funcional — v4.
// Arquitetura:
//   1. ATIVOS_POR_GRUPO e GRUPO_COR providos pelo TiposAtivoContext
//   2. ESTADO_SPECS      — flat state sem prefixos por ativo (chaves genéricas compartilhadas)
//   3. CAMPOS_SPECS      — Set de nomes que vão exclusivamente para JSONB
//   4. montarEspecificacoes(tipoAtivo, form) — serializa para JSONB
//   5. CorrenteInput     — select de tipo + input(s) numérico(s) com range opcional
//   6. Um componente Ext* por grupo, com dropdown de tipo_ativo + campos condicionais

import { useTiposAtivo } from '../../context/TiposAtivoContext.jsx';
import './ExtensaoFields.css';

// ─── 3. Estado flat de todos os campos de especificação ────────────────────────
// Chaves genéricas compartilhadas contextualmente — sem prefixo por ativo.

export const ESTADO_SPECS = {
  // Campos elétricos compartilhados
  tipo_corrente:     '',  // Qualificador AC / DC / AC-DC
  corrente_min_a:    '',  // Corrente mínima (modo range)
  corrente_cc:       '',  // Corrente de Curto-Circuito (kA)
  tensao_isolamento: '',  // Tensão de Isolamento (Vi/Ui)

  // Campos genéricos compartilhados entre múltiplos ativos
  tipo:             '',   // Classificação interna (dropdown contextual por tipo_ativo)
  polos:            '',   // Número de polos
  tensao_nominal_v: '',   // Tensão nominal de funcionamento (V)
  corrente_a:       '',   // Corrente nominal (A)
  corrente_ka:      '',   // Corrente em kA (ex: descarga de Para-Raio)
  contatos_na:      '',   // Contatos Normalmente Abertos
  contatos_nf:      '',   // Contatos Normalmente Fechados
  material:         '',   // Material genérico (condutor, corpo do ativo)
  isolamento:       '',   // Tipo/classe de isolamento
  bitola_mm2:       '',   // Bitola elétrica (mm²)
  dimensao:         '',   // Dimensão física texto (ex: "16x300")
  furo:             '',   // Furo em texto (ex: "3/8" ou "8mm")
  comprimento_mm:   '',   // Comprimento físico (mm)
  seccao_transversal: '', // Secção transversal texto 'A x B' — cruzeta de fibra
  estribos:         '',   // Número/arranjo de estribos — armação secundária
  diametro_mm:      '',   // Diâmetro interno (mm) — cinta circular

  // Campos exclusivos sem equivalente genérico
  potencia_kw:         '', // Potência (kW) — Disjuntor
  curva_funcionamento: '', // Curva de disparo — Mini-Disjuntor
  faixa_tempo_s:       '', // Faixa de tempo (s) — Relé
  uso:                 '', // Uso (Interno/Externo) — Terminal
};

// ─── 4. Set de campos que vão exclusivamente para JSONB ───────────────────────
export const CAMPOS_SPECS = new Set(Object.keys(ESTADO_SPECS));

// ─── 5. Serialização para JSONB ───────────────────────────────────────────────
export function montarEspecificacoes(tipoAtivo, form) {
  const n = (v) => (v !== '' && v !== null && v !== undefined ? Number(v) : undefined);
  const s = (v) => (v !== '' && v !== null && v !== undefined ? String(v).trim() : undefined);
  const add = (obj, key, val) => { if (val !== undefined && val !== '') obj[key] = val; };

  const addCamposEletricos = (spec) => {
    add(spec, 'tipo_corrente',     s(form.tipo_corrente));
    add(spec, 'corrente_min_a',    n(form.corrente_min_a));
    add(spec, 'corrente_cc',       n(form.corrente_cc));
    add(spec, 'tensao_isolamento', n(form.tensao_isolamento));
  };

  const spec = {};

  switch (tipoAtivo) {

    /*
    Proteção e Chaveamento
    */

    case 'DISJUNTOR':
      add(spec, 'tipo',             s(form.tipo));
      add(spec, 'polos',            s(form.polos));
      add(spec, 'potencia_kw',      n(form.potencia_kw));
      add(spec, 'tensao_nominal_v', n(form.tensao_nominal_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',       n(form.corrente_a));
      break;

    case 'MINI_DISJUNTOR':
      add(spec, 'curva_funcionamento', s(form.curva_funcionamento));
      add(spec, 'polos',            s(form.polos));
      add(spec, 'tensao_nominal_v', n(form.tensao_nominal_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',       n(form.corrente_a));
      break;

    case 'RELE':
      add(spec, 'tipo',             s(form.tipo));
      add(spec, 'contatos_na',      n(form.contatos_na));
      add(spec, 'contatos_nf',      n(form.contatos_nf));
      add(spec, 'faixa_tempo_s',    n(form.faixa_tempo_s));
      add(spec, 'tensao_nominal_v', n(form.tensao_nominal_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',       n(form.corrente_a));
      break;

    case 'FUSIVEL':
      add(spec, 'tipo',             s(form.tipo));
      add(spec, 'tensao_nominal_v', n(form.tensao_nominal_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',       n(form.corrente_a));
      break;

    case 'CHAVE':
      add(spec, 'tipo',             s(form.tipo));
      add(spec, 'tensao_nominal_v', n(form.tensao_nominal_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',       n(form.corrente_a));
      break;

    case 'PARA-RAIO':
      add(spec, 'material',         s(form.material));
      add(spec, 'tensao_nominal_v', n(form.tensao_nominal_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_ka',      n(form.corrente_ka));
      break;

    /*
    Condutores
    */

    case 'CABO':
      add(spec, 'material',         s(form.material));
      add(spec, 'bitola_mm2',       n(form.bitola_mm2));
      add(spec, 'isolamento',       s(form.isolamento));
      addCamposEletricos(spec);
      break;

    /*
    Contatores
    */

    case 'CONTATOR':
      add(spec, 'tipo',             s(form.tipo));
      add(spec, 'polos',            n(form.polos));
      add(spec, 'contatos_na',      n(form.contatos_na));
      add(spec, 'contatos_nf',      n(form.contatos_nf));
      add(spec, 'tensao_nominal_v', n(form.tensao_nominal_v));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',       n(form.corrente_a));
      break;

    /*
    Acessórios
    */

    case 'CONTATOS_AUXILIARES':
      add(spec, 'contatos_na',      n(form.contatos_na));
      add(spec, 'contatos_nf',      n(form.contatos_nf));
      addCamposEletricos(spec);
      add(spec, 'corrente_a',       n(form.corrente_a));
      break;

    /*
    Infraestrutura, Ferragem e Terminações
    */

    case 'PARAFUSO':
      add(spec, 'tipo',    s(form.tipo));
      add(spec, 'dimensao', s(form.dimensao));
      add(spec, 'furo',    s(form.furo));
      break;

    case 'ARRUELA':
      add(spec, 'tipo',    s(form.tipo));
      add(spec, 'dimensao', s(form.dimensao));
      add(spec, 'furo',    s(form.furo));
      break;

    case 'TERMINAL':
      add(spec, 'tipo',             s(form.tipo));
      add(spec, 'uso',              s(form.uso));
      add(spec, 'tensao_nominal_v', n(form.tensao_nominal_v));
      add(spec, 'bitola_mm2',       n(form.bitola_mm2));
      break;

    case 'CRUZETA_FIBRA':
      add(spec, 'comprimento_mm',     n(form.comprimento_mm));
      add(spec, 'seccao_transversal', s(form.seccao_transversal));
      break;

    case 'ALCA_PREFORMADA':
      add(spec, 'tipo', s(form.tipo));
      break;

    case 'ARMACAO_SECUNDARIA':
      add(spec, 'estribos', s(form.estribos));
      add(spec, 'tipo',     s(form.tipo));
      break;

    case 'CINTA_CIRCULAR':
      add(spec, 'diametro_mm', n(form.diametro_mm));
      break;

    case 'ISOLADOR':
      add(spec, 'tipo',             s(form.tipo));
      add(spec, 'material',         s(form.material));
      add(spec, 'tensao_isolamento', n(form.tensao_isolamento));
      break;

    case 'MAO_FRANCESA':
      add(spec, 'tipo',          s(form.tipo));
      add(spec, 'comprimento_mm', n(form.comprimento_mm));
      break;

    default:
      break;
  }

  return Object.keys(spec).length > 0 ? spec : null;
}

// ─── 6. Componente auxiliar: CorrenteInput ────────────────────────────────────
// select de tipo (AC / DC / AC/DC) + um ou dois inputs numéricos.
// Quando minName for passado → modo range: renderiza Mín. e Máx.

export function CorrenteInput({
  id,
  name,
  value,
  minName,
  minValue,
  tipoName = 'tipo_corrente',
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
            placeholder="Mín."
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
          placeholder={temRange ? 'Máx.' : 'Valor (A)'}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

// ─── Ext: Proteção e Chaveamento ──────────────────────────────────────────────

export function ExtProtecaoChaveamento({ form, onChange }) {
  const { ATIVOS_POR_GRUPO } = useTiposAtivo();
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO['PROTECAO_CHAVEAMENTO']?.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── DISJUNTOR ── */}
      {tipo === 'DISJUNTOR' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Tipo de Disjuntor</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
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
            <label htmlFor="polos">Polos</label>
            <select id="polos" name="polos" value={form.polos} onChange={onChange}>
              <option value="">—</option>
              <option>Monopolar</option>
              <option>Bipolar</option>
              <option>Tripolar</option>
              <option>Tetrapolar</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="potencia_kw">Potência (kW)</label>
            <input id="potencia_kw" name="potencia_kw" type="number" step="0.1" min="0"
              placeholder="ex. 5.5" value={form.potencia_kw} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="tensao_nominal_v">Tensão Nominal (V)</label>
            <input id="tensao_nominal_v" name="tensao_nominal_v" type="number" min="0"
              placeholder="ex. 380" value={form.tensao_nominal_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="tensao_isolamento">Tensão de Isolamento (V)</label>
            <input id="tensao_isolamento" name="tensao_isolamento" type="number" min="0"
              placeholder="ex. 690" value={form.tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput id="corrente_a" name="corrente_a"
            value={form.corrente_a} tipoValue={form.tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="corrente_cc">Corrente de Curto-Circuito (kA)</label>
            <input id="corrente_cc" name="corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex. 10" value={form.corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── MINI_DISJUNTOR ── */}
      {tipo === 'MINI_DISJUNTOR' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="curva_funcionamento">Curva de Funcionamento</label>
            <select id="curva_funcionamento" name="curva_funcionamento" value={form.curva_funcionamento} onChange={onChange}>
              <option value="">—</option>
              <option>B</option>
              <option>C</option>
              <option>D</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="polos">Polos</label>
            <select id="polos" name="polos" value={form.polos} onChange={onChange}>
              <option value="">—</option>
              <option>Monopolar</option>
              <option>Bipolar</option>
              <option>Tripolar</option>
              <option>Tetrapolar</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="tensao_nominal_v">Tensão Nominal (V)</label>
            <input id="tensao_nominal_v" name="tensao_nominal_v" type="number" min="0"
              placeholder="ex. 230" value={form.tensao_nominal_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="tensao_isolamento">Tensão de Isolamento (V)</label>
            <input id="tensao_isolamento" name="tensao_isolamento" type="number" min="0"
              placeholder="ex. 440" value={form.tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput id="corrente_a" name="corrente_a"
            value={form.corrente_a} tipoValue={form.tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="corrente_cc">Corrente de Curto-Circuito (kA)</label>
            <input id="corrente_cc" name="corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex. 6" value={form.corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── RELE ── */}
      {tipo === 'RELE' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Tipo de Relé</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
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
            <label htmlFor="contatos_na">Contatos NA</label>
            <input id="contatos_na" name="contatos_na" type="number" min="0" step="1"
              placeholder="0" value={form.contatos_na} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="contatos_nf">Contatos NF</label>
            <input id="contatos_nf" name="contatos_nf" type="number" min="0" step="1"
              placeholder="0" value={form.contatos_nf} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="faixa_tempo_s">Faixa de Tempo (s)</label>
            <input id="faixa_tempo_s" name="faixa_tempo_s" type="number" step="0.1" min="0"
              placeholder="ex. 30" value={form.faixa_tempo_s} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="tensao_nominal_v">Tensão de Bobina (V)</label>
            <input id="tensao_nominal_v" name="tensao_nominal_v" type="number" min="0"
              placeholder="ex. 220" value={form.tensao_nominal_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="tensao_isolamento">Tensão de Isolamento (V)</label>
            <input id="tensao_isolamento" name="tensao_isolamento" type="number" min="0"
              placeholder="ex. 690" value={form.tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput
            id="corrente_a"          name="corrente_a"          value={form.corrente_a}
            minName="corrente_min_a" minValue={form.corrente_min_a}
            tipoValue={form.tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="corrente_cc">Corrente de Curto-Circuito (kA)</label>
            <input id="corrente_cc" name="corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex. 10" value={form.corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── FUSIVEL ── */}
      {tipo === 'FUSIVEL' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Tipo de Fusível</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
              <option value="">—</option>
              <option>Diazed</option>
              <option>NH</option>
              <option>Euro Fuse</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="tensao_nominal_v">Tensão Nominal (V)</label>
            <input id="tensao_nominal_v" name="tensao_nominal_v" type="number" min="0"
              placeholder="ex. 500" value={form.tensao_nominal_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="tensao_isolamento">Tensão de Isolamento (V)</label>
            <input id="tensao_isolamento" name="tensao_isolamento" type="number" min="0"
              placeholder="ex. 690" value={form.tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput id="corrente_a" name="corrente_a"
            value={form.corrente_a} tipoValue={form.tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="corrente_cc">Corrente de Curto-Circuito (kA)</label>
            <input id="corrente_cc" name="corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex. 10" value={form.corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── CHAVE ── */}
      {tipo === 'CHAVE' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Tipo de Chave</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
              <option value="">—</option>
              <option>Seccionadora</option>
              <option>Comutadora</option>
              <option>Seletora</option>
              <option>Boia</option>
              <option>Fim de Curso</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="tensao_nominal_v">Tensão Nominal (V)</label>
            <input id="tensao_nominal_v" name="tensao_nominal_v" type="number" min="0"
              placeholder="ex. 380" value={form.tensao_nominal_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="tensao_isolamento">Tensão de Isolamento (V)</label>
            <input id="tensao_isolamento" name="tensao_isolamento" type="number" min="0"
              placeholder="ex. 690" value={form.tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput id="corrente_a" name="corrente_a"
            value={form.corrente_a} tipoValue={form.tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="corrente_cc">Corrente de Curto-Circuito (kA)</label>
            <input id="corrente_cc" name="corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex. 10" value={form.corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── PARA-RAIO ── */}
      {tipo === 'PARA-RAIO' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="material">Material</label>
            <select id="material" name="material" value={form.material} onChange={onChange}>
              <option value="">—</option>
              <option>Polimérico</option>
              <option>Cerâmico</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="tensao_nominal_v">Tensão Nominal (V)</label>
            <input id="tensao_nominal_v" name="tensao_nominal_v" type="number" min="0"
              placeholder="ex: 12700" value={form.tensao_nominal_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="tensao_isolamento">Tensão de Isolamento (V)</label>
            <input id="tensao_isolamento" name="tensao_isolamento" type="number" min="0"
              placeholder="ex: 690" value={form.tensao_isolamento} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="corrente_ka">Corrente de Descarga (kA)</label>
            <input id="corrente_ka" name="corrente_ka" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.corrente_ka} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="corrente_cc">Corrente de Curto-Circuito (kA)</label>
            <input id="corrente_cc" name="corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}

      {tipo === 'BARRA_DE_ATERRAMENTO' && (
        <p className="specs-placeholder">Campos a definir — especificações em texto livre nas Observações.</p>
      )}
    </>
  );
}

// ─── Ext: Contatores ──────────────────────────────────────────────────────────

export function ExtContatores({ form, onChange }) {
  const { ATIVOS_POR_GRUPO } = useTiposAtivo();
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO['CONTATORES']?.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {tipo === 'CONTATOR' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Classe</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
              <option value="">—</option>
              <option>AC-1</option>
              <option>AC-2</option>
              <option>AC-3</option>
              <option>AC-4</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="polos">Polos</label>
            <input id="polos" name="polos" type="number" min="1" step="1"
              placeholder="ex. 3" value={form.polos} onChange={onChange} />
          </div>
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
          <div className="form-field">
            <label htmlFor="tensao_nominal_v">Tensão de Funcionamento (V)</label>
            <input id="tensao_nominal_v" name="tensao_nominal_v" type="number" min="0"
              placeholder="ex. 380" value={form.tensao_nominal_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="tensao_isolamento">Tensão de Isolamento (V)</label>
            <input id="tensao_isolamento" name="tensao_isolamento" type="number" min="0"
              placeholder="ex. 690" value={form.tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput
            id="corrente_a"          name="corrente_a"          value={form.corrente_a}
            minName="corrente_min_a" minValue={form.corrente_min_a}
            tipoValue={form.tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="corrente_cc">Corrente de Curto-Circuito (kA)</label>
            <input id="corrente_cc" name="corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex. 10" value={form.corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Ext: Condutores ──────────────────────────────────────────────────────────

export function ExtCondutores({ form, onChange }) {
  const { ATIVOS_POR_GRUPO } = useTiposAtivo();
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO['CONDUTORES']?.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {tipo === 'CABO' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="material">Material</label>
            <select id="material" name="material" value={form.material} onChange={onChange}>
              <option value="">—</option>
              <option>Cobre</option>
              <option>Alumínio</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="bitola_mm2">Bitola (mm²)</label>
            <input id="bitola_mm2" name="bitola_mm2" type="number" step="0.5" min="0"
              placeholder="ex. 16.0" value={form.bitola_mm2} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="isolamento">Isolamento</label>
            <select id="isolamento" name="isolamento" value={form.isolamento} onChange={onChange}>
              <option value="">—</option>
              <option>PVC 450/750V</option>
              <option>PVC 0.6/1kV</option>
              <option>XLPE</option>
              <option>Borracha</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="tensao_isolamento">Tensão de Isolamento (V)</label>
            <input id="tensao_isolamento" name="tensao_isolamento" type="number" min="0"
              placeholder="ex. 1000" value={form.tensao_isolamento} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="corrente_cc">Corrente de Curto-Circuito (kA)</label>
            <input id="corrente_cc" name="corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex. 10" value={form.corrente_cc} onChange={onChange} />
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
  const { ATIVOS_POR_GRUPO } = useTiposAtivo();
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO['DISPOSITIVOS_PARTIDA']?.map(a => (
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
  const { ATIVOS_POR_GRUPO } = useTiposAtivo();
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO['PAINEL_AUTOMACAO']?.map(a => (
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
  const { ATIVOS_POR_GRUPO } = useTiposAtivo();
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO['ACESSORIOS']?.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── CONTATOS_AUXILIARES ── */}
      {tipo === 'CONTATOS_AUXILIARES' && (
        <div className="form-grid">
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
          <div className="form-field">
            <label htmlFor="tensao_isolamento">Tensão de Isolamento (V)</label>
            <input id="tensao_isolamento" name="tensao_isolamento" type="number" min="0"
              placeholder="ex: 690" value={form.tensao_isolamento} onChange={onChange} />
          </div>
          <CorrenteInput
            id="corrente_a"          name="corrente_a"          value={form.corrente_a}
            minName="corrente_min_a" minValue={form.corrente_min_a}
            tipoValue={form.tipo_corrente}
            onChange={onChange} label="Corrente (A)" />
          <div className="form-field">
            <label htmlFor="corrente_cc">Corrente de Curto-Circuito (kA)</label>
            <input id="corrente_cc" name="corrente_cc" type="number" step="0.1" min="0"
              placeholder="ex: 10" value={form.corrente_cc} onChange={onChange} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Ext: Infraestrutura, Ferragem e Terminações ──────────────────────────────

export function ExtInfraestruturaFerragem({ form, onChange }) {
  const { ATIVOS_POR_GRUPO } = useTiposAtivo();
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO['INFRAESTRUTURA_FERRAGEM']?.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── PARAFUSO ── */}
      {tipo === 'PARAFUSO' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Tipo de Parafuso</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
              <option value="">—</option>
              <option>Francês</option>
              <option>Quadrado</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="dimensao">Dimensão</label>
            <input id="dimensao" name="dimensao" type="text"
              placeholder="ex. 16x300" value={form.dimensao} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── ARRUELA ── */}
      {tipo === 'ARRUELA' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
              <option value="">—</option>
              <option>Quadrada</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="dimensao">Dimensão</label>
            <input id="dimensao" name="dimensao" type="text"
              placeholder="ex. 20x20" value={form.dimensao} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="furo">Furo (polegadas ou mm)</label>
            <input id="furo" name="furo" type="text"
              placeholder="ex. 3/8 ou 8" value={form.furo} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── TERMINAL ── */}
      {tipo === 'TERMINAL' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Tipo de Terminal</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
              <option value="">—</option>
              <option>Ilhós</option>
              <option>Olhal</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="uso">Uso</label>
            <select id="uso" name="uso" value={form.uso} onChange={onChange}>
              <option value="">—</option>
              <option>Interno</option>
              <option>Externo</option>
              <option>Interno/Externo</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="tensao_nominal_v">Tensão (kV)</label>
            <input id="tensao_nominal_v" name="tensao_nominal_v" type="number" step="0.1" min="0"
              placeholder="ex: 15" value={form.tensao_nominal_v} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="bitola_mm2">Bitola (mm²)</label>
            <input id="bitola_mm2" name="bitola_mm2" type="number" step="0.1" min="0"
              placeholder="ex: 25" value={form.bitola_mm2} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── CRUZETA_FIBRA ── */}
      {tipo === 'CRUZETA_FIBRA' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="comprimento_mm">Comprimento (mm)</label>
            <input id="comprimento_mm" name="comprimento_mm" type="number" min="0" step="1"
              placeholder="ex. 1800" value={form.comprimento_mm} onChange={onChange} />
          </div>
          <div className="form-field">
            <label htmlFor="seccao_transversal">Secção Transversal (A x B)</label>
            <input id="seccao_transversal" name="seccao_transversal" type="text"
              placeholder="ex. 90x90" value={form.seccao_transversal} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── ALCA_PREFORMADA ── */}
      {tipo === 'ALCA_PREFORMADA' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
              <option value="">— Selecione tipo —</option>
              <option>p/ cabo de cobre</option>
              <option>p/ cabo de alumínio</option>
            </select>
          </div>
        </div>
      )}

      {/* ── ARMACAO_SECUNDARIA ── */}
      {tipo === 'ARMACAO_SECUNDARIA' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="estribos">Nº de Estribos</label>
            <select id="estribos" name="estribos" value={form.estribos} onChange={onChange}>
              <option value="">—</option>
              <option>1x1</option>
              <option>1x2</option>
              <option>1x3</option>
              <option>1x4</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
              <option value="">—</option>
              <option>leve</option>
              <option>pesado</option>
            </select>
          </div>
        </div>
      )}

      {/* ── CINTA_CIRCULAR ── */}
      {tipo === 'CINTA_CIRCULAR' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="diametro_mm">Diâmetro Interno (mm)</label>
            <input id="diametro_mm" name="diametro_mm" type="number" min="0" step="0.5"
              placeholder="ex. 25" value={form.diametro_mm} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── ISOLADOR ── */}
      {tipo === 'ISOLADOR' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
              <option value="">—</option>
              <option>de ancoragem</option>
              <option>p/ pino</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="material">Material</label>
            <select id="material" name="material" value={form.material} onChange={onChange}>
              <option value="">—</option>
              <option>porcelana</option>
              <option>polimérico</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="tensao_isolamento">Tensão de Isolamento (V)</label>
            <input id="tensao_isolamento" name="tensao_isolamento" type="number" min="0"
              placeholder="ex. 15000" value={form.tensao_isolamento} onChange={onChange} />
          </div>
        </div>
      )}

      {/* ── MAO_FRANCESA ── */}
      {tipo === 'MAO_FRANCESA' && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="tipo">Tipo</label>
            <select id="tipo" name="tipo" value={form.tipo} onChange={onChange}>
              <option value="">—</option>
              <option>plana</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="comprimento_mm">Comprimento (mm)</label>
            <input id="comprimento_mm" name="comprimento_mm" type="number" min="0" step="1"
              placeholder="ex. 300" value={form.comprimento_mm} onChange={onChange} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── Ext: Transformadores ─────────────────────────────────────────────────────

export function ExtTransformadores({ form, onChange }) {
  const { ATIVOS_POR_GRUPO } = useTiposAtivo();
  const tipo = form.tipo_ativo;

  return (
    <>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="tipo_ativo" className="required-label">Tipo</label>
          <select id="tipo_ativo" name="tipo_ativo" value={tipo} onChange={onChange} required>
            <option value="">— Selecione o tipo —</option>
            {ATIVOS_POR_GRUPO['TRANSFORMADORES']?.map(a => (
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