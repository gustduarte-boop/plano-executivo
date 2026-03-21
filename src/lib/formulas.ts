/**
 * Fórmulas financeiras replicadas dos scripts Python.
 * Usadas para cálculos no frontend (FIG 6 heatmaps, FIG 7 cobertura).
 */

// ── PREMISSAS COMUNS ──
export const CAMBIO = 5.80
export const IPCA = 0.045
export const CDI = 0.105
export const SELIC = 0.1325
export const CDI_LIQ_FATOR = 0.8835
export const CUSTO_HOJE = 14_000
export const MANUT_MES = 2_000
export const N_MONTHS = 84

// Imóvel 1
export const IM1_START = 8   // set/2026
export const IM1_BASE = 136_195
export const IM1_CAPEX_BASE = 170_000

// Imóvel 2
export const IM2_TERRENO = 523_000
export const IM2_CAPEX_BASE = 700_000
export const SPE = 0.66
export const N_SUITES = 6
export const TICK_ALTA = 1_300
export const TICK_OMBRO = 1_000
export const TICK_BAIXA = 900
export const IM1_OPEX = 0.21

// Im.1 tickets base
const IM1_TICK = { alta: 720, ombro: 530, baixa: 430, rev: 1100 }
const IM1_NOIT = { alta: 45, ombro: 75, baixa: 55, rev: 7 }

// Plano de saúde
const SAUDE_2026 = 1_100
const SAUDE_REAJ = 0.10

// Timeline por plano
export const TIMELINE = {
  sprint:          { migrate: 18, transition: 19, salary: 27, im2Start: 19 },
  terceira_margem: { migrate: 26, transition: 27, salary: 39, im2Start: 21 },
  master:          { migrate: 38, transition: 39, salary: 47, im2Start: 21 },
} as const

export type PlanoKey = keyof typeof TIMELINE

// ── FUNÇÕES ──

export function custoVida(m: number): number {
  return CUSTO_HOJE * Math.pow(1 + IPCA / 12, Math.max(0, m - 2))
}

export function planoSaude(mDesdeRetorno: number): number {
  const anos = mDesdeRetorno / 12
  const base = SAUDE_2026 * Math.pow(1 + SAUDE_REAJ, 3 + anos)
  const idade = 53 + Math.floor(anos)
  let mult = 1.0
  if (idade >= 49) mult = 1.80
  else if (idade >= 44) mult = 1.32
  return base * mult
}

export function custoTotal(m: number, transitionM: number): number {
  if (m < transitionM) return 0
  const mRet = m - transitionM
  return custoVida(m) + planoSaude(mRet) + MANUT_MES
}

export function irpfAluguel(rimBruta: number): number {
  let imp: number
  if (rimBruta <= 2_428.80) imp = 0
  else if (rimBruta <= 2_826.65) imp = (rimBruta - 2_428.80) * 0.075
  else if (rimBruta <= 3_751.05) imp = (2_826.65 - 2_428.80) * 0.075 + (rimBruta - 2_826.65) * 0.15
  else if (rimBruta <= 4_664.68) imp = (2_826.65 - 2_428.80) * 0.075 + (3_751.05 - 2_826.65) * 0.15 + (rimBruta - 3_751.05) * 0.225
  else imp = (2_826.65 - 2_428.80) * 0.075 + (3_751.05 - 2_826.65) * 0.15 + (4_664.68 - 3_751.05) * 0.225 + (rimBruta - 4_664.68) * 0.275

  if (rimBruta <= 5_000) return 0
  if (rimBruta <= 7_350) return imp * ((rimBruta - 5_000) / 2_350)
  return imp
}

export function rimLiq(rimBruta: number): number {
  return Math.max(0, rimBruta - irpfAluguel(rimBruta))
}

// ── RENDA IM.1 ──
export function rendaIm1(m: number, tickFator = 1.0, fracOcc = 1.0): number {
  if (m < IM1_START) return 0
  const age = m - IM1_START
  const mat = age < 8 ? 0.85 : 1.0
  const ipca = Math.pow(1 + IPCA / 12, age)
  const brutoAnual = IM1_TICK.alta * IM1_NOIT.alta + IM1_TICK.ombro * IM1_NOIT.ombro +
    IM1_TICK.baixa * IM1_NOIT.baixa + IM1_TICK.rev * IM1_NOIT.rev
  const brutoMes = (brutoAnual / 12) * mat * ipca * tickFator * fracOcc * (1 - IM1_OPEX)
  return rimLiq(brutoMes)
}

// ── RENDA IM.2 ──
export function rendaIm2(m: number, im2Start: number, tickFator = 1.0, fracOcc = 1.0): number {
  if (m < im2Start) return 0
  const age = m - im2Start
  let frac: number
  if (age < 12) frac = 0.70
  else if (age < 24) frac = 0.85
  else frac = 1.0

  const ipca = Math.pow(1 + IPCA / 12, age)
  const alta = TICK_ALTA * frac * ipca * tickFator
  const ombro = TICK_OMBRO * frac * ipca * tickFator
  const baixa = TICK_BAIXA * frac * ipca * tickFator
  const bruto = N_SUITES * (108 * alta + 54 * ombro + 19 * baixa) * 0.75 * SPE * fracOcc / 12
  return rimLiq(bruto)
}

export function rendaTotal(m: number, im2Start: number, tickFator = 1.0, fracOcc = 1.0): number {
  return rendaIm1(m, tickFator, fracOcc) + rendaIm2(m, im2Start, tickFator, fracOcc)
}

// ── SENSIBILIDADE (FIG 6) ──

// T1: CAPEX × Câmbio → renda passiva abr/2029
export function rpCapexCambio(_fatorCap: number, cambio: number, mRef: number, im2Start: number): number {
  // CAPEX afeta valor criado, não renda diretamente no modelo simplificado
  // Câmbio afeta IBKR passivo (4% × saldo)
  const rim = rendaTotal(mRef, im2Start)
  // IBKR passivo estimado: ~USD 30k × 4%/12 × câmbio (simplificado)
  const ibkrPassivo = 30_000 * 0.04 / 12 * cambio
  return (rim + ibkrPassivo) / 1000
}

// T2: Câmbio × Ocupação → renda passiva
export function rpCambioOcc(cambio: number, occ: number, mRef: number, im2Start: number): number {
  const rim = rendaTotal(mRef, im2Start, 1.0, occ)
  const ibkrPassivo = 30_000 * 0.04 / 12 * cambio
  return (rim + ibkrPassivo) / 1000
}

// T3: Ticket × Ocupação → renda passiva
export function rpTicketOcc(tickFator: number, occ: number, mRef: number, im2Start: number): number {
  return rendaTotal(mRef, im2Start, tickFator, occ) / 1000
}

// T4: Renda imobiliária × CDI → renda total mensal
export function rpRendaCdi(rimMult: number, cdiRate: number, mRef: number, im2Start: number): number {
  const rim = rendaTotal(mRef, im2Start) * rimMult
  // CDI sobre reserva R$200k
  const cdiRenda = 200_000 * cdiRate * CDI_LIQ_FATOR / 12
  return (rim + cdiRenda) / 1000
}

// Gera matriz de sensibilidade
export function gerarMatriz(
  rowVals: number[], colVals: number[],
  fn: (row: number, col: number) => number
): number[][] {
  return rowVals.map((r) => colVals.map((c) => parseFloat(fn(r, c).toFixed(1))))
}
