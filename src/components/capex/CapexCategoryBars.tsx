import type { Theme } from '../../hooks/useTheme'
import type { CategoriaItem, CategorySummary } from '../../hooks/useCapex'

interface Props {
  byCategory: Record<string, CategorySummary>
  categorias: CategoriaItem[]
  theme: Theme
}

function fmtK(v: number): string {
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}k`
  return v.toFixed(0)
}

export default function CapexCategoryBars({ byCategory, categorias, theme }: Props) {
  const maxBudget = Math.max(...Object.values(byCategory).map(c => c.budgeted), 1)

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h3 className="text-xs font-semibold mb-3" style={{ color: theme.textMuted }}>Por Categoria</h3>
      <div className="space-y-2">
        {categorias.map(cat => {
          const summary = byCategory[cat.key]
          if (!summary) return null
          const ratio = summary.budgeted > 0 ? summary.spent / summary.budgeted : 0
          const barColor = ratio < 0.8 ? '#1D9E75' : ratio <= 1.0 ? '#EF9F27' : '#E24B4A'
          const budgetWidth = (summary.budgeted / maxBudget) * 100
          const spentWidth = summary.budgeted > 0
            ? Math.min((summary.spent / summary.budgeted) * 100, 100)
            : 0

          return (
            <div key={cat.key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-medium truncate" style={{ color: theme.textMuted, maxWidth: '55%' }}>
                  {cat.label}
                </span>
                <span className="text-[10px] tabular-nums" style={{ color: summary.spent > 0 ? barColor : theme.textFaint }}>
                  {fmtK(summary.spent)} / {fmtK(summary.budgeted)}
                </span>
              </div>
              <div className="relative h-2.5 rounded-full" style={{ width: `${budgetWidth}%`, minWidth: 40, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                {summary.spent > 0 && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                    style={{ width: `${spentWidth}%`, backgroundColor: barColor }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
