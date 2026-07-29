-- =============================================================================
-- ARTREL ESTOQUE — Auditoria + Stored Procedure de Atualização v2
-- Arquivo: atualizar_item_estoque.sql
-- Executar: psql -d prototipo-artrel -f atualizar_item_estoque.sql
--
-- Endpoint: POST http://localhost:3001/rpc/atualizar_item_estoque
-- Body:      { "p_id": "<uuid>", "p_dados": { ...campos... } }
--
-- A procedure atualiza items e item_especificacoes.
-- grupo_funcional e tipo_ativo são imutáveis após o cadastro.
-- =============================================================================

-- A tabela log_auditoria é criada pelo schema.sql.
-- Este arquivo apenas recria a procedure de atualização.

CREATE OR REPLACE FUNCTION atualizar_item_estoque(p_id UUID, p_dados JSON)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_operacao   TEXT;
    v_antes      JSONB;
    v_resultado  JSON;
BEGIN

    -- =========================================================================
    -- 1. VALIDA EXISTÊNCIA E LÊ SNAPSHOT PARA AUDITORIA
    -- =========================================================================
    SELECT to_jsonb(i) - 'id'
    INTO v_antes
    FROM items i
    WHERE id = p_id;

    IF v_antes IS NULL THEN
        RAISE EXCEPTION 'Item não encontrado: %', p_id;
    END IF;

    -- =========================================================================
    -- 2. TIPO DE OPERAÇÃO PARA AUDITORIA
    -- =========================================================================
    v_operacao := CASE
        WHEN p_dados->>'status' = 'DESCARTADO' THEN 'SOFT_DELETE'
        ELSE 'UPDATE'
    END;

    -- =========================================================================
    -- 3. UPDATE NA TABELA CENTRAL items
    --    grupo_funcional e tipo_ativo são imutáveis — não aparecem aqui.
    --    Apenas campos presentes (não-nulos) no JSON são atualizados.
    -- =========================================================================
    UPDATE items SET
        descricao              = COALESCE(p_dados->>'descricao',              descricao),
        modelo_referencia      = COALESCE(p_dados->>'modelo_referencia',      modelo_referencia),
        quantidade             = COALESCE(NULLIF(p_dados->>'quantidade','')::INT, quantidade),
        condicao               = COALESCE(NULLIF(p_dados->>'condicao','')::condicao_enum,       condicao),
        status                 = COALESCE(NULLIF(p_dados->>'status','')::status_enum,           status),
        localizacao            = COALESCE(NULLIF(p_dados->>'localizacao','')::localizacao_enum, localizacao),
        localizacao_prateleira = COALESCE(p_dados->>'localizacao_prateleira', localizacao_prateleira),
        observacoes            = COALESCE(p_dados->>'observacoes',            observacoes),
        fabricante_id          = CASE
                                   WHEN p_dados->>'fabricante_id' IS NOT NULL
                                   THEN NULLIF(p_dados->>'fabricante_id','')::INT
                                   ELSE fabricante_id
                                 END
    WHERE id = p_id;

    -- =========================================================================
    -- 4. UPDATE EM item_especificacoes (somente se não for soft-delete)
    --    Faz merge do JSONB: mantém chaves existentes, atualiza/adiciona novas.
    --    Se o frontend enviar especificacoes: '{}', limpa as specs.
    -- =========================================================================
    IF v_operacao = 'UPDATE' AND p_dados->'especificacoes' IS NOT NULL THEN
        INSERT INTO item_especificacoes (item_id, especificacoes)
        VALUES (p_id, (p_dados->>'especificacoes')::JSONB)
        ON CONFLICT (item_id) DO UPDATE
            SET especificacoes = (p_dados->>'especificacoes')::JSONB;
    END IF;

    -- =========================================================================
    -- 5. REGISTRO DE AUDITORIA
    -- =========================================================================
    INSERT INTO log_auditoria (item_id, operacao, payload_antes, payload_depois)
    VALUES (p_id, v_operacao, v_antes, p_dados::JSONB);

    -- =========================================================================
    -- 6. RETORNO
    -- =========================================================================
    v_resultado := json_build_object(
        'id',       p_id,
        'operacao', v_operacao,
        'status',   'ok'
    );

    RETURN v_resultado;

EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'atualizar_item_estoque: % — SQLSTATE: %', SQLERRM, SQLSTATE;
END;
$$;

-- GRANT EXECUTE ON FUNCTION atualizar_item_estoque(UUID, JSON) TO web_anon;

-- =============================================================================
-- SMOKE TESTS
-- =============================================================================
/*
-- Atualizar quantidade:
SELECT atualizar_item_estoque(
    (SELECT id FROM items ORDER BY criado_em DESC LIMIT 1),
    '{"quantidade": 10}'::JSON
);

-- Atualizar especificações:
SELECT atualizar_item_estoque(
    (SELECT id FROM items ORDER BY criado_em DESC LIMIT 1),
    '{"especificacoes": "{\"tipo\": \"Motor\", \"polos\": \"Tripolar\", \"tensao_v\": 220, \"corrente_a\": 32}"}'::JSON
);

-- Soft delete:
SELECT atualizar_item_estoque(
    (SELECT id FROM items ORDER BY criado_em DESC LIMIT 1),
    '{"status": "DESCARTADO"}'::JSON
);

-- Verificar auditoria:
SELECT operacao, executado_em FROM log_auditoria ORDER BY executado_em DESC LIMIT 5;
*/
