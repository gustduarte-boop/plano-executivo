import { useState, useCallback } from 'react'
import type { Theme } from '../hooks/useTheme'
import { useCapex } from '../hooks/useCapex'
import CapexProgressBar from './capex/CapexProgressBar'
import CapexCategoryBars from './capex/CapexCategoryBars'
import CapexPieChart from './capex/CapexPieChart'
import CapexQuickEntry from './capex/CapexQuickEntry'
import CapexReceiptUpload from './capex/CapexReceiptUpload'
import CapexHistory from './capex/CapexHistory'
import CapexBudgetEditor from './capex/CapexBudgetEditor'

interface Props {
  theme: Theme
}

export interface PrefilledEntry {
  valor: string
  descricao: string
  data: string
  categoria: string
  fromAi: boolean
}

export default function CapexDashboard({ theme }: Props) {
  const [filterCategoria, setFilterCategoria] = useState<string | null>(null)
  const [prefilled, setPrefilled] = useState<PrefilledEntry | null>(null)
  const {
    entries, categorias, loading,
    byCategory, totalBudget, totalSpent,
    addEntry, updateEntry, deleteEntry, updateBudget,
    addCategoria, updateCategoria, deleteCategoria,
  } = useCapex('im1')

  const handleExtracted = useCallback((data: { valor: number; descricao: string; data: string | null; categoria_sugerida: string | null }) => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    setPrefilled({
      valor: String(data.valor || ''),
      descricao: data.descricao || '',
      data: data.data || todayStr,
      categoria: data.categoria_sugerida && categorias.some(c => c.key === data.categoria_sugerida)
        ? data.categoria_sugerida
        : categorias[0]?.key || 'outros',
      fromAi: true,
    })
  }, [categorias])

  if (loading) {
    return (
      <div className="rounded-xl p-6 text-center" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <p className="text-sm" style={{ color: theme.textFaint }}>Carregando CAPEX...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-5 rounded-sm" style={{ backgroundColor: theme.accent }} />
        <h2 className="text-sm font-bold" style={{ color: theme.text }}>CAPEX Obra — Im.1 Vila Corumbau</h2>
      </div>

      <CapexProgressBar totalBudget={totalBudget} totalSpent={totalSpent} theme={theme} />

      <CapexCategoryBars byCategory={byCategory} categorias={categorias} theme={theme} />

      <CapexPieChart byCategory={byCategory} categorias={categorias} theme={theme} />

      <CapexReceiptUpload categorias={categorias} onExtracted={handleExtracted} theme={theme} />

      <CapexQuickEntry
        onSave={async (entry) => {
          const result = await addEntry(entry)
          if (!result.error) setPrefilled(null)
          return result
        }}
        categorias={categorias}
        prefilled={prefilled}
        theme={theme}
      />

      <CapexHistory
        entries={entries}
        categorias={categorias}
        filterCategoria={filterCategoria}
        onFilter={setFilterCategoria}
        onEdit={updateEntry}
        onDelete={deleteEntry}
        theme={theme}
      />

      <CapexBudgetEditor
        byCategory={byCategory}
        categorias={categorias}
        onUpdate={updateBudget}
        onAddCategoria={addCategoria}
        onUpdateCategoria={updateCategoria}
        onDeleteCategoria={deleteCategoria}
        theme={theme}
      />
    </div>
  )
}
