import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PatrimonioCalculado, Plano, Cenario, ChartDataPoint, SaldoReal } from '../types/database'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function dataRefToLabel(dataRef: string): string {
  const [ano, mes] = dataRef.split('-')
  return `${MONTHS_PT[parseInt(mes) - 1]}/${ano}`
}

export function usePatrimonio(plano: Plano, cenario: Cenario) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('patrimonio_calculado')
      .select('*')
      .eq('plano', plano)
      .eq('cenario', cenario)
      .order('data_ref')
      .then(({ data: rows, error }) => {
        if (error || !rows) {
          console.error('Erro ao carregar patrimônio:', error)
          setData([])
          setLoading(false)
          return
        }

        // Amostra a cada 4 meses (como nos relatórios)
        const sampled = rows.filter((_, i) => i % 4 === 0)

        const points: ChartDataPoint[] = sampled.map((r: PatrimonioCalculado) => ({
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
        }))

        setData(points)
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
    setLoading(true)
    supabase
      .from('patrimonio_calculado')
      .select('*')
      .eq('plano', plano)
      .order('data_ref')
      .then(({ data: rows, error }) => {
        if (error || !rows) {
          setLoading(false)
          return
        }

        const grouped: Record<Cenario, ChartDataPoint[]> = {
          ultra: [], pessim: [], base: [], otim: []
        }

        for (const r of rows as PatrimonioCalculado[]) {
          const point: ChartDataPoint = {
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
          if (grouped[r.cenario]) {
            grouped[r.cenario].push(point)
          }
        }

        // Amostrar a cada 4 meses
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
    setLoading(true)
    supabase
      .from('patrimonio_calculado')
      .select('*')
      .eq('plano', plano)
      .eq('cenario', cenario)
      .order('data_ref')
      .then(({ data: rows, error }) => {
        if (error || !rows) { setData([]); setLoading(false); return }
        const points: ChartDataPoint[] = (rows as PatrimonioCalculado[]).map((r) => ({
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
        }))
        setData(points)
        setLoading(false)
      })
  }, [plano, cenario])

  return { data, loading }
}

export function useSaldosReais() {
  const [data, setData] = useState<SaldoReal[]>([])

  useEffect(() => {
    supabase
      .from('saldos')
      .select('*')
      .order('data_ref')
      .then(({ data: rows }) => {
        if (!rows) return
        const points: SaldoReal[] = rows.map((r) => {
          const cambio = r.cambio_usd_brl || 5.80
          const total = (
            r.ibkr_usd * cambio +
            r.savings_usd * cambio +
            r.pension_usd * cambio +
            r.cdi_brl +
            r.lci_brl +
            r.fundo_sar_brl +
            r.cripto_usd * cambio +
            r.ouro_usd * cambio +
            r.im1_valor_brl +
            r.im2_valor_brl
          )
          return {
            mes: dataRefToLabel(r.data_ref),
            data_ref: r.data_ref,
            total: total / 1e6,
          }
        })
        setData(points)
      })
  }, [])

  return data
}
