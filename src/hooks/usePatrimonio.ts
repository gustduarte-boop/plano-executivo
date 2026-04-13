import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PatrimonioCalculado, Plano, Cenario, ChartDataPoint, SaldoReal } from '../types/database'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function dataRefToLabel(dataRef: string): string {
  const [ano, mes] = dataRef.split('-')
  return `${MONTHS_PT[parseInt(mes) - 1]}/${ano}`
}

function rowToPoint(r: PatrimonioCalculado): ChartDataPoint {
  return {
    mes: dataRefToLabel(r.data_ref),
    data_ref: r.data_ref,
    ibkr: r.ibkr_brl / 1e6,
    savings: r.savings_brl / 1e6,
    pension: r.pension_brl / 1e6,
    cdi: r.cdi_brl / 1e6,
    lci: r.lci_brl / 1e6,
    fundo_sar: r.fundo_sar_brl / 1e6,
    im1: r.im1_brl / 1e6,
    im2: r.im2_brl / 1e6,
    cripto: r.cripto_brl / 1e6,
    ouro: r.ouro_brl / 1e6,
    total: r.patrimonio_total_brl / 1e6,
    renda: r.renda_passiva_brl,
  }
}

export function usePatrimonio(plano: Plano, cenario: Cenario) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('patrimonio_calculado')
      .select('*')
      .eq('plano', plano)
      .eq('cenario', cenario)
      .order('data_ref')
      .then(({ data: rows }) => {
        if (rows) setData(rows.filter((_, i) => i % 4 === 0).map(r => rowToPoint(r as PatrimonioCalculado)))
        setLoading(false)
      })
  }, [plano, cenario])

  return { data, loading }
}

export function useAllCenarios(plano: Plano) {
  const [data, setData] = useState<Record<Cenario, ChartDataPoint[]>>({
    ultra: [], pessim: [], base: [], otim: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('patrimonio_calculado')
      .select('*')
      .eq('plano', plano)
      .order('data_ref')
      .then(({ data: rows }) => {
        if (!rows) { setLoading(false); return }
        const grouped: Record<Cenario, ChartDataPoint[]> = { ultra: [], pessim: [], base: [], otim: [] }
        for (const r of rows as PatrimonioCalculado[]) {
          grouped[r.cenario]?.push(rowToPoint(r))
        }
        for (const key of Object.keys(grouped) as Cenario[]) {
          grouped[key] = grouped[key].filter((_, i) => i % 4 === 0)
        }
        setData(grouped)
        setLoading(false)
      })
  }, [plano])

  return { data, loading }
}

export function usePatrimonioFull(plano: Plano, cenario: Cenario) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('patrimonio_calculado')
      .select('*')
      .eq('plano', plano)
      .eq('cenario', cenario)
      .order('data_ref')
      .then(({ data: rows }) => {
        if (rows) setData((rows as PatrimonioCalculado[]).map(r => rowToPoint(r)))
        setLoading(false)
      })
  }, [plano, cenario])

  return { data, loading }
}

export function useSaldosReais(refreshKey = 0) {
  const [data, setData] = useState<SaldoReal[]>([])

  useEffect(() => {
    supabase
      .from('saldos')
      .select('*')
      .order('data_ref')
      .then(({ data: rows }) => {
        if (!rows) return
        setData(rows.map((r) => {
          const c = r.cambio_usd_brl || 5.25
          const ibkr = r.ibkr_usd * c / 1e6
          const savings = r.savings_usd * c / 1e6
          const pension = r.pension_usd * c / 1e6
          const cdi = r.cdi_brl / 1e6
          const lci = r.lci_brl / 1e6
          const fundo_sar = r.fundo_sar_brl / 1e6
          const cripto = r.cripto_usd * c / 1e6
          const ouro = r.ouro_usd * c / 1e6
          const im1 = r.im1_valor_brl / 1e6
          const im2 = r.im2_valor_brl / 1e6
          const total = ibkr + savings + pension + cdi + lci + fundo_sar + cripto + ouro + im1 + im2
          return { mes: dataRefToLabel(r.data_ref), data_ref: r.data_ref, ibkr, savings, pension, cdi, lci, fundo_sar, cripto, ouro, im1, im2, total }
        }))
      })
  }, [refreshKey])

  return data
}
