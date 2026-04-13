-- v5: Categorias CAPEX editáveis pelo usuário
-- Rodar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS capex_categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  keywords text DEFAULT '',
  ordem int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE capex_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_own" ON capex_categorias
  FOR ALL USING (auth.uid() = user_id);
