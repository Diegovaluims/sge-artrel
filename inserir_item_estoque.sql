-- =============================================================================
-- ARTREL ESTOQUE — Stored Procedure de Inserção via RPC PostgREST
-- Arquivo: inserir_item_estoque.sql
-- Executar: psql -d prototipo-artrel -f inserir_item_estoque.sql
--
-- Endpoint gerado: POST http://localhost:3000/rpc/inserir_item_estoque
-- Body esperado:   { "p_dados": { ...campos... } }
--
-- A procedure é a única porta de entrada para inserção de itens.
-- O front-end não precisa conhecer as tabelas de extensão nem o grupo_funcional.
-- =============================================================================

CREATE OR REPLACE FUNCTION inserir_item_estoque(p_dados JSON)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_categoria         TEXT;
    v_grupo_funcional   TEXT;
    v_fabricante_id     INT;
    v_item_id           UUID;
    v_resultado         JSON;

    -- Campos base (tabela items)
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
    v_categoria        := p_dados->>'categoria';
    v_localizacao_prat := p_dados->>'localizacao_prateleira';
    v_localizacao      := COALESCE(p_dados->>'localizacao', 'GARAGEM');
    v_modelo_ref       := p_dados->>'modelo_referencia';
    v_descricao        := p_dados->>'descricao';
    v_quantidade       := COALESCE((p_dados->>'quantidade')::INT, 0);
    v_condicao         := COALESCE(p_dados->>'condicao', 'NOVO');
    v_status           := COALESCE(p_dados->>'status', 'DISPONIVEL');
    v_observacoes      := p_dados->>'observacoes';

    -- Validação mínima
    IF v_categoria IS NULL THEN
        RAISE EXCEPTION 'Campo obrigatório ausente: categoria';
    END IF;

    -- =========================================================================
    -- 2. DERIVAÇÃO AUTOMÁTICA DO grupo_funcional
    --    (replica a constraint chk_grupo_categoria — front-end não envia este campo)
    -- =========================================================================
    v_grupo_funcional := CASE
        WHEN v_categoria IN ('DISJUNTOR','MINI_DISJUNTOR','FUSIVEL','CHAVE','PARA_RAIO')
            THEN 'PROTECAO_CHAVEAMENTO'
        WHEN v_categoria IN ('CONTATOR','RELE','CONTATO_AUXILIAR','COMANDO_ELETRICO','SOFTSTARTER')
            THEN 'ACIONAMENTO_CONTROLE'
        WHEN v_categoria IN ('TC','TT','AUTOTRANSFORMADOR','INVERSOR_FREQUENCIA','REGULADOR')
            THEN 'TRANSFORMADORES'
        WHEN v_categoria IN ('CLP_IHM','USCA','INSTRUMENTO_SENSOR','CAPACITOR')
            THEN 'AUTOMACAO_MEDICAO'
        WHEN v_categoria IN ('ILUMINACAO','CONECTIVIDADE','FERRAMENTAL_ATUADOR',
                             'FIXADOR_FERRAGEM','CONDUTOR','INFRA_ACONDICIONAMENTO',
                             'TERMINAL_CONEXAO','DISPOSITIVO_MANOBRA',
                             'BATERIA_FONTE','KIT_CONJUNTO')
            THEN 'INFRAESTRUTURA'
        ELSE NULL
    END;

    IF v_grupo_funcional IS NULL THEN
        RAISE EXCEPTION 'Categoria inválida ou não mapeada: %', v_categoria;
    END IF;

    -- =========================================================================
    -- 3. RESOLUÇÃO DO fabricante_id
    --    Aceita três formas no JSON:
    --      a) "fabricante_id": 5                -> usa o ID direto
    --      b) "fabricante_nome": "WEG"           -> lookup por nome exato
    --      c) "fabricante_apelido": "Schneider"  -> lookup por apelido
    --    Se nenhuma for fornecida, fabricante_id fica NULL (permitido pelo schema).
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
    -- 4. INSERT NA TABELA CENTRAL items
    -- =========================================================================
    INSERT INTO items (
        localizacao_prateleira,
        localizacao,
        categoria,
        grupo_funcional,
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
        v_categoria::categoria_enum,
        v_grupo_funcional::grupo_funcional_enum,
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
    -- 5. ROTEAMENTO PARA TABELA DE EXTENSÃO
    --    IF/ELSIF baseado no grupo_funcional derivado no passo 2.
    -- =========================================================================

    -- ------------------------------------------------------------------
    -- EXTENSÃO 1: ext_protecao_chaveamento
    -- Categorias: DISJUNTOR, MINI_DISJUNTOR, FUSIVEL, CHAVE, PARA_RAIO
    -- ------------------------------------------------------------------
    IF v_grupo_funcional = 'PROTECAO_CHAVEAMENTO' THEN

        INSERT INTO ext_protecao_chaveamento (
            item_id,
            subtipo,
            corrente_nominal_a,
            tensao_nominal_v,
            tensao_nominal_kv,
            tipo_tensao,
            numero_polos,
            especificacoes
        )
        VALUES (
            v_item_id,
            p_dados->>'subtipo',
            NULLIF(p_dados->>'corrente_nominal_a', '')::DECIMAL,
            NULLIF(p_dados->>'tensao_nominal_v',   '')::INT,
            NULLIF(p_dados->>'tensao_nominal_kv',  '')::DECIMAL,
            NULLIF(p_dados->>'tipo_tensao',         '')::tipo_tensao_enum,
            NULLIF(p_dados->>'numero_polos',        '')::numero_polos_enum,
            CASE
                WHEN p_dados->'especificacoes' IS NOT NULL
                THEN (p_dados->>'especificacoes')::JSONB
                ELSE NULL
            END
        );

    -- ------------------------------------------------------------------
    -- EXTENSÃO 2: ext_acionamento_controle
    -- Categorias: CONTATOR, RELE, CONTATO_AUXILIAR, COMANDO_ELETRICO, SOFTSTARTER
    -- ------------------------------------------------------------------
    ELSIF v_grupo_funcional = 'ACIONAMENTO_CONTROLE' THEN

        INSERT INTO ext_acionamento_controle (
            item_id,
            subtipo,
            tensao_operacao_v,
            tipo_tensao,
            corrente_min_a,
            corrente_max_a,
            corrente_nominal_a,
            contatos_na,
            contatos_nf,
            especificacoes
        )
        VALUES (
            v_item_id,
            p_dados->>'subtipo',
            NULLIF(p_dados->>'tensao_operacao_v',   '')::INT,
            NULLIF(p_dados->>'tipo_tensao',          '')::tipo_tensao_enum,
            NULLIF(p_dados->>'corrente_min_a',       '')::DECIMAL,
            NULLIF(p_dados->>'corrente_max_a',       '')::DECIMAL,
            NULLIF(p_dados->>'corrente_nominal_a',   '')::DECIMAL,
            NULLIF(p_dados->>'contatos_na',          '')::INT,
            NULLIF(p_dados->>'contatos_nf',          '')::INT,
            CASE
                WHEN p_dados->'especificacoes' IS NOT NULL
                THEN (p_dados->>'especificacoes')::JSONB
                ELSE NULL
            END
        );

    -- ------------------------------------------------------------------
    -- EXTENSÃO 3: ext_transformadores
    -- Categorias: TC, TT, AUTOTRANSFORMADOR, INVERSOR_FREQUENCIA, REGULADOR
    -- ------------------------------------------------------------------
    ELSIF v_grupo_funcional = 'TRANSFORMADORES' THEN

        INSERT INTO ext_transformadores (
            item_id,
            subtipo,
            tensao_entrada_v,
            tensao_saida_v,
            potencia_va,
            corrente_saida_a,
            especificacoes
        )
        VALUES (
            v_item_id,
            p_dados->>'subtipo',
            NULLIF(p_dados->>'tensao_entrada_v',  '')::INT,
            NULLIF(p_dados->>'tensao_saida_v',    '')::INT,
            NULLIF(p_dados->>'potencia_va',       '')::DECIMAL,
            NULLIF(p_dados->>'corrente_saida_a',  '')::DECIMAL,
            CASE
                WHEN p_dados->'especificacoes' IS NOT NULL
                THEN (p_dados->>'especificacoes')::JSONB
                ELSE NULL
            END
        );

    -- ------------------------------------------------------------------
    -- EXTENSÃO 4: ext_automacao_medicao
    -- Categorias: CLP_IHM, USCA, INSTRUMENTO_SENSOR, CAPACITOR
    -- ------------------------------------------------------------------
    ELSIF v_grupo_funcional = 'AUTOMACAO_MEDICAO' THEN

        INSERT INTO ext_automacao_medicao (
            item_id,
            subtipo,
            tensao_alimentacao_v,
            especificacoes
        )
        VALUES (
            v_item_id,
            p_dados->>'subtipo',
            NULLIF(p_dados->>'tensao_alimentacao_v', '')::INT,
            CASE
                WHEN p_dados->'especificacoes' IS NOT NULL
                THEN (p_dados->>'especificacoes')::JSONB
                ELSE NULL
            END
        );

    -- ------------------------------------------------------------------
    -- EXTENSÃO 5: ext_infraestrutura
    -- Categorias: ILUMINACAO, CONECTIVIDADE, FERRAMENTAL_ATUADOR,
    --             FIXADOR_FERRAGEM, CONDUTOR, INFRA_ACONDICIONAMENTO,
    --             TERMINAL_CONEXAO, DISPOSITIVO_MANOBRA, BATERIA_FONTE, KIT_CONJUNTO
    -- ------------------------------------------------------------------
    ELSE

        INSERT INTO ext_infraestrutura (
            item_id,
            subtipo,
            tensao_v,
            corrente_a,
            especificacoes
        )
        VALUES (
            v_item_id,
            p_dados->>'subtipo',
            NULLIF(p_dados->>'tensao_v',   '')::INT,
            NULLIF(p_dados->>'corrente_a', '')::DECIMAL,
            CASE
                WHEN p_dados->'especificacoes' IS NOT NULL
                THEN (p_dados->>'especificacoes')::JSONB
                ELSE NULL
            END
        );

    END IF;

    -- =========================================================================
    -- 6. RETORNO
    -- =========================================================================
    v_resultado := json_build_object(
        'id',              v_item_id,
        'categoria',       v_categoria,
        'grupo_funcional', v_grupo_funcional,
        'status',          'ok'
    );

    RETURN v_resultado;

EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'inserir_item_estoque: % — SQLSTATE: %', SQLERRM, SQLSTATE;
END;
$$;

-- =============================================================================
-- GRANT para a role anônima do PostgREST (db-anon-role = postgres no conf)
-- Como a role anon é 'postgres' (superuser), o GRANT é opcional mas fica aqui
-- como referência para quando a role for separada em produção.
-- =============================================================================
-- GRANT EXECUTE ON FUNCTION inserir_item_estoque(JSON) TO web_anon;

-- =============================================================================
-- SMOKE TEST (execute manualmente para validar após criar a procedure)
-- =============================================================================
/*
-- Teste 1: DISJUNTOR
SELECT inserir_item_estoque('{
    "categoria":         "DISJUNTOR",
    "descricao":         "Disjuntor Motor Tripolar 380V 7,5CV — Smoke Test",
    "quantidade":        1,
    "condicao":          "NOVO",
    "status":            "DISPONIVEL",
    "localizacao":       "GARAGEM",
    "localizacao_prateleira": "DJ 01",
    "fabricante_apelido":"Siemens",
    "modelo_referencia": "3VU13",
    "subtipo":           "Motor",
    "corrente_nominal_a":"17.5",
    "tensao_nominal_v":  "380",
    "tipo_tensao":       "AC",
    "numero_polos":      "TRIPOLAR"
}'::JSON);

-- Teste 2: TC
SELECT inserir_item_estoque('{
    "categoria":         "TC",
    "descricao":         "TC Bipartido 300/5A 0,6kV — Smoke Test",
    "quantidade":        3,
    "condicao":          "USADO",
    "status":            "DISPONIVEL",
    "localizacao":       "GARAGEM",
    "localizacao_prateleira": "TC 01",
    "fabricante_apelido":"Lier",
    "subtipo":           "Bipartido",
    "especificacoes":    "{\"relacao_primario_a\": 300, \"relacao_secundario_a\": 5}"
}'::JSON);

-- Teste 3: RELE
SELECT inserir_item_estoque('{
    "categoria":         "RELE",
    "descricao":         "Relé Temporizador 24VDC — Smoke Test",
    "quantidade":        2,
    "condicao":          "NOVO",
    "status":            "DISPONIVEL",
    "localizacao":       "MEZANINO",
    "fabricante_apelido":"Schneider",
    "modelo_referencia": "RE7TL11BU",
    "subtipo":           "Temporizador",
    "tensao_operacao_v": "24",
    "tipo_tensao":       "DC",
    "contatos_na":       "1",
    "contatos_nf":       "1"
}'::JSON);

-- Verificar resultados:
SELECT id, categoria, descricao FROM items ORDER BY criado_em DESC LIMIT 5;
SELECT * FROM v_estoque_completo ORDER BY criado_em DESC LIMIT 5;
*/
