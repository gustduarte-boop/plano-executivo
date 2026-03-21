-- Schema: Plano Executivo
-- Rodar no SQL Editor do Supabase

-- 1. Saldos reais (snapshot mensal dos ativos)
create table if not exists saldos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  data_ref date not null,
  ibkr_usd numeric(14,2) default 0,
  savings_usd numeric(14,2) default 0,
  pension_usd numeric(14,2) default 0,
  cdi_brl numeric(14,2) default 0,
  lci_brl numeric(14,2) default 0,
  fundo_sar_brl numeric(14,2) default 0,
  cripto_usd numeric(14,2) default 0,
  ouro_usd numeric(14,2) default 0,
  im1_valor_brl numeric(14,2) default 0,
  im2_valor_brl numeric(14,2) default 0,
  cambio_usd_brl numeric(6,4) default 5.80,
  notas text,
  created_at timestamptz default now(),
  unique(user_id, data_ref)
);

-- 2. Cotações de referência
create table if not exists cotacoes (
  id uuid primary key default gen_random_uuid(),
  data_ref date not null unique,
  cambio_usd_brl numeric(6,4),
  ipca_aa numeric(6,4),
  cdi_aa numeric(6,4),
  selic_aa numeric(6,4),
  ouro_usd_oz numeric(10,2),
  created_at timestamptz default now()
);

-- 3. CAPEX dos imóveis
create table if not exists capex (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  imovel text not null check (imovel in ('im1', 'im2')),
  descricao text not null,
  valor_orcado numeric(14,2) not null,
  valor_realizado numeric(14,2),
  data_prevista date,
  data_realizada date,
  status text default 'planejado' check (status in ('planejado', 'em_andamento', 'concluido')),
  created_at timestamptz default now()
);

-- 4. Patrimônio calculado (output dos scripts Python)
create table if not exists patrimonio_calculado (
  id uuid primary key default gen_random_uuid(),
  data_ref date not null,
  plano text not null check (plano in ('sprint', 'terceira_margem', 'master')),
  cenario text not null check (cenario in ('ultra', 'pessim', 'base', 'otim')),
  patrimonio_total_brl numeric(14,2) not null,
  ibkr_brl numeric(14,2) default 0,
  cdi_brl numeric(14,2) default 0,
  lci_brl numeric(14,2) default 0,
  im1_brl numeric(14,2) default 0,
  im2_brl numeric(14,2) default 0,
  renda_passiva_brl numeric(14,2) default 0,
  created_at timestamptz default now(),
  unique(data_ref, plano, cenario)
);

-- RLS (Row Level Security)
alter table saldos enable row level security;
alter table capex enable row level security;
alter table cotacoes enable row level security;
alter table patrimonio_calculado enable row level security;

-- Políticas: saldos e capex só do próprio user
create policy "saldos_own" on saldos
  for all using (auth.uid() = user_id);

create policy "capex_own" on capex
  for all using (auth.uid() = user_id);

-- Cotações e patrimônio calculado: leitura para autenticados
create policy "cotacoes_read" on cotacoes
  for select using (auth.role() = 'authenticated');

create policy "patrimonio_read" on patrimonio_calculado
  for select using (auth.role() = 'authenticated');
