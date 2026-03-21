import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Plano } from '../types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonData = any

export function useExtra(plano: Plano, tipo: string) {
  const [data, setData] = useState<JsonData>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('simulacoes_extras')
      .select('dados')
      .eq('plano', plano)
      .eq('tipo', tipo)
      .single()
      .then(({ data: row }) => {
        setData(row?.dados ?? null)
        setLoading(false)
      })
  }, [plano, tipo])

  return { data, loading }
}
