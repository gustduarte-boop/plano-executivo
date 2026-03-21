-- ALTER TABLE: adicionar colunas faltantes em patrimonio_calculado
-- Rodar no SQL Editor do Supabase

ALTER TABLE patrimonio_calculado
  ADD COLUMN IF NOT EXISTS savings_brl numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pension_brl numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cripto_brl numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fundo_sar_brl numeric(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ouro_brl numeric(14,2) DEFAULT 0;
