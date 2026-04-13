import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Capex, CapexOrcamento } from '../types/database'
import { CAPEX_CATEGORIAS } from '../types/database'

const ORCAMENTO_TOTAL_DEFAULT = 210_000

export interface CategoriaItem {
  key: string
  label: string
  keywords: string
  ordem: number
}

export interface CategorySummary {
  budgeted: number
  spent: number
}

export function useCapex(imovel: 'im1' | 'im2' = 'im1') {
  const [entries, setEntries] = useState<Capex[]>([])
  const [budgets, setBudgets] = useState<CapexOrcamento[]>([])
  const [categorias, setCategorias] = useState<CategoriaItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [capexRes, budgetRes, catRes] = await Promise.all([
      supabase
        .from('capex')
        .select('*')
        .eq('user_id', user.id)
        .eq('imovel', imovel)
        .order('data_realizada', { ascending: false, nullsFirst: false }),
      supabase
        .from('capex_orcamento')
        .select('*')
        .eq('user_id', user.id)
        .eq('imovel', imovel),
      supabase
        .from('capex_categorias')
        .select('*')
        .eq('user_id', user.id)
        .order('ordem'),
    ])

    if (capexRes.data) setEntries(capexRes.data as Capex[])
    if (budgetRes.data) setBudgets(budgetRes.data as CapexOrcamento[])

    // Se não tem categorias no banco, faz seed com as padrão
    if (catRes.error) {
      console.error('[useCapex] Error fetching categorias:', catRes.error)
      // Fallback to hardcoded
      setCategorias(CAPEX_CATEGORIAS.map((c, i) => ({ key: c.key, label: c.label, keywords: '', ordem: i })))
    } else if (catRes.data && catRes.data.length > 0) {
      setCategorias(catRes.data as CategoriaItem[])
    } else {
      // Seed
      const seeds = CAPEX_CATEGORIAS.map((c, i) => ({
        user_id: user.id,
        key: c.key,
        label: c.label,
        keywords: '',
        ordem: i,
      }))
      const { error: seedErr } = await supabase.from('capex_categorias').insert(seeds)
      if (seedErr) {
        console.error('[useCapex] Seed error:', seedErr)
      }
      // Re-fetch to get IDs
      const { data: seeded } = await supabase
        .from('capex_categorias')
        .select('*')
        .eq('user_id', user.id)
        .order('ordem')
      if (seeded && seeded.length > 0) {
        setCategorias(seeded as CategoriaItem[])
      } else {
        // Fallback to hardcoded
        setCategorias(CAPEX_CATEGORIAS.map((c, i) => ({ key: c.key, label: c.label, keywords: '', ordem: i })))
      }
    }

    setLoading(false)
  }, [imovel])

  useEffect(() => { fetchAll() }, [fetchAll])

  const byCategory = useMemo(() => {
    const result: Record<string, CategorySummary> = {}
    const cats = categorias.length > 0 ? categorias : CAPEX_CATEGORIAS.map((c, i) => ({ key: c.key, label: c.label, keywords: '', ordem: i }))
    const defaultPerCat = ORCAMENTO_TOTAL_DEFAULT / cats.length

    for (const cat of cats) {
      const budget = budgets.find(b => b.categoria === cat.key)
      const spent = entries
        .filter(e => (e.categoria || 'outros') === cat.key)
        .reduce((sum, e) => sum + (e.valor_realizado || 0), 0)
      result[cat.key] = {
        budgeted: budget ? budget.valor_orcado : defaultPerCat,
        spent,
      }
    }
    return result
  }, [entries, budgets, categorias])

  const totalBudget = useMemo(
    () => Object.values(byCategory).reduce((s, c) => s + c.budgeted, 0),
    [byCategory]
  )
  const totalSpent = useMemo(
    () => Object.values(byCategory).reduce((s, c) => s + c.spent, 0),
    [byCategory]
  )

  const addEntry = useCallback(async (entry: {
    valor: number
    categoria: string
    descricao: string
    data: string
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const { error } = await supabase.from('capex').insert({
      user_id: user.id,
      imovel,
      categoria: entry.categoria,
      descricao: entry.descricao,
      valor_orcado: 0,
      valor_realizado: entry.valor,
      data_realizada: entry.data,
      status: 'concluido',
    })

    if (error) return { error: error.message }
    await fetchAll()
    return { error: null }
  }, [imovel, fetchAll])

  const updateEntry = useCallback(async (id: string, updates: {
    valor?: number
    categoria?: string
    descricao?: string
    data?: string
  }) => {
    const patch: Record<string, unknown> = {}
    if (updates.valor !== undefined) patch.valor_realizado = updates.valor
    if (updates.categoria) patch.categoria = updates.categoria
    if (updates.descricao !== undefined) patch.descricao = updates.descricao
    if (updates.data) patch.data_realizada = updates.data

    const { error } = await supabase.from('capex').update(patch).eq('id', id)
    if (error) return { error: error.message }
    await fetchAll()
    return { error: null }
  }, [fetchAll])

  const deleteEntry = useCallback(async (id: string) => {
    const { error } = await supabase.from('capex').delete().eq('id', id)
    if (error) return { error: error.message }
    await fetchAll()
    return { error: null }
  }, [fetchAll])

  const updateBudget = useCallback(async (categoria: string, valor: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('capex_orcamento').upsert({
      user_id: user.id,
      imovel,
      categoria,
      valor_orcado: valor,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,imovel,categoria' })

    await fetchAll()
  }, [imovel, fetchAll])

  const addCategoria = useCallback(async (label: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Não autenticado' }

    const key = label
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    const exists = categorias.find(c => c.key === key)
    if (exists) return { error: 'Categoria já existe' }

    const { error } = await supabase.from('capex_categorias').insert({
      user_id: user.id,
      key,
      label,
      keywords: '',
      ordem: categorias.length,
    })

    if (error) return { error: error.message }
    await fetchAll()
    return { error: null }
  }, [categorias, fetchAll])

  const updateCategoria = useCallback(async (key: string, updates: { label?: string; keywords?: string }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('capex_categorias')
      .update(updates)
      .eq('user_id', user.id)
      .eq('key', key)

    await fetchAll()
  }, [fetchAll])

  const deleteCategoria = useCallback(async (key: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Mover entries dessa categoria para 'outros'
    await supabase.from('capex')
      .update({ categoria: 'outros' })
      .eq('user_id', user.id)
      .eq('categoria', key)

    await supabase.from('capex_categorias')
      .delete()
      .eq('user_id', user.id)
      .eq('key', key)

    await fetchAll()
  }, [fetchAll])

  return {
    entries,
    budgets,
    categorias,
    loading,
    byCategory,
    totalBudget,
    totalSpent,
    addEntry,
    updateEntry,
    deleteEntry,
    updateBudget,
    addCategoria,
    updateCategoria,
    deleteCategoria,
  }
}
