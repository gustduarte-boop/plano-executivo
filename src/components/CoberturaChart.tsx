import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import type { ChartDataPoint, Plano } from '../types/database'
import type { Theme } from '../hooks/useTheme'
import { custoTotal, TIMELINE } from '../lib/formulas'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

interface Props {
  data: ChartDataPoint[]
  plano: Plano
  theme: Theme
}

export default function CoberturaChart({ data, plano, theme }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>Cobertura do Custo de Vida</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>Sem dados.</p>
      </div>
    )
  }

  const tl = TIMELINE[plano]

  const chartData = data.map((d, idx) => {
    const m = idx * 4
    const custo = custoTotal(m, tl.transition)
    const renda = d.renda
    const cobertura = custo > 0 ? (renda / custo) * 100 : 0
    const ano = 2026 + Math.floor(m / 12)
    const mes = MONTHS_PT[m % 12]
    return {
      mes: `${mes}/${ano}`,
      cobertura: parseFloat(cobertura.toFixed(1)),
      renda: Math.round(renda),
      custo: Math.round(custo),
    }
  })

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme.isDark ? '#334155' : '#e2e8f0'

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>
        Cobertura do Custo de Vida (%)
      </h2>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="mes" tick={{ fontSize: 9, fill: theme.textFaint }} interval={2} angle={-40} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: theme.text }}
            formatter={(value, name) => {
              if (name === 'Cobertura') return [`${Number(value).toFixed(1)}%`, name]
              return [`R$ ${Number(value).toLocaleString('pt-BR')}`, name]
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: theme.textMuted }} />
          <ReferenceLine y={100} stroke={theme.isDark ? '#22c55e' : '#16a34a'} strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: '100%', fill: '#22c55e', fontSize: 9 }} />
          <Line type="monotone" dataKey="cobertura" name="Cobertura" stroke={theme.accent} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="renda" name="Renda (R$)" stroke="#1D9E75" strokeWidth={1.5} dot={false} strokeDasharray="4 2" yAxisId="right" hide />
          <Line type="monotone" dataKey="custo" name="Custo (R$)" stroke="#E24B4A" strokeWidth={1.5} dot={false} strokeDasharray="4 2" yAxisId="right" hide />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
