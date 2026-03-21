import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import type { ChartDataPoint, Cenario } from '../types/database'
import type { Theme } from '../hooks/useTheme'

const CENARIO_COLORS: Record<Cenario, string> = {
  ultra: '#E24B4A', pessim: '#EF9F27', base: '#1D9E75', otim: '#185FA5',
}
const CENARIO_LABELS: Record<Cenario, string> = {
  ultra: 'Ultra pessimista', pessim: 'Pessimista', base: 'Base', otim: 'Otimista',
}

interface Props {
  data: Record<Cenario, ChartDataPoint[]>
  cenarioAtivo: Cenario
  theme: Theme
}

export default function LciChart({ data, cenarioAtivo, theme }: Props) {
  const cenarios = (Object.keys(data) as Cenario[]).filter((c) => data[c].length > 0)
  if (!cenarios.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>Reserva LCI/RF por Cenário</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>Sem dados.</p>
      </div>
    )
  }

  const basePoints = data[cenarios[0]]
  const chartData = basePoints.map((_, idx) => {
    const point: Record<string, string | number> = { mes: basePoints[idx].mes }
    for (const c of cenarios) {
      const d = data[c][idx]
      if (d) point[c] = parseFloat(((d.cdi + d.lci) * 1000).toFixed(1))
    }
    return point
  })

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme.isDark ? '#334155' : '#e2e8f0'

  // Render inactive lines first, active line last (on top)
  const inactives = cenarios.filter((c) => c !== cenarioAtivo)
  const ordered = [...inactives, cenarioAtivo].filter((c) => cenarios.includes(c))

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>
        Reserva LCI/RF por Cenário (R$ mil) — <span style={{ color: CENARIO_COLORS[cenarioAtivo] }}>{CENARIO_LABELS[cenarioAtivo]}</span>
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="mes" tick={{ fontSize: 9, fill: theme.textFaint }} interval={2} angle={-40} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: theme.text }}
            formatter={(value, name) => [`R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`, CENARIO_LABELS[name as Cenario] || name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: theme.textMuted }} formatter={(v) => CENARIO_LABELS[v as Cenario] || v} />
          {ordered.map((c) => {
            const isActive = c === cenarioAtivo
            return (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                stroke={CENARIO_COLORS[c]}
                strokeWidth={isActive ? 3 : 1}
                strokeOpacity={isActive ? 1 : 0.3}
                dot={isActive ? { r: 2, fill: CENARIO_COLORS[c] } : false}
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
