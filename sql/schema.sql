-- =============================================================================
-- ARTREL ESTOQUE — Schema DDL v2
-- PostgreSQL 14+
-- Arquitetura: 5 grandes grupos funcionais com ENUMs separados,
-- tabela items centralizada, uma única item_especificacoes com JSONB.
-- Reescrita total — sem herança do schema anterior.
-- =============================================================================

-- =============================================================================
-- CHECKLIST: ao adicionar um novo grupo_funcional, atualizar:
--   1. grupo_funcional_enum        (schema.sql — este arquivo)
--   2. CASE v_grupo_funcional      (inserir_item_estoque.sql)
--   3. CASE v_grupo_funcional      (atualizar_item_estoque.sql)
--   4. ATIVOS_POR_GRUPO / GRUPO_COR (ExtensaoFields.jsx)
--   5. GRUPOS                      (ItemForm.jsx)
--   6. hidratarSpecs / LABEL_ATIVO (EditModal.jsx)
--   7. LABEL_ATIVO                 (EstoqueTable.jsx)
-- =============================================================================


-- =============================================================================
-- ROLE WEB_ANON E PRIVILÉGIOS (POSTGREST)
-- =============================================================================
DO $$
BEGIN
  CREATE ROLE web_anon NOLOGIN;
EXCEPTION WHEN DUPLICATE_OBJECT THEN
  RAISE NOTICE 'not creating role web_anon -- it already exists';
END
$$;
GRANT USAGE ON SCHEMA public TO web_anon;

-- =============================================================================
-- TIPOS DE CONTROLE (invariantes)
-- =============================================================================

CREATE TYPE condicao_enum AS ENUM (
    'NOVO',
    'USADO',
    'TESTAR',
    'DEFEITO'
);

CREATE TYPE status_enum AS ENUM (
    'DISPONIVEL',
    'INDISPONIVEL',
    'RETIRADO',
    'DESCARTADO'
);

CREATE TYPE localizacao_enum AS ENUM (
    'GARAGEM',
    'MEZANINO',
    'GALPAO',
    'OFICINA',
    'OFICINA_MONTAGEM'
);

-- =============================================================================
-- OS 5 GRANDES GRUPOS FUNCIONAIS
-- Valor exibido no dropdown "Categoria" do formulário.
-- =============================================================================

CREATE TYPE grupo_funcional_enum AS ENUM (
    'PROTECAO_CHAVEAMENTO',    -- Proteção e Chaveamento
    'CONTATORES',              -- Contatores
    'CONDUTORES',              -- Condutores
    'DISPOSITIVOS_PARTIDA',    -- Dispositivos de Partida
    'PAINEL_AUTOMACAO',        -- Painéis e Automação
    'ACESSORIOS',              -- Acessórios
    'INFRAESTRUTURA_FERRAGEM', -- Infraestrutura e Ferragem
    'TRANSFORMADORES'          -- Transformadores
);

-- =============================================================================
-- TABELA DE DOMÍNIO: tipos_ativo
-- Centraliza os tipos e grupos funcionais para o frontend consumir.
-- =============================================================================

CREATE TABLE tipos_ativo (
    id SERIAL PRIMARY KEY,
    grupo_funcional grupo_funcional_enum NOT NULL,
    tipo_ativo TEXT NOT NULL UNIQUE
);

INSERT INTO tipos_ativo (grupo_funcional, tipo_ativo) VALUES
-- PROTECAO_CHAVEAMENTO
('PROTECAO_CHAVEAMENTO', 'DISJUNTOR'),
('PROTECAO_CHAVEAMENTO', 'MINI_DISJUNTOR'),
('PROTECAO_CHAVEAMENTO', 'RELE'),
('PROTECAO_CHAVEAMENTO', 'FUSIVEL'),
('PROTECAO_CHAVEAMENTO', 'CHAVE'),
('PROTECAO_CHAVEAMENTO', 'PARA-RAIO'),
('PROTECAO_CHAVEAMENTO', 'BARRA_DE_ATERRAMENTO'),
-- CONDUTORES
('CONDUTORES', 'CABO'),
('CONDUTORES', 'BARRAMENTO'),
('CONDUTORES', 'BARRA_CHATA'),
-- CONTATORES
('CONTATORES', 'CONTATOR'),
-- DISPOSITIVOS_PARTIDA
('DISPOSITIVOS_PARTIDA', 'SOFTSTARTER'),
('DISPOSITIVOS_PARTIDA', 'INVERSOR'),
('DISPOSITIVOS_PARTIDA', 'CHAVE_COMPENSADORA'),
-- PAINEL_AUTOMACAO
('PAINEL_AUTOMACAO', 'CAIXA'),
('PAINEL_AUTOMACAO', 'PAINEL'),
('PAINEL_AUTOMACAO', 'BOTAO'),
('PAINEL_AUTOMACAO', 'BOTOEIRA'),
('PAINEL_AUTOMACAO', 'REGULADOR'),
('PAINEL_AUTOMACAO', 'CLP'),
('PAINEL_AUTOMACAO', 'SOLENOIDE'),
('PAINEL_AUTOMACAO', 'CAPACITOR'),
-- ACESSORIOS
('ACESSORIOS', 'CONTATO_AUXILIAR'),
('ACESSORIOS', 'EXTINTOR'),
('ACESSORIOS', 'PUNHO_MANOBRA'),
('ACESSORIOS', 'CURVA'),
-- INFRAESTRUTURA_FERRAGEM
('INFRAESTRUTURA_FERRAGEM', 'PARAFUSO'),
('INFRAESTRUTURA_FERRAGEM', 'PORCA'),
('INFRAESTRUTURA_FERRAGEM', 'ARRUELA'),
('INFRAESTRUTURA_FERRAGEM', 'TERMINAL'),
('INFRAESTRUTURA_FERRAGEM', 'MUFLA'),
('INFRAESTRUTURA_FERRAGEM', 'BUCHA'),
('INFRAESTRUTURA_FERRAGEM', 'ELETRODUTO'),
('INFRAESTRUTURA_FERRAGEM', 'ELETROCALHA'),
('INFRAESTRUTURA_FERRAGEM', 'LEITO'),
('INFRAESTRUTURA_FERRAGEM', 'CONDULETE'),
('INFRAESTRUTURA_FERRAGEM', 'UNIDUTE'),
('INFRAESTRUTURA_FERRAGEM', 'PLACA'),
-- TRANSFORMADORES
('TRANSFORMADORES', 'TRANSFORMADOR_DE_TENSAO'),
('TRANSFORMADORES', 'TRANSFORMADOR_DE_CORRENTE'),
('TRANSFORMADORES', 'AUTOTRANSFORMADOR'),
-- INFRAESTRUTURA_FERRAGEM — novos ativos
('INFRAESTRUTURA_FERRAGEM', 'CRUZETA_FIBRA'),
('INFRAESTRUTURA_FERRAGEM', 'ALCA_PREFORMADA'),
('INFRAESTRUTURA_FERRAGEM', 'ARMACAO_SECUNDARIA'),
('INFRAESTRUTURA_FERRAGEM', 'CINTA_CIRCULAR'),
('INFRAESTRUTURA_FERRAGEM', 'ISOLADOR'),
('INFRAESTRUTURA_FERRAGEM', 'MAO_FRANCESA');

-- =============================================================================
-- TABELA AUXILIAR: fabricantes
-- =============================================================================

CREATE TABLE fabricantes (
    id        SERIAL PRIMARY KEY,
    nome      VARCHAR(100) NOT NULL UNIQUE,
    apelido   VARCHAR(50),
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABELA CENTRAL: items
-- =============================================================================

CREATE TABLE items (
    id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Localização física
    localizacao_prateleira  VARCHAR(50),
    localizacao             localizacao_enum     NOT NULL,

    -- Classificação
    -- grupo_funcional: um dos grandes grupos funcionais
    -- tipo_ativo: chave estrangeira para a tabela de domínios tipos_ativo
    grupo_funcional         grupo_funcional_enum NOT NULL,
    tipo_ativo              TEXT                 NOT NULL REFERENCES tipos_ativo(tipo_ativo) ON UPDATE CASCADE,

    -- Identificação do produto
    fabricante_id           INT REFERENCES fabricantes(id) ON DELETE RESTRICT,
    modelo_referencia       VARCHAR(150),
    descricao               TEXT,  -- NÃO obrigatório

    -- Controle de estoque
    quantidade              INT NOT NULL CHECK (quantidade >= 0),
    condicao                condicao_enum NOT NULL DEFAULT 'NOVO',
    status                  status_enum   NOT NULL DEFAULT 'DISPONIVEL',

    -- Notas
    observacoes             TEXT,

    -- Metadados
    criado_em               TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em           TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_items_grupo    ON items (grupo_funcional);
CREATE INDEX idx_items_tipo     ON items (tipo_ativo);
CREATE INDEX idx_items_status   ON items (status);
CREATE INDEX idx_items_local    ON items (localizacao);
CREATE INDEX idx_items_fab      ON items (fabricante_id);
CREATE INDEX idx_items_prat     ON items (localizacao_prateleira);

-- Trigger: mantém atualizado_em sincronizado em qualquer UPDATE
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

-- Trigger: Imutabilidade de grupo_funcional e tipo_ativo
CREATE OR REPLACE FUNCTION fn_proteger_campos_imutaveis()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.grupo_funcional IS DISTINCT FROM OLD.grupo_funcional THEN
        RAISE EXCEPTION 'grupo_funcional é imutável após o cadastro.';
    END IF;
    IF NEW.tipo_ativo IS DISTINCT FROM OLD.tipo_ativo THEN
        RAISE EXCEPTION 'tipo_ativo é imutável após o cadastro.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_items_imutaveis
BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION fn_proteger_campos_imutaveis();

-- =============================================================================
-- TABELA UNIFICADA DE ESPECIFICAÇÕES TÉCNICAS
-- Uma única tabela substitui as 5 ext_* anteriores.
-- Toda especificação técnica é armazenada em JSONB.
-- Schema do JSONB é livre e específico por tipo_ativo.
-- =============================================================================

CREATE TABLE item_especificacoes (
    item_id        UUID  PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
    especificacoes JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_espec_jsonb ON item_especificacoes USING GIN (especificacoes);

-- =============================================================================
-- TABELA DE AUDITORIA
-- Registra UPDATE e SOFT_DELETE. usuario_id nullable para futura auth JWT.
-- =============================================================================

CREATE TYPE operacao_auditoria_enum AS ENUM (
    'INSERT',
    'UPDATE',
    'SOFT_DELETE'
);

CREATE TABLE log_auditoria (
    id            BIGSERIAL  PRIMARY KEY,
    item_id       UUID       NOT NULL,
    operacao      operacao_auditoria_enum NOT NULL,
    payload_antes  JSONB,
    payload_depois JSONB,
    usuario_id    TEXT,      -- NULL agora; preenchido após integração Supabase Auth
    executado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_item_id ON log_auditoria (item_id);
CREATE INDEX idx_audit_op      ON log_auditoria (operacao);
CREATE INDEX idx_audit_quando  ON log_auditoria (executado_em DESC);

-- =============================================================================
-- VIEW CONSOLIDADA: v_estoque_completo
-- Une items, fabricantes e item_especificacoes.
-- Frontend consome apenas esta view via PostgREST.
-- =============================================================================

CREATE VIEW v_estoque_completo AS
SELECT
    i.id,
    i.localizacao_prateleira,
    i.grupo_funcional::TEXT,
    i.tipo_ativo,
    f.nome                          AS fabricante,
    i.fabricante_id,
    i.modelo_referencia,
    i.descricao,
    i.quantidade,
    i.condicao::TEXT,
    i.status::TEXT,
    i.localizacao::TEXT,
    i.observacoes,
    COALESCE(e.especificacoes, '{}'::JSONB) AS especificacoes,
    i.criado_em,
    i.atualizado_em
FROM items i
LEFT JOIN fabricantes         f ON i.fabricante_id = f.id
LEFT JOIN item_especificacoes e ON i.id = e.item_id;

-- =============================================================================
-- DADOS INICIAIS: fabricantes
-- =============================================================================

INSERT INTO fabricantes (nome, apelido) VALUES
    -- Proteção, Controle e Automação
    ('ABB / BBC',                'ABB'),
    ('Siemens',                  'Siemens'),
    ('Schneider Electric',       'Schneider'),
    ('WEG',                      'WEG'),
    ('Eaton',                    'Eaton'),
    ('Moeller',                  'Moeller'),
    ('GE',                       'GE'),
    ('Rockwell / Allen-Bradley', 'Allen-Bradley'),
    -- Relés e Controle
    ('Pextron',                  'Pextron'),
    ('Finder',                   'Finder'),
    ('Coel',                     'Coel'),
    ('Diamond',                  'Diamond'),
    ('Metaltex',                 'Metaltex'),
    ('Schrach / Schrack',        'Schrack'),
    ('Simon',                    'Simon'),
    ('Weidmuller',               'Weidmuller'),
    ('MarGirius',                'MarGirius'),
    -- Contatores e Disjuntores
    ('Steck',                    'Steck'),
    ('Chint',                    'Chint'),
    ('Sanmen',                   'Sanmen'),
    ('FAZ',                      'FAZ'),
    ('F&G',                      'F&G'),
    ('Lorenzetti',               'Lorenzetti'),
    ('Eletromar',                'Eletromar'),
    ('Soprano',                  'Soprano'),
    ('Sibratec',                 'Sibratec'),
    ('Tramontina',               'Tramontina'),
    ('Ásia',                     'Ásia'),
    -- Automação e CLP
    ('Telemecanique',            'Telemecanique'),
    ('Novus',                    'Novus'),
    ('Panasonic',                'Panasonic'),
    ('IMS',                      'IMS'),
    ('Uracom',                   'Uracom'),
    ('Listed',                   'Listed'),
    ('Lumibras',                 'Lumibras'),
    -- Reguladores e Geradores
    ('Woodward',                 'Woodward'),
    ('Cummins',                  'Cummins'),
    ('Stamford',                 'Stamford'),
    ('DSE',                      'DSE'),
    ('GAC',                      'GAC'),
    ('Leroy Somer',              'Leroy Somer'),
    ('Stemac',                   'Stemac'),
    ('KVA',                      'KVA'),
    ('Telys',                    'Telys'),
    -- Transformadores e TC
    ('Renz',                     'Renz'),
    ('Lier',                     'Lier'),
    ('Lukma',                    'Lukma'),
    ('Indusat',                  'Indusat'),
    ('WB Transformadores',       'WB'),
    ('Girardi',                  'Girardi'),
    ('Binder Magnete',           'Binder'),
    -- Instrumentação e Medição
    ('Altronic',                 'Altronic'),
    ('HB Brasil',                'HB Brasil'),
    ('Gossen',                   'Gossen'),
    ('Tholz',                    'Tholz'),
    ('Micel',                    'Micel'),
    ('Minipa',                   'Minipa'),
    ('Sukram',                   'Sukram'),
    ('Sunwa',                    'Sunwa'),
    ('Statop',                   'Statop'),
    ('BHS',                      'BHS'),
    ('GAWE',                     'GAWE'),
    ('Kraus e Naimer',           'Kraus e Naimer'),
    ('Honeywell',                'Honeywell'),
    ('Termoval',                 'Termoval'),
    ('Jumo',                     'Jumo'),
    -- Iluminação
    ('Sylvania',                 'Sylvania'),
    ('OuroLux',                  'OuroLux'),
    ('Alumbra',                  'Alumbra'),
    ('JNG',                      'JNG'),
    ('FLC',                      'FLC'),
    ('Intral',                   'Intral'),
    -- Infraestrutura e Conexões
    ('Phoenix Contact',          'Phoenix'),
    ('Holec',                    'Holec'),
    ('Chardon',                  'Chardon'),
    ('Conexcel',                 'Conexcel'),
    ('Inbrac',                   'Inbrac'),
    ('Pirastic',                 'Pirastic'),
    ('Real Perfil',              'Real Perfil'),
    -- Atuadores e Outros
    ('Yaoma',                    'Yaoma'),
    ('Naja',                     'Naja'),
    ('MCE',                      'MCE'),
    ('WT',                       'WT'),
    ('JL',                       'JL'),
    ('Danfoss',                  'Danfoss'),
    ('Camsco',                   'Camsco'),
    ('Toshiba',                  'Toshiba'),
    -- Fallback
    ('Outros / Genérico',        'Outros');

-- =============================================================================
-- PERMISSÕES (GRANTs) PARA WEB_ANON
-- =============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON items TO web_anon;
GRANT SELECT ON fabricantes TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON item_especificacoes TO web_anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON log_auditoria TO web_anon;
GRANT SELECT ON tipos_ativo TO web_anon;
GRANT SELECT ON v_estoque_completo TO web_anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO web_anon;
