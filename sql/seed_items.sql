-- =============================================================================
-- ARTREL SGE — Seed de Itens de Estoque
-- Arquivo: seed_items.sql
-- Executar: psql -d sg_artrel -f seed_items.sql
--
-- Um item representativo por tipo_ativo (41 ao total).
-- Cobre todos os grupos funcionais e valida o fluxo completo de inserção:
--   items + item_especificacoes + log_auditoria
-- =============================================================================

BEGIN;

-- =============================================================================
-- GRUPO: PROTECAO_CHAVEAMENTO (7 tipos)
-- =============================================================================

-- 1. DISJUNTOR
SELECT inserir_item_estoque('{
    "grupo_funcional": "PROTECAO_CHAVEAMENTO",
    "tipo_ativo": "DISJUNTOR",
    "fabricante_apelido": "Siemens",
    "modelo_referencia": "3VU13400MJ00",
    "descricao": "Disjuntor motor tripolar 5,5kW",
    "quantidade": 3,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-01",
    "condicao": "NOVO",
    "observacoes": "Disjuntor para proteção de motor de 5,5kW.",
    "especificacoes": {
        "tipo": "Motor",
        "polos": "Tripolar",
        "potencia_kw": 5.5,
        "tensao_nominal_v": 380,
        "tipo_corrente": "AC",
        "corrente_a": 11.0
    }
}'::JSON);

-- 2. MINI_DISJUNTOR
SELECT inserir_item_estoque('{
    "grupo_funcional": "PROTECAO_CHAVEAMENTO",
    "tipo_ativo": "MINI_DISJUNTOR",
    "fabricante_apelido": "Siemens",
    "modelo_referencia": "5SL4316-7",
    "descricao": "Mini disjuntor curva C tripolar 16A",
    "quantidade": 5,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-02",
    "condicao": "NOVO",
    "especificacoes": {
        "curva_funcionamento": "C",
        "polos": "Tripolar",
        "tensao_nominal_v": 230,
        "tipo_corrente": "AC",
        "corrente_a": 16
    }
}'::JSON);

-- 3. RELE
SELECT inserir_item_estoque('{
    "grupo_funcional": "PROTECAO_CHAVEAMENTO",
    "tipo_ativo": "RELE",
    "fabricante_apelido": "Schneider",
    "modelo_referencia": "RE7TL11BU",
    "descricao": "Relé temporizador multifunção",
    "quantidade": 2,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-03",
    "condicao": "USADO",
    "observacoes": "Faixa de tempo até 30s.",
    "especificacoes": {
        "tipo": "Temporizador",
        "contatos_na": 1,
        "contatos_nf": 1,
        "faixa_tempo_s": 30,
        "tensao_nominal_v": 230,
        "tipo_corrente": "AC",
        "corrente_a": 8
    }
}'::JSON);

-- 4. FUSIVEL
SELECT inserir_item_estoque('{
    "grupo_funcional": "PROTECAO_CHAVEAMENTO",
    "tipo_ativo": "FUSIVEL",
    "fabricante_apelido": "Schneider",
    "modelo_referencia": "DF2CA32",
    "descricao": "Fusível NH 32A 500V",
    "quantidade": 10,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-04",
    "condicao": "NOVO",
    "especificacoes": {
        "tipo": "NH",
        "tensao_nominal_v": 500,
        "tipo_corrente": "AC",
        "corrente_a": 32
    }
}'::JSON);

-- 5. CHAVE
SELECT inserir_item_estoque('{
    "grupo_funcional": "PROTECAO_CHAVEAMENTO",
    "tipo_ativo": "CHAVE",
    "fabricante_apelido": "Kraus e Naimer",
    "modelo_referencia": "CA10-A211-600E",
    "descricao": "Chave seccionadora 3P 25A",
    "quantidade": 1,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "B-01",
    "condicao": "NOVO",
    "especificacoes": {
        "tipo": "Seccionadora",
        "tensao_nominal_v": 400,
        "tipo_corrente": "AC",
        "corrente_a": 25
    }
}'::JSON);

-- 6. PARA_RAIO
SELECT inserir_item_estoque('{
    "grupo_funcional": "PROTECAO_CHAVEAMENTO",
    "tipo_ativo": "PARA-RAIO",
    "fabricante_apelido": "Phoenix",
    "modelo_referencia": "VAL-MS 385",
    "descricao": "DPS classe II 385V",
    "quantidade": 4,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "B-02",
    "condicao": "NOVO",
    "especificacoes": {
        "material": "Óxido de Zinco",
        "tensao_nominal_v": 385,
        "corrente_ka": 20
    }
}'::JSON);

-- 7. BARRA_ATERRAMENTO
SELECT inserir_item_estoque('{
    "grupo_funcional": "PROTECAO_CHAVEAMENTO",
    "tipo_ativo": "BARRA_DE_ATERRAMENTO",
    "fabricante_apelido": "Outros",
    "modelo_referencia": "BAR-25mm2",
    "descricao": "Barra de aterramento 25mm² 10 bornes",
    "quantidade": 2,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "B-03",
    "condicao": "NOVO"
}'::JSON);

-- =============================================================================
-- GRUPO: CONDUTORES (3 tipos)
-- =============================================================================

-- 8. CABO
SELECT inserir_item_estoque('{
    "grupo_funcional": "CONDUTORES",
    "tipo_ativo": "CABO",
    "fabricante_apelido": "Pirastic",
    "modelo_referencia": "FLEXIVEL-16MM2-PVC",
    "descricao": "Cabo flexível 16mm² PVC verde/amarelo",
    "quantidade": 200,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-01",
    "condicao": "NOVO",
    "observacoes": "Bobina de 200m. Terra.",
    "especificacoes": {
        "material": "Cobre",
        "bitola_mm2": 16.0,
        "isolamento": "PVC 450/750V",
        "tipo_corrente": "AC",
        "tensao_isolamento": 750
    }
}'::JSON);

-- 9. BARRAMENTO
SELECT inserir_item_estoque('{
    "grupo_funcional": "CONDUTORES",
    "tipo_ativo": "BARRAMENTO",
    "fabricante_apelido": "Real Perfil",
    "modelo_referencia": "BN-40x5",
    "descricao": "Barramento de cobre nu 40x5mm — fase",
    "quantidade": 3,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-02",
    "condicao": "NOVO",
    "observacoes": "Barras de 2m."
}'::JSON);

-- 10. BARRA_CHATA
SELECT inserir_item_estoque('{
    "grupo_funcional": "CONDUTORES",
    "tipo_ativo": "BARRA_CHATA",
    "fabricante_apelido": "Real Perfil",
    "modelo_referencia": "BCC-25x3",
    "descricao": "Barra chata de cobre 25x3mm trilho DIN",
    "quantidade": 5,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-03",
    "condicao": "NOVO"
}'::JSON);

-- =============================================================================
-- GRUPO: CONTATORES (1 tipo)
-- =============================================================================

-- 11. CONTATOR
SELECT inserir_item_estoque('{
    "grupo_funcional": "CONTATORES",
    "tipo_ativo": "CONTATOR",
    "fabricante_apelido": "Siemens",
    "modelo_referencia": "3RT2015-1BB41",
    "descricao": "Contator AC 7A 3P + 1NA bobina 24VDC",
    "quantidade": 4,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-05",
    "condicao": "NOVO",
    "especificacoes": {
        "tipo": "AC",
        "polos": 3,
        "contatos_na": 1,
        "contatos_nf": 0,
        "tensao_nominal_v": 24,
        "tipo_corrente": "DC",
        "corrente_a": 7
    }
}'::JSON);

-- =============================================================================
-- GRUPO: DISPOSITIVOS_PARTIDA (3 tipos)
-- =============================================================================

-- 12. SOFTSTARTER
SELECT inserir_item_estoque('{
    "grupo_funcional": "DISPOSITIVOS_PARTIDA",
    "tipo_ativo": "SOFTSTARTER",
    "fabricante_apelido": "WEG",
    "modelo_referencia": "SSW070017T3546E7Z",
    "descricao": "Softstarter WEG 17A 7,5kW 380V",
    "quantidade": 1,
    "localizacao": "MEZANINO",
    "localizacao_prateleira": "M-01",
    "condicao": "USADO",
    "observacoes": "Motor de 7,5kW bomba centrífuga."
}'::JSON);

-- 13. INVERSOR
SELECT inserir_item_estoque('{
    "grupo_funcional": "DISPOSITIVOS_PARTIDA",
    "tipo_ativo": "INVERSOR",
    "fabricante_apelido": "WEG",
    "modelo_referencia": "CFW110055T4ON1H00G2",
    "descricao": "Inversor de frequência WEG 5,5kW 380V",
    "quantidade": 1,
    "localizacao": "MEZANINO",
    "localizacao_prateleira": "M-02",
    "condicao": "USADO"
}'::JSON);

-- 14. CHAVE_COMPENSADORA
SELECT inserir_item_estoque('{
    "grupo_funcional": "DISPOSITIVOS_PARTIDA",
    "tipo_ativo": "CHAVE_COMPENSADORA",
    "fabricante_apelido": "WEG",
    "modelo_referencia": "CH-15",
    "descricao": "Chave compensadora WEG 15kW 380V",
    "quantidade": 1,
    "localizacao": "MEZANINO",
    "localizacao_prateleira": "M-03",
    "condicao": "NOVO"
}'::JSON);

-- =============================================================================
-- GRUPO: PAINEL_AUTOMACAO (8 tipos)
-- =============================================================================

-- 15. CAIXA
SELECT inserir_item_estoque('{
    "grupo_funcional": "PAINEL_AUTOMACAO",
    "tipo_ativo": "CAIXA",
    "fabricante_apelido": "Steck",
    "modelo_referencia": "SQ4102",
    "descricao": "Caixa de sobrepor 4x2 standard",
    "quantidade": 8,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-06",
    "condicao": "NOVO"
}'::JSON);

-- 16. PAINEL
SELECT inserir_item_estoque('{
    "grupo_funcional": "PAINEL_AUTOMACAO",
    "tipo_ativo": "PAINEL",
    "fabricante_apelido": "Outros",
    "modelo_referencia": "QD-BOMBA-01",
    "descricao": "Quadro de distribuição bomba — sem uso",
    "quantidade": 1,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-04",
    "condicao": "USADO",
    "observacoes": "Painel desmontado. Reaproveitável."
}'::JSON);

-- 17. BOTAO
SELECT inserir_item_estoque('{
    "grupo_funcional": "PAINEL_AUTOMACAO",
    "tipo_ativo": "BOTAO",
    "fabricante_apelido": "Telemecanique",
    "modelo_referencia": "ZA2BA3",
    "descricao": "Botão de comando verde 1NA",
    "quantidade": 6,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-07",
    "condicao": "NOVO"
}'::JSON);

-- 18. BOTOEIRA
SELECT inserir_item_estoque('{
    "grupo_funcional": "PAINEL_AUTOMACAO",
    "tipo_ativo": "BOTOEIRA",
    "fabricante_apelido": "Telemecanique",
    "modelo_referencia": "XALD01",
    "descricao": "Botoeira plástica 1 botão + emergência",
    "quantidade": 2,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-08",
    "condicao": "USADO"
}'::JSON);

-- 19. REGULADOR
SELECT inserir_item_estoque('{
    "grupo_funcional": "PAINEL_AUTOMACAO",
    "tipo_ativo": "REGULADOR",
    "fabricante_apelido": "Woodward",
    "modelo_referencia": "EGCP-2 LS",
    "descricao": "Regulador AVR painel de gerador",
    "quantidade": 1,
    "localizacao": "MEZANINO",
    "localizacao_prateleira": "M-04",
    "condicao": "USADO",
    "observacoes": "Retirado de gerador Cummins 250kVA."
}'::JSON);

-- 20. CLP
SELECT inserir_item_estoque('{
    "grupo_funcional": "PAINEL_AUTOMACAO",
    "tipo_ativo": "CLP",
    "fabricante_apelido": "Panasonic",
    "modelo_referencia": "FP-X0L40MER-A",
    "descricao": "CLP Panasonic FP-X 40I/O 24VDC",
    "quantidade": 1,
    "localizacao": "MEZANINO",
    "localizacao_prateleira": "M-05",
    "condicao": "NOVO",
    "observacoes": "Na embalagem original."
}'::JSON);

-- 21. SOLENOIDE
SELECT inserir_item_estoque('{
    "grupo_funcional": "PAINEL_AUTOMACAO",
    "tipo_ativo": "SOLENOIDE",
    "fabricante_apelido": "Binder",
    "modelo_referencia": "985-24VDC-G1/4",
    "descricao": "Válvula solenoide 24VDC G1/4 NC",
    "quantidade": 3,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-05",
    "condicao": "NOVO"
}'::JSON);

-- 22. CAPACITOR
SELECT inserir_item_estoque('{
    "grupo_funcional": "PAINEL_AUTOMACAO",
    "tipo_ativo": "CAPACITOR",
    "fabricante_apelido": "WEG",
    "modelo_referencia": "BCWR6-440V",
    "descricao": "Capacitor para correção de FP 6kVAr 440V",
    "quantidade": 2,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-06",
    "condicao": "NOVO"
}'::JSON);

-- =============================================================================
-- GRUPO: ACESSORIOS (4 tipos)
-- =============================================================================

-- 23. CONTATO_AUXILIAR
SELECT inserir_item_estoque('{
    "grupo_funcional": "ACESSORIOS",
    "tipo_ativo": "CONTATO_AUXILIAR",
    "fabricante_apelido": "Schneider",
    "modelo_referencia": "LAD8N11",
    "descricao": "Bloco contato auxiliar 1NA+1NF p/ contator LC1",
    "quantidade": 5,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-09",
    "condicao": "NOVO",
    "especificacoes": {
        "contatos_na": 1,
        "contatos_nf": 1,
        "tipo_corrente": "AC",
        "corrente_a": 10
    }
}'::JSON);

-- 24. EXTINTOR
SELECT inserir_item_estoque('{
    "grupo_funcional": "ACESSORIOS",
    "tipo_ativo": "EXTINTOR",
    "fabricante_apelido": "Outros",
    "modelo_referencia": "PO6-ABC",
    "descricao": "Extintor pó químico seco 6kg ABC",
    "quantidade": 2,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-10",
    "condicao": "NOVO",
    "observacoes": "Validade: 12/2026."
}'::JSON);

-- 25. PUNHO_MANOBRA
SELECT inserir_item_estoque('{
    "grupo_funcional": "ACESSORIOS",
    "tipo_ativo": "PUNHO_DE_MANOBRA",
    "fabricante_apelido": "Siemens",
    "modelo_referencia": "3KD9201-1",
    "descricao": "Punho rotativo para seccionadora 3KD",
    "quantidade": 1,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-11",
    "condicao": "NOVO"
}'::JSON);

-- 26. CURVA
SELECT inserir_item_estoque('{
    "grupo_funcional": "ACESSORIOS",
    "tipo_ativo": "curva_funcionamento",
    "fabricante_apelido": "Pirastic",
    "modelo_referencia": "CURVA-34-90G",
    "descricao": "Curva 90° para eletroduto PVC 3/4\"",
    "quantidade": 12,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-07",
    "condicao": "NOVO"
}'::JSON);

-- =============================================================================
-- GRUPO: INFRAESTRUTURA_FERRAGEM (12 tipos)
-- =============================================================================

-- 27. PARAFUSO
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "PARAFUSO",
    "fabricante_apelido": "Inbrac",
    "modelo_referencia": "M6x20-SEXT-ZN",
    "descricao": "Parafuso sextavado M6x20 zincado",
    "quantidade": 100,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-08",
    "condicao": "NOVO"
}'::JSON);

-- 28. PORCA
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "PORCA",
    "fabricante_apelido": "Inbrac",
    "modelo_referencia": "M6-SEXT-ZN",
    "descricao": "Porca sextavada M6 zincada",
    "quantidade": 100,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-08",
    "condicao": "NOVO"
}'::JSON);

-- 29. ARRUELA
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "ARRUELA",
    "fabricante_apelido": "Inbrac",
    "modelo_referencia": "M6-LISA-ZN",
    "descricao": "Arruela lisa M6 zincada",
    "quantidade": 200,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-08",
    "condicao": "NOVO"
}'::JSON);

-- 30. TERMINAL
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "TERMINAL",
    "fabricante_apelido": "Phoenix",
    "modelo_referencia": "PTFIX-1,5-BU",
    "descricao": "Terminal de passagem 1,5mm² azul — trilho DIN",
    "quantidade": 50,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-12",
    "condicao": "NOVO"
}'::JSON);

-- 31. MUFLA
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "MUFLA",
    "fabricante_apelido": "Conexcel",
    "modelo_referencia": "MU-70MM2-BIEL",
    "descricao": "Mufla de terminação p/ cabo 70mm²",
    "quantidade": 4,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-09",
    "condicao": "NOVO"
}'::JSON);

-- 32. BUCHA
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "BUCHA",
    "fabricante_apelido": "Pirastic",
    "modelo_referencia": "BUCHA-34-PVC",
    "descricao": "Bucha de passagem PVC 3/4\"",
    "quantidade": 20,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-09",
    "condicao": "NOVO"
}'::JSON);

-- 33. ELETRODUTO
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "ELETRODUTO",
    "fabricante_apelido": "Pirastic",
    "modelo_referencia": "EDUT-34-PVC-RIGID",
    "descricao": "Eletroduto PVC rígido 3/4\" 3m",
    "quantidade": 10,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-10",
    "condicao": "NOVO"
}'::JSON);

-- 34. ELETROCALHA
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "ELETROCALHA",
    "fabricante_apelido": "Real Perfil",
    "modelo_referencia": "ECA-150x50-VC",
    "descricao": "Eletrocalha perfurada 150x50mm — 3m",
    "quantidade": 5,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-10",
    "condicao": "NOVO"
}'::JSON);

-- 35. LEITO
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "LEITO",
    "fabricante_apelido": "Real Perfil",
    "modelo_referencia": "LB-300-HDG",
    "descricao": "Leito para cabos 300mm galvanizado — 3m",
    "quantidade": 2,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-11",
    "condicao": "NOVO"
}'::JSON);

-- 36. CONDULETE
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "CONDULETE",
    "fabricante_apelido": "Pirastic",
    "modelo_referencia": "LB-34-AL",
    "descricao": "Condulete tipo LB alumínio 3/4\"",
    "quantidade": 6,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-11",
    "condicao": "NOVO"
}'::JSON);

-- 37. UNIDUTE
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "UNIDUTE",
    "fabricante_apelido": "Pirastic",
    "modelo_referencia": "UNI-34-PVC",
    "descricao": "Conector unidute PVC 3/4\"",
    "quantidade": 15,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "C-12",
    "condicao": "NOVO"
}'::JSON);

-- 38. PLACA
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "PLACA",
    "fabricante_apelido": "Outros",
    "modelo_referencia": "ID-PAINEL-01",
    "descricao": "Placa de identificação de painel — adesiva",
    "quantidade": 10,
    "localizacao": "GARAGEM",
    "localizacao_prateleira": "A-13",
    "condicao": "NOVO"
}'::JSON);

-- =============================================================================
-- GRUPO: TRANSFORMADORES (3 tipos)
-- =============================================================================

-- 39. TRANSFORMADOR_TENSAO
SELECT inserir_item_estoque('{
    "grupo_funcional": "TRANSFORMADORES",
    "tipo_ativo": "TRANSFORMADOR_DE_TENSAO",
    "fabricante_apelido": "Renz",
    "modelo_referencia": "TP-6VA-220-110",
    "descricao": "Transformador de potencial 6VA 220/110V",
    "quantidade": 1,
    "localizacao": "MEZANINO",
    "localizacao_prateleira": "M-06",
    "condicao": "NOVO"
}'::JSON);

-- 40. TRANSFORMADOR_CORRENTE
SELECT inserir_item_estoque('{
    "grupo_funcional": "TRANSFORMADORES",
    "tipo_ativo": "TRANSFORMADOR_DE_CORRENTE",
    "fabricante_apelido": "Renz",
    "modelo_referencia": "TC-100-5-15VA",
    "descricao": "TC de corrente 100/5A 15VA classe 0.5",
    "quantidade": 3,
    "localizacao": "MEZANINO",
    "localizacao_prateleira": "M-07",
    "condicao": "USADO",
    "observacoes": "Retirado de QGBT — testado, funcional."
}'::JSON);

-- 41. AUTOTRANSFORMADOR
SELECT inserir_item_estoque('{
    "grupo_funcional": "TRANSFORMADORES",
    "tipo_ativo": "AUTOTRANSFORMADOR",
    "fabricante_apelido": "WB",
    "modelo_referencia": "AT-5KVA-220-380",
    "descricao": "Autotransformador 5kVA 220/380V elevador",
    "quantidade": 1,
    "localizacao": "MEZANINO",
    "localizacao_prateleira": "M-08",
    "condicao": "NOVO"
}'::JSON);

-- =============================================================================
-- GRUPO: INFRAESTRUTURA_FERRAGEM — novos ativos (6 tipos)
-- =============================================================================

-- CRUZETA_FIBRA
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "CRUZETA_FIBRA",
    "descricao": "Cruzeta de fibra de vidro 1800mm",
    "quantidade": 10,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "G-01",
    "condicao": "NOVO",
    "especificacoes": {
        "comprimento_mm": 1800,
        "seccao_transversal": "90x90"
    }
}'::JSON);

-- ALCA_PREFORMADA
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "ALCA_PREFORMADA",
    "descricao": "Alça pré-formada de distribuição p/ cabo de alumínio",
    "quantidade": 20,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "G-02",
    "condicao": "NOVO",
    "especificacoes": {
        "tipo": "p/ cabo de alumínio"
    }
}'::JSON);

-- ARMACAO_SECUNDARIA
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "ARMACAO_SECUNDARIA",
    "descricao": "Armação secundária 1x2 pesado",
    "quantidade": 8,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "G-03",
    "condicao": "NOVO",
    "especificacoes": {
        "estribos": "1x2",
        "tipo": "pesado"
    }
}'::JSON);

-- CINTA_CIRCULAR
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "CINTA_CIRCULAR",
    "descricao": "Cinta circular diâmetro interno 38mm",
    "quantidade": 30,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "G-04",
    "condicao": "NOVO",
    "especificacoes": {
        "diametro_mm": 38
    }
}'::JSON);

-- ISOLADOR
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "ISOLADOR",
    "descricao": "Isolador de ancoragem em porcelana 15kV",
    "quantidade": 12,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "G-05",
    "condicao": "NOVO",
    "especificacoes": {
        "tipo": "de ancoragem",
        "material": "porcelana",
        "tensao_isolamento": 15000
    }
}'::JSON);

-- MAO_FRANCESA
SELECT inserir_item_estoque('{
    "grupo_funcional": "INFRAESTRUTURA_FERRAGEM",
    "tipo_ativo": "MAO_FRANCESA",
    "descricao": "Mão francesa plana 300mm",
    "quantidade": 15,
    "localizacao": "GALPAO",
    "localizacao_prateleira": "G-06",
    "condicao": "NOVO",
    "especificacoes": {
        "tipo": "plana",
        "comprimento_mm": 300
    }
}'::JSON);

-- =============================================================================
-- COMMIT
-- =============================================================================

COMMIT;

-- =============================================================================
-- VERIFICAÇÃO PÓS-SEED
-- =============================================================================
-- Descomente para validar após executar o seed:
/*
SELECT
    grupo_funcional,
    tipo_ativo,
    fabricante,
    modelo_referencia,
    quantidade,
    localizacao,
    status,
    especificacoes
FROM v_estoque_completo
ORDER BY grupo_funcional, tipo_ativo;

-- Contagem por grupo
SELECT grupo_funcional, COUNT(*) AS total
FROM v_estoque_completo
GROUP BY grupo_funcional
ORDER BY grupo_funcional;

-- Verificar auditoria (deve ter 41 registros INSERT)
SELECT COUNT(*), operacao FROM log_auditoria GROUP BY operacao;
*/
