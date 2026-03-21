import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Plano, Cenario } from '../types/database'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

interface ComparativoPoint {
  mes: string
  data_ref: string
  sprint: number
  terceira_margem: number
  master: number
}

export function useComparativo(cenario: Cenario) {
  const [data, setData] = useState<ComparativoPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('patrimonio_calculado')
      .select('plano,data_ref,patrimonio_total_brl')
      .eq('cenario', cenario)
      .order('data_ref')
      .then(({ data: rows }) => {
        if (!rows) { setLoading(false); return }

        const byDate: Record<string, Record<string, number>> = {}
        for (const r of rows) {
          if (!byDate[r.data_ref]) byDate[r.data_ref] = {}
          byDate[r.data_ref][r.plano] = r.patrimonio_total_brl / 1e6
        }

        const dates = Object.keys(byDate).sort()
        const sampled = dates.filter((_, i) => i % 4 === 0)

        const points: ComparativoPoint[] = sampled.map((d) => {
          const [ano, mes] = d.split('-')
          return {
            mes: `${MONTHS_PT[parseInt(mes) - 1]}/${ano}`,
            data_ref: d,
            sprint: byDate[d].sprint || 0,
            terceira_margem: byDate[d].terceira_margem || 0,
            master: byDate[d].master || 0,
          }
        })

        setData(points)
        setLoading(false)
      })
  }, [cenario])

  return { data, loading }
}

// Hook para tabela síntese: 3 datas × 3 planos × cenários
interface SinteseRow {
  plano: Plano
  cenario: Cenario
  data_ref: string
  patrimonio_total_brl: number
  ibkr_brl: number
  cdi_brl: number
  lci_brl: number
  im1_brl: number
  im2_brl: number
  renda_passiva_brl: number
}

const DATAS_CHAVE = ['2028-03-01', '2029-04-01', '2032-12-01']

export function useSintese() {
  const [data, setData] = useState<SinteseRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('patrimonio_calculado')
      .select('plano,cenario,data_ref,patrimonio_total_brl,ibkr_brl,cdi_brl,lci_brl,im1_brl,im2_brl,renda_passiva_brl')
      .in('data_ref', DATAS_CHAVE)
      .in('cenario', ['pessim', 'base', 'otim'])
      .order('plano')
      .order('data_ref')
      .then(({ data: rows }) => {
        setData((rows as SinteseRow[]) || [])
        setLoading(false)
      })
  }, [])

  return { data, loading }
}
