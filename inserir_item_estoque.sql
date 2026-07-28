-- =============================================================================
-- ARTREL ESTOQUE — Stored Procedure de Inserção v2
-- Arquivo: inserir_item_estoque.sql
-- Executar: psql -d prototipo-artrel -f inserir_item_estoque.sql
--
-- Endpoint: POST http://localhost:3000/rpc/inserir_item_estoque
-- Body:      { "p_dados": { ...campos... } }
--
-- Lógica: valida grupo_funcional ↔ tipo_ativo, insere em items e
-- em item_especificacoes. O frontend não conhece as tabelas internas.
-- =============================================================================

CREATE OR REPLACE FUNCTION inserir_item_estoque(p_dados JSON)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_grupo_funcional   TEXT;
    v_tipo_ativo        TEXT;
    v_fabricante_id     INT;
    v_item_id           UUID;
    v_resultado         JSON;

    -- Campos base
    v_localizacao_prat  TEXT;
    v_localizacao       TEXT;
    v_modelo_ref        TEXT;
    v_descricao         TEXT;
    v_quantidade        INT;
    v_condicao          TEXT;
    v_status            TEXT;
    v_observacoes       TEXT;
BEGIN

    -- =========================================================================
    -- 1. EXTRAÇÃO DOS CAMPOS BASE
    -- =========================================================================
    v_grupo_funcional  := p_dados->>'grupo_funcional';
    v_tipo_ativo       := p_dados->>'tipo_ativo';
    v_localizacao_prat := p_dados->>'localizacao_prateleira';
    v_localizacao      := COALESCE(p_dados->>'localizacao', 'GARAGEM');
    v_modelo_ref       := p_dados->>'modelo_referencia';
    v_descricao        := p_dados->>'descricao';
    v_quantidade       := COALESCE((p_dados->>'quantidade')::INT, 0);
    v_condicao         := COALESCE(p_dados->>'condicao', 'NOVO');
    v_status           := COALESCE(p_dados->>'status', 'DISPONIVEL');
    v_observacoes      := p_dados->>'observacoes';

    -- =========================================================================
    -- 2. VALIDAÇÃO OBRIGATÓRIA
    -- =========================================================================
    IF v_grupo_funcional IS NULL THEN
        RAISE EXCEPTION 'Campo obrigatório ausente: grupo_funcional';
    END IF;

    IF v_tipo_ativo IS NULL THEN
        RAISE EXCEPTION 'Campo obrigatório ausente: tipo_ativo';
    END IF;

    -- =========================================================================
    -- 3. VALIDAÇÃO DO VÍNCULO grupo_funcional ↔ tipo_ativo
    --    Garante que o ativo pertence ao grupo selecionado.
    -- =========================================================================
    CASE v_grupo_funcional
        WHEN 'PROTECAO_CHAVEAMENTO' THEN
            IF v_tipo_ativo NOT IN (
                'DISJUNTOR','MINI_DISJUNTOR','RELE','FUSIVEL',
                'CHAVE','PARA_RAIO','BARRA_ATERRAMENTO'
            ) THEN
                RAISE EXCEPTION 'tipo_ativo "%" inválido para o grupo PROTECAO_CHAVEAMENTO', v_tipo_ativo;
            END IF;

        WHEN 'CONDUTORES' THEN
            IF v_tipo_ativo NOT IN ('CABO','BARRAMENTO') THEN
                RAISE EXCEPTION 'tipo_ativo "%" inválido para o grupo CONDUTORES', v_tipo_ativo;
            END IF;

        WHEN 'PAINEL_AUTOMACAO' THEN
            IF v_tipo_ativo NOT IN ('CAIXA','PAINEL','SOFTSTARTER','INVERSOR') THEN
                RAISE EXCEPTION 'tipo_ativo "%" inválido para o grupo PAINEL_AUTOMACAO', v_tipo_ativo;
            END IF;

        WHEN 'INFRAESTRUTURA_FERRAGEM' THEN
            IF v_tipo_ativo NOT IN ('PARAFUSO','PORCA','ARRUELA','TERMINAL') THEN
                RAISE EXCEPTION 'tipo_ativo "%" inválido para o grupo INFRAESTRUTURA_FERRAGEM', v_tipo_ativo;
            END IF;

        WHEN 'TRANSFORMADORES' THEN
            IF v_tipo_ativo NOT IN (
                'TRANSFORMADOR_TENSAO','TRANSFORMADOR_CORRENTE','AUTOTRANSFORMADOR'
            ) THEN
                RAISE EXCEPTION 'tipo_ativo "%" inválido para o grupo TRANSFORMADORES', v_tipo_ativo;
            END IF;

        ELSE
            RAISE EXCEPTION 'grupo_funcional inválido: %', v_grupo_funcional;
    END CASE;

    -- =========================================================================
    -- 4. RESOLUÇÃO DO fabricante_id
    --    a) fabricante_id (INT direto)
    --    b) fabricante_nome (lookup por nome)
    --    c) fabricante_apelido (lookup por apelido)
    -- =========================================================================
    IF p_dados->>'fabricante_id' IS NOT NULL THEN
        v_fabricante_id := (p_dados->>'fabricante_id')::INT;

    ELSIF p_dados->>'fabricante_nome' IS NOT NULL THEN
        SELECT id INTO v_fabricante_id
        FROM fabricantes
        WHERE LOWER(nome) = LOWER(p_dados->>'fabricante_nome')
        LIMIT 1;

    ELSIF p_dados->>'fabricante_apelido' IS NOT NULL THEN
        SELECT id INTO v_fabricante_id
        FROM fabricantes
        WHERE LOWER(apelido) = LOWER(p_dados->>'fabricante_apelido')
        LIMIT 1;

    ELSE
        v_fabricante_id := NULL;
    END IF;

    -- =========================================================================
    -- 5. INSERT NA TABELA CENTRAL items
    -- =========================================================================
    INSERT INTO items (
        localizacao_prateleira,
        localizacao,
        grupo_funcional,
        tipo_ativo,
        fabricante_id,
        modelo_referencia,
        descricao,
        quantidade,
        condicao,
        status,
        observacoes
    )
    VALUES (
        v_localizacao_prat,
        v_localizacao::localizacao_enum,
        v_grupo_funcional::grupo_funcional_enum,
        v_tipo_ativo,
        v_fabricante_id,
        v_modelo_ref,
        v_descricao,
        v_quantidade,
        v_condicao::condicao_enum,
        v_status::status_enum,
        v_observacoes
    )
    RETURNING id INTO v_item_id;

    -- =========================================================================
    -- 6. INSERT EM item_especificacoes (sempre, mesmo que vazio)
    --    O JSONB de especificações técnicas é enviado pelo frontend já montado.
    -- =========================================================================
    INSERT INTO item_especificacoes (item_id, especificacoes)
    VALUES (
        v_item_id,
        CASE
            WHEN p_dados->'especificacoes' IS NOT NULL
            THEN (p_dados->>'especificacoes')::JSONB
            ELSE '{}'::JSONB
        END
    );

    -- =========================================================================
    -- 7. RETORNO
    -- =========================================================================
    v_resultado := json_build_object(
        'id',               v_item_id,
        'grupo_funcional',  v_grupo_funcional,
        'tipo_ativo',       v_tipo_ativo,
        'status',           'ok'
    );

    RETURN v_resultado;

EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'inserir_item_estoque: % — SQLSTATE: %', SQLERRM, SQLSTATE;
END;
$$;

-- GRANT EXECUTE ON FUNCTION inserir_item_estoque(JSON) TO web_anon;

-- =============================================================================
-- SMOKE TESTS
-- =============================================================================
/*
-- Disjuntor
SELECT inserir_item_estoque('{
    "grupo_funcional":    "PROTECAO_CHAVEAMENTO",
    "tipo_ativo":         "DISJUNTOR",
    "quantidade":         3,
    "localizacao":        "GARAGEM",
    "localizacao_prateleira": "DJ 01",
    "fabricante_apelido": "Siemens",
    "modelo_referencia":  "3VU13",
    "especificacoes": "{\"tipo\": \"Motor\", \"polos\": \"Tripolar\", \"tensao_v\": 380, \"corrente_a\": 17.5, \"potencia_kw\": 5.5}"
}'::JSON);

-- Cabo
SELECT inserir_item_estoque('{
    "grupo_funcional": "CONDUTORES",
    "tipo_ativo":      "CABO",
    "quantidade":      200,
    "localizacao":     "GALPAO",
    "fabricante_apelido": "Pirastic",
    "especificacoes": "{\"material\": \"Cobre\", \"bitola_mm2\": 16.0, \"tensao_v\": 750, \"isolamento\": \"PVC 450/750V\"}"
}'::JSON);

-- Relé
SELECT inserir_item_estoque('{
    "grupo_funcional": "PROTECAO_CHAVEAMENTO",
    "tipo_ativo":      "RELE",
    "quantidade":      2,
    "localizacao":     "MEZANINO",
    "fabricante_apelido": "Schneider",
    "modelo_referencia": "RE7TL11BU",
    "especificacoes": "{\"tipo\": \"Temporizador\", \"corrente_min_a\": 0.1, \"corrente_max_a\": 30, \"contatos_na\": 1, \"contatos_nf\": 1, \"faixa_tempo_s\": 30}"
}'::JSON);

-- Verificar:
SELECT id, grupo_funcional, tipo_ativo, descricao FROM items ORDER BY criado_em DESC LIMIT 5;
SELECT * FROM v_estoque_completo ORDER BY criado_em DESC LIMIT 5;
*/
