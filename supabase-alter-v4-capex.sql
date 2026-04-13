-- v4: Redesenho CAPEX — categoria + tabela de orçamento
-- Rodar no SQL Editor do Supabase

-- 1. Adicionar coluna categoria na tabela capex existente
ALTER TABLE capex
  ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'outros';

-- 2. Tabela de orçamento por categoria
CREATE TABLE IF NOT EXISTS capex_orcamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  imovel text NOT NULL DEFAULT 'im1',
  categoria text NOT NULL,
  valor_orcado numeric(14,2) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, imovel, categoria)
);

ALTER TABLE capex_orcamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orcamento_own" ON capex_orcamento
  FOR ALL USING (auth.uid() = user_id);
