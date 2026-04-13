import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, Check, X } from 'lucide-react'
import type { Theme } from '../../hooks/useTheme'
import type { CategoriaItem, CategorySummary } from '../../hooks/useCapex'

const ORCAMENTO_TOTAL_DEFAULT = 210_000

interface Props {
  byCategory: Record<string, CategorySummary>
  categorias: CategoriaItem[]
  onUpdate: (cat: string, valor: number) => Promise<void>
  onAddCategoria: (label: string) => Promise<{ error: string | null }>
  onUpdateCategoria: (key: string, updates: { label?: string; keywords?: string }) => Promise<void>
  onDeleteCategoria: (key: string) => Promise<void>
  theme: Theme
}

function fmtK(v: number): string {
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`
  return v.toFixed(0)
}

export default function CapexBudgetEditor({ byCategory, categorias, onUpdate, onAddCategoria, onUpdateCategoria, onDeleteCategoria, theme }: Props) {
  const [openBudget, setOpenBudget] = useState(false)
  const [openCats, setOpenCats] = useState(false)
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newCatLabel, setNewCatLabel] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editLabelValue, setEditLabelValue] = useState('')
  const [editingKeywords, setEditingKeywords] = useState<string | null>(null)
  const [editKeywordsValue, setEditKeywordsValue] = useState('')
  const [msg, setMsg] = useState('')

  const totalBudget = Object.values(byCategory).reduce((s, c) => s + c.budgeted, 0)

  const startEditBudget = (cat: string) => {
    setEditingCat(cat)
    setEditValue(String(Math.round(byCategory[cat]?.budgeted || 0)))
  }

  const saveEditBudget = async () => {
    if (!editingCat) return
    await onUpdate(editingCat, parseFloat(editValue) || 0)
    setEditingCat(null)
  }

  const distributeEvenly = async () => {
    const perCat = Math.round(ORCAMENTO_TOTAL_DEFAULT / categorias.length)
    for (const cat of categorias) {
      await onUpdate(cat.key, perCat)
    }
  }

  const handleAddCat = async () => {
    if (!newCatLabel.trim()) return
    setAddingCat(true)
    const result = await onAddCategoria(newCatLabel.trim())
    if (result.error) {
      setMsg(result.error)
      setTimeout(() => setMsg(''), 3000)
    } else {
      setNewCatLabel('')
    }
    setAddingCat(false)
  }

  const handleRename = async (key: string) => {
    if (!editLabelValue.trim()) { setEditingLabel(null); return }
    await onUpdateCategoria(key, { label: editLabelValue.trim() })
    setEditingLabel(null)
  }

  const handleKeywords = async (key: string) => {
    await onUpdateCategoria(key, { keywords: editKeywordsValue.trim() })
    setEditingKeywords(null)
  }

  const inputStyle = {
    backgroundColor: theme.isDark ? theme.bgAlt : '#f8f9fb',
    border: `1px solid ${theme.surfaceBorder}`,
    color: theme.text,
  }

  return (
    <div className="space-y-2">
      {/* Orçamento por categoria */}
      <div className="rounded-xl" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <button
          onClick={() => setOpenBudget(!openBudget)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold transition-colors"
          style={{ color: theme.textMuted }}
        >
          <span>Orçamento por Categoria (Total: R$ {fmtK(totalBudget)})</span>
          {openBudget ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openBudget && (
          <div className="px-4 pb-4">
            <div className="flex justify-end mb-2">
              <button
                onClick={distributeEvenly}
                className="text-[10px] px-2 py-0.5 rounded transition-colors"
                style={{ color: theme.accent, border: `1px solid ${theme.accentBorder}` }}
              >
                Distribuir R$210k igualmente
              </button>
            </div>

            <table className="w-full text-[10px] border-collapse" style={{ color: theme.text }}>
              <thead>
                <tr>
                  <th className="px-1.5 py-1 text-left font-medium" style={{ color: theme.textFaint, borderBottom: `1px solid ${theme.surfaceBorder}` }}>Categoria</th>
                  <th className="px-1.5 py-1 text-right font-medium" style={{ color: theme.textFaint, borderBottom: `1px solid ${theme.surfaceBorder}` }}>Orçado</th>
                  <th className="px-1.5 py-1 text-right font-medium" style={{ color: theme.textFaint, borderBottom: `1px solid ${theme.surfaceBorder}` }}>% Total</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map(cat => {
                  const summary = byCategory[cat.key]
                  const isEditing = editingCat === cat.key
                  const pct = totalBudget > 0 ? ((summary?.budgeted || 0) / totalBudget * 100).toFixed(1) : '0.0'

                  return (
                    <tr key={cat.key} style={{ borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                      <td className="px-1.5 py-1" style={{ color: theme.textMuted }}>{cat.label}</td>
                      <td className="px-1.5 py-1 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={saveEditBudget}
                            onKeyDown={e => e.key === 'Enter' && saveEditBudget()}
                            className="w-24 px-1 py-0.5 rounded text-[10px] text-right tabular-nums"
                            style={inputStyle}
                            autoFocus
                          />
                        ) : (
                          <button
                            onClick={() => startEditBudget(cat.key)}
                            className="tabular-nums font-medium hover:underline"
                            style={{ color: theme.text }}
                          >
                            R$ {fmtK(summary?.budgeted || 0)}
                          </button>
                        )}
                      </td>
                      <td className="px-1.5 py-1 text-right tabular-nums" style={{ color: theme.textFaint }}>
                        {pct}%
                      </td>
                    </tr>
                  )
                })}
                <tr style={{ borderTop: `2px solid ${theme.surfaceBorder}` }}>
                  <td className="px-1.5 py-1 font-bold">TOTAL</td>
                  <td className="px-1.5 py-1 text-right tabular-nums font-bold" style={{ color: theme.accent }}>
                    R$ {fmtK(totalBudget)}
                  </td>
                  <td className="px-1.5 py-1 text-right tabular-nums font-bold" style={{ color: theme.textFaint }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gerenciar categorias */}
      <div className="rounded-xl" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <button
          onClick={() => setOpenCats(!openCats)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold transition-colors"
          style={{ color: theme.textMuted }}
        >
          <span>Gerenciar Categorias ({categorias.length})</span>
          {openCats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {openCats && (
          <div className="px-4 pb-4 space-y-3">
            {/* Add new */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatLabel}
                onChange={e => setNewCatLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCat()}
                placeholder="Nova categoria..."
                className="flex-1 px-2 py-1.5 rounded text-xs"
                style={inputStyle}
              />
              <button
                onClick={handleAddCat}
                disabled={addingCat || !newCatLabel.trim()}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                style={{ backgroundColor: theme.accent, color: theme.textInverse }}
              >
                <Plus size={12} /> Criar
              </button>
            </div>

            {msg && <p className="text-[10px]" style={{ color: '#E24B4A' }}>{msg}</p>}

            {/* List */}
            <div className="space-y-1">
              {categorias.map(cat => (
                <div key={cat.key} className="flex items-center gap-2 py-1.5 px-2 rounded"
                  style={{ borderBottom: `1px solid ${theme.surfaceBorder}` }}>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    {editingLabel === cat.key ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editLabelValue}
                          onChange={e => setEditLabelValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleRename(cat.key)}
                          className="flex-1 px-1 py-0.5 rounded text-[10px]"
                          style={inputStyle}
                          autoFocus
                        />
                        <button onClick={() => handleRename(cat.key)} style={{ color: '#1D9E75' }}><Check size={11} /></button>
                        <button onClick={() => setEditingLabel(null)} style={{ color: theme.textFaint }}><X size={11} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingLabel(cat.key); setEditLabelValue(cat.label) }}
                        className="text-[11px] font-medium hover:underline text-left truncate block w-full"
                        style={{ color: theme.text }}
                      >
                        {cat.label}
                      </button>
                    )}
                  </div>

                  {/* Keywords */}
                  <div className="flex-1 min-w-0">
                    {editingKeywords === cat.key ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editKeywordsValue}
                          onChange={e => setEditKeywordsValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleKeywords(cat.key)}
                          placeholder="palavra1, palavra2..."
                          className="flex-1 px-1 py-0.5 rounded text-[9px]"
                          style={inputStyle}
                          autoFocus
                        />
                        <button onClick={() => handleKeywords(cat.key)} style={{ color: '#1D9E75' }}><Check size={11} /></button>
                        <button onClick={() => setEditingKeywords(null)} style={{ color: theme.textFaint }}><X size={11} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingKeywords(cat.key); setEditKeywordsValue(cat.keywords || '') }}
                        className="text-[9px] truncate block w-full text-left"
                        style={{ color: cat.keywords ? theme.textMuted : theme.textFaint }}
                      >
                        {cat.keywords || 'palavras-chave...'}
                      </button>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteCategoria(cat.key)}
                    className="flex-none p-0.5 rounded transition-colors"
                    style={{ color: theme.textFaint }}
                    title={`Excluir "${cat.label}"`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[9px]" style={{ color: theme.textFaint }}>
              Clique no nome para renomear. Palavras-chave são usadas para auto-detecção na descrição (separar por vírgula).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
