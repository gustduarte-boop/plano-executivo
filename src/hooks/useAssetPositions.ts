import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface AssetPosition {
  id: string
  instituicao: string
  ativo: string
  valor: number
  moeda: string
  data_ref: string
}

export function useAssetPositions() {
  const [data, setData] = useState<AssetPosition[]>([])
  const [loading, setLoading] = useState(true)

  const reload = () => {
    setLoading(true)
    supabase
      .from('asset_positions')
      .select('id, instituicao, ativo, valor, moeda, data_ref')
      .order('data_ref', { ascending: true })
      .then(({ data: rows }) => {
        setData(rows || [])
        setLoading(false)
      })
  }

  useEffect(() => { reload() }, [])

  return { data, loading, reload }
}
