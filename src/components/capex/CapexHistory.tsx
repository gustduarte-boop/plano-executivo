import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import type { Theme } from '../../hooks/useTheme'
import type { Capex } from '../../types/database'
import type { CategoriaItem } from '../../hooks/useCapex'

interface Props {
  entries: Capex[]
  categorias: CategoriaItem[]
  filterCategoria: string | null
  onFilter: (cat: string | null) => void
  onEdit: (id: string, updates: { valor?: number; categoria?: string; descricao?: string; data?: string }) => Promise<{ error: string | null }>
  onDelete: (id: string) => Promise<{ error: string | null }>
  theme: Theme
}

function fmtR(v: number): string {
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(1)}k`
  return `R$ ${v.toFixed(0)}`
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y.slice(2)}`
}

export default function CapexHistory({ entries, categorias, filterCategoria, onFilter, onEdit, onDelete, theme }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ valor: '', categoria: 'outros', descricao: '', data: '' })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const catLabels: Record<string, string> = Object.fromEntries(categorias.map(c => [c.key, c.label]))

  const filtered = filterCategoria
    ? entries.filter(e => (e.categoria || 'outros') === filterCategoria)
    : entries

  let runningTotal = 0
  const withTotal = filtered.map(e => {
    runningTotal += e.valor_realizado || 0
    return { ...e, cumulative: runningTotal }
  })

  const startEdit = (e: Capex) => {
    setEditingId(e.id)
    setEditValues({
      valor: String(e.valor_realizado || 0),
      categoria: e.categoria || 'outros',
      descricao: e.descricao,
      data: e.data_realizada || '',
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    await onEdit(editingId, {
      valor: parseFloat(editValues.valor) || 0,
      categoria: editValues.categoria,
      descricao: editValues.descricao,
      data: editValues.data,
    })
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    await onDelete(id)
    setConfirmDelete(null)
  }

  // Category counts for filter pills
  const catCounts: Record<string, number> = {}
  for (const e of entries) {
    const cat = e.categoria || 'outros'
    catCounts[cat] = (catCounts[cat] || 0) + 1
  }

  const inputStyle = {
    backgroundColor: theme.isDark ? theme.bgAlt : '#f8f9fb',
    border: `1px solid ${theme.surfaceBorder}`,
    color: theme.text,
  }

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold" style={{ color: theme.textMuted }}>
          Histórico ({filtered.length} lançamentos)
        </h3>
        <span className="text-xs font-bold tabular-nums" style={{ color: theme.accent }}>
          Total: {fmtR(runningTotal)}
        </span>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1 mb-3">
        <button
          onClick={() => onFilter(null)}
          className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
          style={{
            backgroundColor: !filterCategoria ? theme.accentBg : 'transparent',
            color: !filterCategoria ? theme.accent : theme.textFaint,
            border: `1px solid ${!filterCategoria ? theme.accentBorder : theme.surfaceBorder}`,
          }}
        >
          Todos
        </button>
        {categorias.filter(c => catCounts[c.key]).map(c => (
          <button
            key={c.key}
            onClick={() => onFilter(filterCategoria === c.key ? null : c.key)}
            className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
            style={{
              backgroundColor: filterCategoria === c.key ? theme.accentBg : 'transparent',
              color: filterCategoria === c.key ? theme.accent : theme.textFaint,
              border: `1px solid ${filterCategoria === c.key ? theme.accentBorder : theme.surfaceBorder}`,
            }}
          >
            {c.label.split(' / ')[0]} ({catCounts[c.key]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-y-auto max-h-[320px]">
        <table className="w-full text-[10px] border-collapse" style={{ color: theme.text }}>
          <thead className="sticky top-0 z-10">
            <tr style={{ backgroundColor: theme.surface }}>
              <th className="px-1.5 py-1 text-left font-medium" style={{ color: theme.textFaint, borderBottom: `1px solid ${theme.surfaceBorder}` }}>Data</th>
              <th className="px-1.5 py-1 text-left font-medium" style={{ color: theme.textFaint, borderBottom: `1px solid ${theme.surfaceBorder}` }}>Categoria</th>
              <th className="px-1.5 py-1 text-left font-medium" style={{ color: theme.textFaint, borderBottom: `1px solid ${theme.surfaceBorder}` }}>Descrição</th>
              <th className="px-1.5 py-1 text-right font-medium" style={{ color: theme.textFaint, borderBottom: `1px solid ${theme.surfaceBorder}` }}>Valor</th>
              <th className="px-1.5 py-1 text-right font-medium" style={{ color: theme.textFaint, borderBottom: `1px solid ${theme.surfaceBorder}` }}>Acum.</th>
              <th className="px-1.5 py-1 w-16" style={{ borderBottom: `1px solid ${theme.surfaceBorder}` }}></th>
            </tr>
          </thead>
          <tbody>
            {withTotal.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6" style={{ color: theme.textFaint }}>
                  Nenhum lançamento ainda
                </td>
              </tr>
            )}
            {withTotal.map(e => {
              const isEditing = editingId === e.id
              const isDeleting = confirmDelete === e.id

              if (isEditing) {
                return (
                  <tr key={e.id} style={{ backgroundColor: theme.accentBg, borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                    <td className="px-1.5 py-1">
                      <input type="date" value={editValues.data} onChange={ev => setEditValues({ ...editValues, data: ev.target.value })}
                        className="w-full px-1 py-0.5 rounded text-[10px]" style={inputStyle} />
                    </td>
                    <td className="px-1.5 py-1">
                      <select value={editValues.categoria} onChange={ev => setEditValues({ ...editValues, categoria: ev.target.value })}
                        className="w-full px-1 py-0.5 rounded text-[10px]" style={inputStyle}>
                        {categorias.map(c => <option key={c.key} value={c.key}>{c.label.split(' / ')[0]}</option>)}
                      </select>
                    </td>
                    <td className="px-1.5 py-1">
                      <input type="text" value={editValues.descricao} onChange={ev => setEditValues({ ...editValues, descricao: ev.target.value })}
                        className="w-full px-1 py-0.5 rounded text-[10px]" style={inputStyle} />
                    </td>
                    <td className="px-1.5 py-1">
                      <input type="number" step="0.01" value={editValues.valor} onChange={ev => setEditValues({ ...editValues, valor: ev.target.value })}
                        className="w-full px-1 py-0.5 rounded text-[10px] text-right tabular-nums" style={inputStyle} />
                    </td>
                    <td />
                    <td className="px-1.5 py-1">
                      <div className="flex gap-1 justify-end">
                        <button onClick={saveEdit} style={{ color: '#1D9E75' }}><Check size={12} /></button>
                        <button onClick={() => setEditingId(null)} style={{ color: theme.textFaint }}><X size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )
              }

              return (
                <tr key={e.id} style={{ borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                  <td className="px-1.5 py-1 whitespace-nowrap tabular-nums">{fmtDate(e.data_realizada)}</td>
                  <td className="px-1.5 py-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                      style={{ backgroundColor: theme.accentBg, color: theme.accent }}>
                      {(catLabels[e.categoria || 'outros'] || 'Outros').split(' / ')[0]}
                    </span>
                  </td>
                  <td className="px-1.5 py-1 truncate" style={{ maxWidth: 200, color: theme.textMuted }}>
                    {e.descricao || '—'}
                  </td>
                  <td className="px-1.5 py-1 text-right tabular-nums font-medium">
                    {fmtR(e.valor_realizado || 0)}
                  </td>
                  <td className="px-1.5 py-1 text-right tabular-nums" style={{ color: theme.textFaint }}>
                    {fmtR(e.cumulative)}
                  </td>
                  <td className="px-1.5 py-1">
                    {isDeleting ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => handleDelete(e.id)} className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: '#E24B4A', color: '#fff' }}>Sim</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-[9px]" style={{ color: theme.textFaint }}>Não</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end" style={{ opacity: 0.7 }}>
                        <button onClick={() => startEdit(e)} style={{ color: theme.textFaint }}><Pencil size={11} /></button>
                        <button onClick={() => setConfirmDelete(e.id)} style={{ color: theme.textFaint }}><Trash2 size={11} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
