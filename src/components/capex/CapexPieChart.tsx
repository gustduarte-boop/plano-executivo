import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Theme } from '../../hooks/useTheme'
import type { CategoriaItem, CategorySummary } from '../../hooks/useCapex'

interface Props {
  byCategory: Record<string, CategorySummary>
  categorias: CategoriaItem[]
  theme: Theme
}

const PALETTE = [
  '#185FA5', '#1D9E75', '#EF9F27', '#E24B4A', '#7F77DD',
  '#9FE1CB', '#F28B82', '#FAC775', '#BA7517', '#22d3ee',
  '#A78BFA', '#34D399',
]

interface SliceData {
  name: string
  value: number
  color: string
}

function fmtR(v: number): string {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(1)}k`
  return `R$ ${v.toFixed(0)}`
}

export default function CapexPieChart({ byCategory, categorias, theme }: Props) {
  const orcado: SliceData[] = []
  const realizado: SliceData[] = []
  const colorByKey: Record<string, string> = {}

  categorias.forEach((cat, idx) => {
    const summary = byCategory[cat.key]
    if (!summary) return
    const color = PALETTE[idx % PALETTE.length]
    colorByKey[cat.key] = color
    if (summary.budgeted > 0) {
      orcado.push({ name: cat.label, value: summary.budgeted, color })
    }
    if (summary.spent > 0) {
      realizado.push({ name: cat.label, value: summary.spent, color })
    }
  })

  const totalOrcado = orcado.reduce((s, x) => s + x.value, 0)
  const totalRealizado = realizado.reduce((s, x) => s + x.value, 0)

  if (totalRealizado === 0) {
    return (
      <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h3 className="text-xs font-semibold mb-2" style={{ color: theme.textMuted }}>Distribuição dos Gastos</h3>
        <p className="text-[11px]" style={{ color: theme.textFaint }}>Sem gastos lançados ainda.</p>
      </div>
    )
  }

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme.isDark ? '#334155' : '#e2e8f0'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const p = payload[0]
    const isOuter = p.payload.__ring === 'outer'
    const total = isOuter ? totalOrcado : totalRealizado
    const pct = total > 0 ? (p.value / total) * 100 : 0
    return (
      <div style={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
        <div style={{ color: theme.text, fontWeight: 600 }}>{p.payload.name}</div>
        <div style={{ color: theme.textMuted }}>
          {isOuter ? 'Orçado' : 'Realizado'}: {fmtR(p.value)} ({pct.toFixed(1)}%)
        </div>
      </div>
    )
  }

  // Sort realizado descending so largest segments are shown first
  const realizadoSorted = [...realizado].sort((a, b) => b.value - a.value)
  const orcadoSorted = [...orcado].sort((a, b) => b.value - a.value)

  // Top 3 categorias do realizado
  const top3 = realizadoSorted.slice(0, 3)

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-xs font-semibold" style={{ color: theme.textMuted }}>Distribuição dos Gastos</h3>
        <span className="text-[10px]" style={{ color: theme.textFaint }}>
          externo = orçado · interno = realizado
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={orcadoSorted.map((d) => ({ ...d, __ring: 'outer' }))}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={92}
              paddingAngle={1}
              dataKey="value"
              stroke={theme.surface}
              strokeWidth={1}
            >
              {orcadoSorted.map((d, i) => (
                <Cell key={`o-${i}`} fill={d.color} fillOpacity={0.45} />
              ))}
            </Pie>
            <Pie
              data={realizadoSorted.map((d) => ({ ...d, __ring: 'inner' }))}
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={62}
              paddingAngle={1}
              dataKey="value"
              stroke={theme.surface}
              strokeWidth={1}
            >
              {realizadoSorted.map((d, i) => (
                <Cell key={`r-${i}`} fill={d.color} fillOpacity={1} />
              ))}
            </Pie>
            <Tooltip content={renderTooltip} />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex flex-col justify-center gap-1.5">
          <div className="text-[10px] mb-1" style={{ color: theme.textFaint }}>
            Total realizado: <span className="tabular-nums font-medium" style={{ color: theme.text }}>{fmtR(totalRealizado)}</span>
          </div>
          {top3.map((d) => {
            const pct = totalRealizado > 0 ? (d.value / totalRealizado) * 100 : 0
            return (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-[11px] truncate" style={{ color: theme.textMuted }}>{d.name}</span>
                <span className="text-[11px] tabular-nums ml-auto" style={{ color: theme.text }}>
                  {pct.toFixed(0)}%
                </span>
              </div>
            )
          })}
          {realizadoSorted.length > 3 && (
            <div className="text-[10px] mt-1" style={{ color: theme.textFaint }}>
              + {realizadoSorted.length - 3} outras categorias
            </div>
          )}
        </div>
      </div>

      {/* Legenda completa abaixo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 mt-3 pt-3" style={{ borderTop: `1px solid ${theme.surfaceBorder}` }}>
        {realizadoSorted.map((d) => {
          const orc = orcado.find((o) => o.name === d.name)?.value ?? 0
          const pctR = totalRealizado > 0 ? (d.value / totalRealizado) * 100 : 0
          const pctO = totalOrcado > 0 ? (orc / totalOrcado) * 100 : 0
          const skew = pctR - pctO
          return (
            <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="truncate" style={{ color: theme.textMuted, maxWidth: '70%' }}>{d.name}</span>
              <span
                className="tabular-nums ml-auto"
                style={{
                  color: Math.abs(skew) < 5 ? theme.textFaint : skew > 0 ? '#E24B4A' : '#1D9E75',
                }}
                title={`Realizado ${pctR.toFixed(1)}% vs Orçado ${pctO.toFixed(1)}%`}
              >
                {pctR.toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
