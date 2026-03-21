export interface Saldo {
  id: string
  user_id: string
  data_ref: string // YYYY-MM-DD
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
  plano: 'sprint' | 'terceira_margem' | 'master'
  cenario: 'ultra' | 'pessim' | 'base' | 'otim'
  patrimonio_total_brl: number
  ibkr_brl: number
  cdi_brl: number
  lci_brl: number
  im1_brl: number
  im2_brl: number
  renda_passiva_brl: number
  created_at: string
}

export type Plano = 'sprint' | 'terceira_margem' | 'master'
export type Cenario = 'ultra' | 'pessim' | 'base' | 'otim'
