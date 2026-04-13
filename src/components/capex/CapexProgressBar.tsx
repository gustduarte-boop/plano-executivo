import type { Theme } from '../../hooks/useTheme'

interface Props {
  totalBudget: number
  totalSpent: number
  theme: Theme
}

function fmtR(v: number): string {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(1)}k`
  return `R$ ${v.toFixed(0)}`
}

export default function CapexProgressBar({ totalBudget, totalSpent, theme }: Props) {
  const ratio = totalBudget > 0 ? totalSpent / totalBudget : 0
  const pct = Math.min(ratio * 100, 100)
  const color = ratio < 0.8 ? '#1D9E75' : ratio <= 1.0 ? '#EF9F27' : '#E24B4A'
  const overflow = ratio > 1.0

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <span className="text-lg font-bold tabular-nums" style={{ color }}>{fmtR(totalSpent)}</span>
          <span className="text-sm" style={{ color: theme.textFaint }}> / {fmtR(totalBudget)}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {(ratio * 100).toFixed(1)}%
        </span>
      </div>

      <div className="relative h-4 rounded-full overflow-hidden" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
        {overflow && (
          <div className="absolute inset-0 rounded-full" style={{
            background: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(226,75,74,0.15) 4px, rgba(226,75,74,0.15) 8px)`,
          }} />
        )}
      </div>

      <div className="flex justify-between mt-1.5">
        <span className="text-[10px]" style={{ color: theme.textFaint }}>
          {totalSpent > totalBudget
            ? `Estouro de ${fmtR(totalSpent - totalBudget)}`
            : `Falta ${fmtR(totalBudget - totalSpent)}`}
        </span>
      </div>
    </div>
  )
}
