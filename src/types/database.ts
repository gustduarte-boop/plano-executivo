export interface Saldo {
  id: string
  user_id: string
  data_ref: string
  ibkr_usd: number
  savings_usd: number
  pension_usd: number
  cdi_brl: number
  lci_brl: number
  fundo_sar_brl: number
  cripto_usd: number
  ouro_usd: number
  im1_valor_brl: number
  im2_valor_brl: number
  cambio_usd_brl: number
  notas: string | null
  created_at: string
}

export interface Cotacao {
  id: string
  data_ref: string
  cambio_usd_brl: number
  ipca_aa: number
  cdi_aa: number
  selic_aa: number
  ouro_usd_oz: number | null
  created_at: string
}

export interface Capex {
  id: string
  user_id: string
  imovel: 'im1' | 'im2'
  descricao: string
  valor_orcado: number
  valor_realizado: number | null
  data_prevista: string
  data_realizada: string | null
  status: 'planejado' | 'em_andamento' | 'concluido'
  created_at: string
}

export interface PatrimonioCalculado {
  id: string
  data_ref: string
  plano: Plano
  cenario: Cenario
  patrimonio_total_brl: number
  ibkr_brl: number
  cdi_brl: number
  lci_brl: number
  im1_brl: number
  im2_brl: number
  savings_brl: number
  pension_brl: number
  cripto_brl: number
  fundo_sar_brl: number
  ouro_brl: number
  renda_passiva_brl: number
  created_at: string
}

export type Plano = 'sprint' | 'terceira_margem' | 'master'
export type Cenario = 'ultra' | 'pessim' | 'base' | 'otim'

export interface ChartDataPoint {
  mes: string
  data_ref: string
  ibkr: number
  savings: number
  pension: number
  cdi: number
  lci: number
  fundo_sar: number
  im1: number
  im2: number
  cripto: number
  ouro: number
  total: number
  renda: number
}

export interface SaldoReal {
  mes: string
  data_ref: string
  ibkr: number
  savings: number
  pension: number
  cdi: number
  lci: number
  fundo_sar: number
  cripto: number
  ouro: number
  im1: number
  im2: number
  total: number
}
