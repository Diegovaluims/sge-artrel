-- =============================================================================
-- ARTREL ESTOQUE — Schema DDL
-- PostgreSQL 14+
-- Arquitetura: 1 tabela central + 5 extensões funcionais + JSONB por categoria
-- Revisão: incorpora feedback de análise dos CSVs (2026-07-23)
-- =============================================================================

-- =============================================================================
-- TIPOS ENUMERADOS (ENUM TYPES)
-- =============================================================================

-- Categorias primárias de todos os itens (29 categorias)
CREATE TYPE categoria_enum AS ENUM (
    -- Grupo: Proteção & Chaveamento
    'DISJUNTOR',
    'MINI_DISJUNTOR',
    'FUSIVEL',
    'CHAVE',
    'PARA_RAIO',
    -- Grupo: Acionamento & Controle
    'CONTATOR',
    'RELE',
    'CONTATO_AUXILIAR',
    'COMANDO_ELETRICO',
    'SOFTSTARTER',
    -- Grupo: Transformadores
    'TC',
    'TT',
    'AUTOTRANSFORMADOR',
    'INVERSOR_FREQUENCIA',
    'REGULADOR',
    -- Grupo: Automação & Medição
    'CLP_IHM',
    'USCA',
    'INSTRUMENTO_SENSOR',
    'CAPACITOR',
    -- Grupo: Infraestrutura
    'ILUMINACAO',
    'CONECTIVIDADE',
    'FERRAMENTAL_ATUADOR',
    'FIXADOR_FERRAGEM',
    'CONDUTOR',
    'INFRA_ACONDICIONAMENTO',
    'TERMINAL_CONEXAO',
    'DISPOSITIVO_MANOBRA',
    -- Grupo: Infraestrutura (adicionados após análise dos CSVs)
    'BATERIA_FONTE',     -- Baterias, fontes de alimentação DC, no-breaks
    'KIT_CONJUNTO'       -- Itens compostos/montados (ex: banco de capacitor completo, caixa de partida)
);

-- Grupos funcionais (mapeia categoria -> tabela de extensão)
CREATE TYPE grupo_funcional_enum AS ENUM (
    'PROTECAO_CHAVEAMENTO',
    'ACIONAMENTO_CONTROLE',
    'TRANSFORMADORES',
    'AUTOMACAO_MEDICAO',
    'INFRAESTRUTURA'
);

-- Estado de conservação do item
CREATE TYPE condicao_enum AS ENUM (
    'NOVO',
    'USADO',
    'TESTAR',
    'DEFEITO'
);

-- Situação operacional do item no almoxarifado
CREATE TYPE status_enum AS ENUM (
    'DISPONIVEL',
    'INDISPONIVEL',
    'RETIRADO',
    'DESCARTADO'    -- adicionado: item descartado/sucateado permanentemente
);

-- Depósito físico de armazenamento
-- NOTA: localidades específicas (prateleiras, armários) serão definidas em fase posterior.
-- Este campo representa apenas o depósito principal. A posição exata fica em localizacao_prateleira.
CREATE TYPE localizacao_enum AS ENUM (
    'GARAGEM',
    'MEZANINO',
    'GALPAO',
    'OFICINA',
    'OFICINA_MONTAGEM'
);

-- Tipo de tensão elétrica
CREATE TYPE tipo_tensao_enum AS ENUM (
    'AC',
    'DC',
    'AC_DC'
);

-- Número de polos (disjuntores e mini disjuntores)
CREATE TYPE numero_polos_enum AS ENUM (
    'MONOPOLAR',
    'BIPOLAR',
    'TRIPOLAR',
    'TETRAPOLAR'
);

-- =============================================================================
-- TABELA AUXILIAR: fabricantes
-- =============================================================================

CREATE TABLE fabricantes (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL UNIQUE,
    apelido     VARCHAR(50),
    criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- CAMADA 1: TABELA CENTRAL — items
-- =============================================================================

CREATE TABLE items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificação e localização
    -- localizacao_prateleira: rótulo de prateleira/gaveta (ex: 'DJ 01', 'RL TÉRMICO').
    -- NÃO é identificador único — múltiplos itens podem compartilhar a mesma prateleira.
    localizacao_prateleira  VARCHAR(50),
    localizacao             localizacao_enum        NOT NULL,

    -- Classificação técnica
    categoria               categoria_enum          NOT NULL,
    grupo_funcional         grupo_funcional_enum    NOT NULL,

    -- Identificação do produto
    fabricante_id           INT                     REFERENCES fabricantes(id) ON DELETE RESTRICT,
    modelo_referencia       VARCHAR(150),           -- NULL permitido: nem todo item tem código de catálogo
    descricao               TEXT,                   -- Descrição livre técnica (ex: 'Termomagnético 60A Bipolar')

    -- Controle de estoque
    quantidade              INT                     NOT NULL CHECK (quantidade >= 0),
    condicao                condicao_enum           DEFAULT 'NOVO',  -- DEFAULT NOVO: sistema para cadastro de itens novos
    status                  status_enum             NOT NULL DEFAULT 'DISPONIVEL',

    -- Metadados
    observacoes             TEXT,
    criado_em               TIMESTAMP               NOT NULL DEFAULT NOW(),
    atualizado_em           TIMESTAMP               NOT NULL DEFAULT NOW(),

    -- Garante coerência entre categoria e grupo_funcional
    CONSTRAINT chk_grupo_categoria CHECK (
        (categoria IN ('DISJUNTOR','MINI_DISJUNTOR','FUSIVEL','CHAVE','PARA_RAIO')
            AND grupo_funcional = 'PROTECAO_CHAVEAMENTO')
        OR
        (categoria IN ('CONTATOR','RELE','CONTATO_AUXILIAR','COMANDO_ELETRICO','SOFTSTARTER')
            AND grupo_funcional = 'ACIONAMENTO_CONTROLE')
        OR
        (categoria IN ('TC','TT','AUTOTRANSFORMADOR','INVERSOR_FREQUENCIA','REGULADOR')
            AND grupo_funcional = 'TRANSFORMADORES')
        OR
        (categoria IN ('CLP_IHM','USCA','INSTRUMENTO_SENSOR','CAPACITOR')
            AND grupo_funcional = 'AUTOMACAO_MEDICAO')
        OR
        (categoria IN ('ILUMINACAO','CONECTIVIDADE','FERRAMENTAL_ATUADOR',
                       'FIXADOR_FERRAGEM','CONDUTOR','INFRA_ACONDICIONAMENTO',
                       'TERMINAL_CONEXAO','DISPOSITIVO_MANOBRA',
                       'BATERIA_FONTE','KIT_CONJUNTO')
            AND grupo_funcional = 'INFRAESTRUTURA')
    )
);

-- Índices da tabela central
CREATE INDEX idx_items_categoria            ON items (categoria);
CREATE INDEX idx_items_grupo_funcional      ON items (grupo_funcional);
CREATE INDEX idx_items_status               ON items (status);
CREATE INDEX idx_items_localizacao          ON items (localizacao);
CREATE INDEX idx_items_fabricante           ON items (fabricante_id);
CREATE INDEX idx_items_localizacao_prat     ON items (localizacao_prateleira);

-- Trigger: atualiza atualizado_em automaticamente em qualquer UPDATE
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_items_atualizado_em
BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

-- =============================================================================
-- EXTENSÃO 1: ext_protecao_chaveamento
-- Categorias: DISJUNTOR, MINI_DISJUNTOR, FUSIVEL, CHAVE, PARA_RAIO
--
-- Campos comuns: corrente_nominal_a, tensao_nominal_v, numero_polos
-- Nota: tensao_nominal_v armazena tensão única em Volts. Tensões em kV (para
--       Pará-Raios e Fusíveis de Média Tensão) usam tensao_nominal_kv.
--       A designação dupla "220/380V" observada nas planilhas antigas é
--       anti-padrão de preenchimento — no novo sistema, registra-se a tensão
--       nominal de operação do equipamento.
-- =============================================================================

CREATE TABLE ext_protecao_chaveamento (
    item_id             UUID            PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,

    -- Discriminador semântico
    subtipo             VARCHAR(80)     NOT NULL,
    -- DISJUNTOR     : 'Termomagnético', 'Caixa Moldada', 'Motor', 'NEMA'
    -- MINI_DISJUNTOR: 'Termomagnético'
    -- FUSIVEL       : 'Diazed', 'NH', 'Euro Fuse'
    -- CHAVE         : 'Rotativa', 'Comutadora', 'Seletora', 'Boia', 'Fim de Curso'
    -- PARA_RAIO     : 'Polimérico', 'Cerâmico'

    -- Campos elétricos comuns
    corrente_nominal_a  DECIMAL(8,2),           -- A — corrente de operação nominal
    tensao_nominal_v    INT,                     -- V — tensão de operação BT (até 1000V)
    tensao_nominal_kv   DECIMAL(6,3),           -- kV — para Pará-Raio e Fusível MT
    tipo_tensao         tipo_tensao_enum,
    numero_polos        numero_polos_enum,       -- Disjuntor e Mini Disjuntor

    -- Atributos específicos por subtipo (JSONB)
    -- DISJUNTOR Motor  : { "potencia_cv_hp": 7.5 }
    -- MINI_DISJUNTOR   : { "curva_disparo": "C" }
    -- FUSIVEL          : { "tipo_item": "Fusivel" | "Capa/Porta-Fusivel" }
    -- CHAVE            : { "numero_posicoes": 3 }
    -- PARA_RAIO        : { "corrente_descarga_ka": 10.0 }
    especificacoes      JSONB
);

CREATE INDEX idx_prot_subtipo ON ext_protecao_chaveamento (subtipo);
CREATE INDEX idx_prot_jsonb   ON ext_protecao_chaveamento USING GIN (especificacoes);

-- =============================================================================
-- EXTENSÃO 2: ext_acionamento_controle
-- Categorias: CONTATOR, RELE, CONTATO_AUXILIAR, COMANDO_ELETRICO, SOFTSTARTER
--
-- Campos comuns: tensao_operacao_v, contatos_na/nf, corrente
-- =============================================================================

CREATE TABLE ext_acionamento_controle (
    item_id             UUID            PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,

    subtipo             VARCHAR(80)     NOT NULL,
    -- RELE            : 'Térmico', 'Temporizador', 'Acoplador', 'Falta de Fase',
    --                   'Monitor de Tensão', 'Controlador de Temperatura',
    --                   'Fotoelétrico', 'URP'
    -- CONTATOR        : 'Potência', 'Auxiliar'
    -- COMANDO_ELETRICO: 'Botão de Pulso', 'Botoeira de Comando', 'LED/Sinaleiro'
    -- CONTATO_AUXILIAR: 'Bloco Instantâneo', 'Bloco Temporizador'
    -- SOFTSTARTER     : 'Padrão'

    tensao_operacao_v   INT,                     -- V — tensão de operação/bobina/alimentação
    tipo_tensao         tipo_tensao_enum,

    -- Corrente: relés usam min/max; contatores e softstarters usam nominal
    corrente_min_a      DECIMAL(8,2),
    corrente_max_a      DECIMAL(8,2),
    corrente_nominal_a  DECIMAL(8,2),

    -- Contatos auxiliares
    contatos_na         INT CHECK (contatos_na >= 0),
    contatos_nf         INT CHECK (contatos_nf >= 0),

    -- Atributos específicos por subtipo (JSONB)
    -- CONTATOR        : { "polos_principais": 3, "tensao_bobina_v": 220,
    --                     "tipo_tensao_bobina": "AC", "potencia_hp_cv": 10.0 }
    -- RELE Temporizador: { "faixa_tempo_segundos": "0.1-30" }
    -- COMANDO_ELETRICO: { "iluminado": true }
    especificacoes      JSONB
);

CREATE INDEX idx_acion_subtipo ON ext_acionamento_controle (subtipo);
CREATE INDEX idx_acion_jsonb   ON ext_acionamento_controle USING GIN (especificacoes);

-- =============================================================================
-- EXTENSÃO 3: ext_transformadores
-- Categorias: TC, TT, AUTOTRANSFORMADOR, INVERSOR_FREQUENCIA, REGULADOR
--
-- Campos comuns: tensao_entrada_v, tensao_saida_v, potencia/corrente
-- =============================================================================

CREATE TABLE ext_transformadores (
    item_id             UUID            PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,

    subtipo             VARCHAR(80)     NOT NULL,
    -- TC               : 'Bipartido', 'Fechado'
    -- TT               : 'Distribuição', 'Isolamento'
    -- AUTOTRANSFORMADOR: 'Padrão'
    -- INVERSOR_FREQUENCIA: 'Monofásico', 'Trifásico'
    -- REGULADOR        : 'AVR (Tensão)', 'Governador (Velocidade)'

    tensao_entrada_v    INT,                     -- V — primário (TT, Autotransf., Inversor, Regulador)
    tensao_saida_v      INT,                     -- V — secundário (TT, Autotransf., Regulador)
    potencia_va         DECIMAL(10,2),           -- VA — TT e Autotransformador
    corrente_saida_a    DECIMAL(8,2),            -- A — Inversor e Regulador

    -- Atributos específicos por subtipo (JSONB)
    -- TC      : { "relacao_primario_a": 300, "relacao_secundario_a": 5,
    --             "bipartido": true, "tensao_isolamento_kv": 0.6 }
    -- INVERSOR: { "potencia_cv": 7.5 }
    -- REGULADOR: { "tensao_min_v": 160, "tensao_max_v": 300 }
    especificacoes      JSONB
);

CREATE INDEX idx_transf_subtipo ON ext_transformadores (subtipo);
CREATE INDEX idx_transf_jsonb   ON ext_transformadores USING GIN (especificacoes);

-- =============================================================================
-- EXTENSÃO 4: ext_automacao_medicao
-- Categorias: CLP_IHM, USCA, INSTRUMENTO_SENSOR, CAPACITOR
--
-- Campos comuns: tensao_alimentacao_v, subtipo
-- =============================================================================

CREATE TABLE ext_automacao_medicao (
    item_id                 UUID            PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,

    subtipo                 VARCHAR(100)    NOT NULL,
    -- CLP_IHM      : 'CLP', 'IHM', 'Módulo de Expansão'
    -- USCA         : 'Singelo', 'Paralelismo', 'Monitoramento'
    -- INSTRUMENTO_SENSOR: 'Amperímetro', 'Voltímetro', 'Multímetro', 'Pirômetro',
    --                     'Transdutor de Potência', 'Medidor Fator de Potência',
    --                     'Sensor de Temperatura', 'Contador', 'Horômetro',
    --                     'Pressostato', 'Termostato', 'Controlador FP'
    -- CAPACITOR    : 'Célula Capacitiva (Correção FP)', 'Eletrolítico'

    tensao_alimentacao_v    INT,                     -- V — CLP, IHM, USCA

    -- Atributos específicos por subtipo (JSONB)
    -- CLP_IHM      : { "entradas_digitais": 8, "saidas_digitais": 4 }
    -- USCA         : { "aplicacao": "Paralelismo" }
    -- INSTRUMENTO  : { "tecnologia": "Digital", "escala_medicao": "0-50A" }
    -- CAPACITOR    : { "potencia_reativa_kvar": 5.0, "capacitancia_uf": 220.0,
    --                  "tensao_nominal_v": 440 }
    especificacoes          JSONB
);

CREATE INDEX idx_autom_subtipo ON ext_automacao_medicao (subtipo);
CREATE INDEX idx_autom_jsonb   ON ext_automacao_medicao USING GIN (especificacoes);

-- =============================================================================
-- EXTENSÃO 5: ext_infraestrutura
-- Categorias: ILUMINACAO, CONECTIVIDADE, FERRAMENTAL_ATUADOR,
--             FIXADOR_FERRAGEM, CONDUTOR, INFRA_ACONDICIONAMENTO,
--             TERMINAL_CONEXAO, DISPOSITIVO_MANOBRA,
--             BATERIA_FONTE, KIT_CONJUNTO
-- =============================================================================

CREATE TABLE ext_infraestrutura (
    item_id         UUID            PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,

    subtipo         VARCHAR(100)    NOT NULL,
    -- ILUMINACAO            : 'Lâmpada Vapor de Sódio', 'Lâmpada Fluorescente', 'Reator'
    -- CONECTIVIDADE         : 'Tomada Industrial', 'Suporte/Borne Terminal', 'Barra de Aterramento'
    -- FERRAMENTAL_ATUADOR   : 'Ferramenta Elétrica', 'Relógio de Ponto/Tacógrafo',
    --                         'Atuador Solenóide', 'Solenóide de Parada', 'Caixa Metálica/Painel'
    -- FIXADOR_FERRAGEM      : 'Parafuso', 'Porca', 'Arruela', 'Bucha', 'Barra Roscada'
    -- CONDUTOR              : 'Cabo Flexível', 'Cabo Rígido', 'Fio'
    -- INFRA_ACONDICIONAMENTO: 'Eletroduto', 'Eletrocalha', 'Condulete', 'Unidute',
    --                         'Caixa CM/ZC', 'Suporte Vertical', 'Tala Plana', 'Braçadeira'
    -- TERMINAL_CONEXAO      : 'Olhal', 'Ilhós', 'Conector Tubular', 'Mufla', 'Barramento'
    -- DISPOSITIVO_MANOBRA   : 'Interruptor', 'Tomada Residencial'
    -- BATERIA_FONTE         : 'Bateria', 'Fonte DC', 'No-Break', 'Inversor DC/AC'
    -- KIT_CONJUNTO          : 'Banco de Capacitores', 'Caixa de Partida', 'Painel Montado'

    tensao_v        INT,                     -- V — Iluminação, Tomada, Ferramental, Bateria/Fonte
    corrente_a      DECIMAL(8,2),            -- A — Tomada, Terminal, Fonte DC

    -- Atributos específicos por subtipo (JSONB)
    -- ILUMINACAO            : { "potencia_w": 250 }
    -- FERRAMENTAL_ATUADOR   : { "dimensoes": "120x50x40" }
    -- FIXADOR_FERRAGEM      : { "tipo_fixador": "Parafuso", "diametro_mm": 6.0,
    --                           "comprimento_mm": 30.0, "material": "Aço Inox",
    --                           "tipo_rosca_cabeca": "Sextavado" }
    -- CONDUTOR              : { "secao_mm2": 16.0, "cor": "Preto",
    --                           "isolacao": "PVC 450/750V", "tensao_max_v": 750 }
    -- INFRA_ACONDICIONAMENTO: { "tipo": "Eletroduto", "material": "PVC",
    --                           "bitola_polegadas": "3/4", "dimensoes": "100x50mm" }
    -- TERMINAL_CONEXAO      : { "tipo_terminal": "Olhal", "secao_cabo_mm2": 10.0,
    --                           "corrente_max_a": 63.0 }
    -- CONECTIVIDADE         : { "secao_mm2": 4.0 }
    -- BATERIA_FONTE         : { "tensao_saida_v": 24, "capacidade_ah": 100 }
    -- KIT_CONJUNTO          : { "composicao": "Banco 25kVAr 220V + 3 fusíveis 100A" }
    especificacoes  JSONB
);

CREATE INDEX idx_infra_subtipo ON ext_infraestrutura (subtipo);
CREATE INDEX idx_infra_jsonb   ON ext_infraestrutura USING GIN (especificacoes);

-- =============================================================================
-- VIEW CONSOLIDADA: v_estoque_completo
-- Une items com todas as extensões para consultas sem precisar conhecer as
-- tabelas de extensão individualmente.
-- =============================================================================

CREATE VIEW v_estoque_completo AS
SELECT
    i.id,
    i.localizacao_prateleira,
    i.categoria::TEXT,
    i.grupo_funcional::TEXT,
    f.nome                      AS fabricante,
    i.modelo_referencia,
    i.descricao,
    i.quantidade,
    i.condicao::TEXT,
    i.status::TEXT,
    i.localizacao::TEXT,
    i.observacoes,

    -- Proteção & Chaveamento
    pc.subtipo                  AS pc_subtipo,
    pc.corrente_nominal_a       AS pc_corrente_nominal_a,
    pc.tensao_nominal_v         AS pc_tensao_nominal_v,
    pc.tensao_nominal_kv        AS pc_tensao_nominal_kv,
    pc.tipo_tensao::TEXT        AS pc_tipo_tensao,
    pc.numero_polos::TEXT       AS pc_numero_polos,
    pc.especificacoes           AS pc_especificacoes,

    -- Acionamento & Controle
    ac.subtipo                  AS ac_subtipo,
    ac.tensao_operacao_v        AS ac_tensao_operacao_v,
    ac.tipo_tensao::TEXT        AS ac_tipo_tensao,
    ac.corrente_min_a           AS ac_corrente_min_a,
    ac.corrente_max_a           AS ac_corrente_max_a,
    ac.corrente_nominal_a       AS ac_corrente_nominal_a,
    ac.contatos_na              AS ac_contatos_na,
    ac.contatos_nf              AS ac_contatos_nf,
    ac.especificacoes           AS ac_especificacoes,

    -- Transformadores
    tr.subtipo                  AS tr_subtipo,
    tr.tensao_entrada_v         AS tr_tensao_entrada_v,
    tr.tensao_saida_v           AS tr_tensao_saida_v,
    tr.potencia_va              AS tr_potencia_va,
    tr.corrente_saida_a         AS tr_corrente_saida_a,
    tr.especificacoes           AS tr_especificacoes,

    -- Automação & Medição
    am.subtipo                  AS am_subtipo,
    am.tensao_alimentacao_v     AS am_tensao_alimentacao_v,
    am.especificacoes           AS am_especificacoes,

    -- Infraestrutura
    inf.subtipo                 AS inf_subtipo,
    inf.tensao_v                AS inf_tensao_v,
    inf.corrente_a              AS inf_corrente_a,
    inf.especificacoes          AS inf_especificacoes,

    i.criado_em,
    i.atualizado_em

FROM items i
LEFT JOIN fabricantes               f   ON i.fabricante_id = f.id
LEFT JOIN ext_protecao_chaveamento  pc  ON i.id = pc.item_id
LEFT JOIN ext_acionamento_controle  ac  ON i.id = ac.item_id
LEFT JOIN ext_transformadores       tr  ON i.id = tr.item_id
LEFT JOIN ext_automacao_medicao     am  ON i.id = am.item_id
LEFT JOIN ext_infraestrutura        inf ON i.id = inf.item_id;

-- =============================================================================
-- DADOS INICIAIS: fabricantes
-- Fonte: mds/fabricantes.md (71 entradas levantadas dos CSVs de inventário)
-- =============================================================================

INSERT INTO fabricantes (nome, apelido) VALUES
    -- Proteção, Controle e Automação
    ('ABB / BBC',               'ABB'),
    ('Siemens',                 'Siemens'),
    ('Schneider Electric',      'Schneider'),
    ('WEG',                     'WEG'),
    ('Eaton',                   'Eaton'),
    ('Moeller',                 'Moeller'),
    ('GE',                      'GE'),
    ('Rockwell / Allen-Bradley','Allen-Bradley'),
    -- Relés e Controle
    ('Pextron',                 'Pextron'),
    ('Finder',                  'Finder'),
    ('Coel',                    'Coel'),
    ('Diamond',                 'Diamond'),
    ('Metaltex',                'Metaltex'),
    ('Schrach / Schrack',       'Schrack'),
    ('Simon',                   'Simon'),
    ('Weidmuller',              'Weidmuller'),
    ('MarGirius',               'MarGirius'),
    -- Contatores e Disjuntores
    ('Steck',                   'Steck'),
    ('Chint',                   'Chint'),
    ('Sanmen',                  'Sanmen'),
    ('FAZ',                     'FAZ'),
    ('F&G',                     'F&G'),
    ('Lorenzetti',              'Lorenzetti'),
    ('Eletromar',               'Eletromar'),
    ('Soprano',                 'Soprano'),
    ('Sibratec',                'Sibratec'),
    ('Tramontina',              'Tramontina'),
    ('Ásia',                    'Ásia'),   -- componente importado (origem indefinida)
    -- Automação e CLP
    ('Telemecanique',           'Telemecanique'),
    ('Novus',                   'Novus'),
    ('Panasonic',               'Panasonic'),
    ('IMS',                     'IMS'),
    ('Uracom',                  'Uracom'),
    ('Listed',                  'Listed'),
    ('Lumibras',                'Lumibras'),
    -- Reguladores e Geradores
    ('Woodward',                'Woodward'),
    ('Cummins',                 'Cummins'),
    ('Stamford',                'Stamford'),
    ('DSE',                     'DSE'),
    ('GAC',                     'GAC'),
    ('Leroy Somer',             'Leroy Somer'),
    ('Stemac',                  'Stemac'),
    ('KVA',                     'KVA'),
    ('Telys',                   'Telys'),
    -- Transformadores e TC
    ('Renz',                    'Renz'),
    ('Lier',                    'Lier'),
    ('Lukma',                   'Lukma'),
    ('Indusat',                 'Indusat'),
    ('WB Transformadores',      'WB'),
    ('Girardi',                 'Girardi'),
    ('Binder Magnete',          'Binder'),
    -- Instrumentação e Medição
    ('Altronic',                'Altronic'),
    ('HB Brasil',               'HB Brasil'),
    ('Gossen',                  'Gossen'),
    ('Tholz',                   'Tholz'),
    ('Micel',                   'Micel'),
    ('Minipa',                  'Minipa'),
    ('Sukram',                  'Sukram'),
    ('Sunwa',                   'Sunwa'),
    ('Statop',                  'Statop'),
    ('BHS',                     'BHS'),
    ('GAWE',                    'GAWE'),
    ('Kraus e Naimer',          'Kraus e Naimer'),
    ('Honeywell',               'Honeywell'),
    ('Termoval',                'Termoval'),
    ('Jumo',                    'Jumo'),
    -- Iluminação
    ('Sylvania',                'Sylvania'),
    ('OuroLux',                 'OuroLux'),
    ('Alumbra',                 'Alumbra'),
    ('JNG',                     'JNG'),
    ('FLC',                     'FLC'),
    ('Intral',                  'Intral'),
    -- Infraestrutura e Conexões
    ('Phoenix Contact',         'Phoenix'),
    ('Holec',                   'Holec'),
    ('Chardon',                 'Chardon'),
    ('Conexcel',                'Conexcel'),
    ('Inbrac',                  'Inbrac'),
    ('Pirastic',                'Pirastic'),
    ('Real Perfil',             'Real Perfil'),
    -- Atuadores e Outros
    ('Yaoma',                   'Yaoma'),
    ('Naja',                    'Naja'),
    ('MCE',                     'MCE'),
    ('WT',                      'WT'),
    ('JL',                      'JL'),
    ('Danfoss',                 'Danfoss'),
    ('Camsco',                  'Camsco'),
    ('Toshiba',                 'Toshiba'),
    -- Fallback
    ('Outros / Genérico',       'Outros');

-- =============================================================================
-- EXEMPLOS DE INSERT COMENTADOS
-- Demonstram o padrão correto de cadastro no novo sistema.
-- =============================================================================

-- Exemplo 1: Disjuntor Motor 7.5CV / 380V / Tripolar (Siemens 3VU13)
-- As especificações técnicas ficam estruturadas na tabela de extensão.
-- A descricao em items é o texto livre de apoio.
--
-- INSERT INTO items (localizacao_prateleira, categoria, grupo_funcional, fabricante_id,
--                    modelo_referencia, descricao, quantidade, condicao, status, localizacao)
-- VALUES ('DJ MOTOR', 'DISJUNTOR', 'PROTECAO_CHAVEAMENTO',
--         (SELECT id FROM fabricantes WHERE apelido = 'Siemens'),
--         '3VU13', 'Disjuntor Motor Tripolar 380V 7,5CV', 5, 'NOVO', 'DISPONIVEL', 'GARAGEM');
--
-- INSERT INTO ext_protecao_chaveamento (item_id, subtipo, corrente_nominal_a,
--                                       tensao_nominal_v, tipo_tensao, numero_polos, especificacoes)
-- VALUES ((SELECT id FROM items ORDER BY criado_em DESC LIMIT 1),
--         'Motor', 17.5, 380, 'AC', 'TRIPOLAR',
--         '{"potencia_cv_hp": 7.5}');

-- Exemplo 2: Relé Temporizador 24VDC / 1NA+1NF (Schneider RE7TL11BU)
--
-- INSERT INTO items (localizacao_prateleira, categoria, grupo_funcional, fabricante_id,
--                    modelo_referencia, descricao, quantidade, condicao, status, localizacao)
-- VALUES ('RL TEMP', 'RELE', 'ACIONAMENTO_CONTROLE',
--         (SELECT id FROM fabricantes WHERE apelido = 'Schneider'),
--         'RE7TL11BU', 'Relé Temporizador 24VDC 0,1-30s 1NA+1NF', 2, 'NOVO', 'DISPONIVEL', 'MEZANINO');
--
-- INSERT INTO ext_acionamento_controle (item_id, subtipo, tensao_operacao_v, tipo_tensao,
--                                       contatos_na, contatos_nf, especificacoes)
-- VALUES ((SELECT id FROM items ORDER BY criado_em DESC LIMIT 1),
--         'Temporizador', 24, 'DC', 1, 1,
--         '{"faixa_tempo_segundos": "0.1-30"}');

-- Exemplo 3: Condutor PVC 16mm² Preto / 450-750V (Pirastic Ecoplus BWF Flexível)
--
-- INSERT INTO items (localizacao_prateleira, categoria, grupo_funcional, fabricante_id,
--                    modelo_referencia, descricao, quantidade, condicao, status, localizacao)
-- VALUES (NULL, 'CONDUTOR', 'INFRAESTRUTURA',
--         (SELECT id FROM fabricantes WHERE apelido = 'Pirastic'),
--         'Ecoplus BWF Flexível', 'Cabo Flexível PVC 450/750V 16mm² Preto', 180, 'NOVO', 'DISPONIVEL', 'GALPAO');
--
-- INSERT INTO ext_infraestrutura (item_id, subtipo, especificacoes)
-- VALUES ((SELECT id FROM items ORDER BY criado_em DESC LIMIT 1),
--         'Cabo Flexível',
--         '{"secao_mm2": 16.0, "cor": "Preto", "isolacao": "PVC 450/750V", "tensao_max_v": 750}');

-- Exemplo 4: TC Bipartido 300/5A 0,6kV (Lier)
--
-- INSERT INTO items (localizacao_prateleira, categoria, grupo_funcional, fabricante_id,
--                    modelo_referencia, descricao, quantidade, condicao, status, localizacao)
-- VALUES ('TC 01', 'TC', 'TRANSFORMADORES',
--         (SELECT id FROM fabricantes WHERE apelido = 'Lier'),
--         NULL, 'TC Bipartido 300/5A 0,6kV', 3, 'USADO', 'DISPONIVEL', 'GARAGEM');
--
-- INSERT INTO ext_transformadores (item_id, subtipo, especificacoes)
-- VALUES ((SELECT id FROM items ORDER BY criado_em DESC LIMIT 1),
--         'Bipartido',
--         '{"relacao_primario_a": 300, "relacao_secundario_a": 5, "bipartido": true, "tensao_isolamento_kv": 0.6}');
