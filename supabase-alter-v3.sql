-- Nova tabela para simulações extras (Monte Carlo, Stress, Cisne Negro, Fluxo Mensal)
-- Rodar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS simulacoes_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('monte_carlo', 'stress_test', 'cisne_negro', 'fluxo_mensal')),
  dados jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(plano, tipo)
);

ALTER TABLE simulacoes_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "simulacoes_read" ON simulacoes_extras
  FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir insert/update com service key (script Python)
CREATE POLICY "simulacoes_write" ON simulacoes_extras
  FOR ALL USING (true);
