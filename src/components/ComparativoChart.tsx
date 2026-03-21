import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import type { Theme } from '../hooks/useTheme'
import type { Cenario } from '../types/database'
import { useComparativo } from '../hooks/useComparativo'

const PLAN_COLORS = {
  sprint: '#E24B4A',
  terceira_margem: '#1D9E75',
  master: '#185FA5',
}

interface Props {
  cenario: Cenario
  theme: Theme
}

export default function ComparativoChart({ cenario, theme }: Props) {
  const { data, loading } = useComparativo(cenario)

  if (loading || !data.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>Comparativo Sprint / TM / Master</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>{loading ? 'Carregando...' : 'Sem dados.'}</p>
      </div>
    )
  }

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme.isDark ? '#334155' : '#e2e8f0'

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>
        Comparativo Sprint / TM / Master — Patrimônio Total
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="mes" tick={{ fontSize: 9, fill: theme.textFaint }} interval={2} angle={-40} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v.toFixed(1)}M`} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: theme.text }}
            formatter={(value) => [`R$ ${(Number(value) * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, undefined]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: theme.textMuted }} />
          <ReferenceLine x="Jul/2027" stroke="#E24B4A" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Sprint', fill: '#E24B4A', fontSize: 9 }} />
          <ReferenceLine x="Mar/2028" stroke="#1D9E75" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'TM', fill: '#1D9E75', fontSize: 9 }} />
          <ReferenceLine x="Mar/2029" stroke="#185FA5" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Master', fill: '#185FA5', fontSize: 9 }} />
          <Line type="monotone" dataKey="sprint" name="Sprint" stroke={PLAN_COLORS.sprint} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="terceira_margem" name="Terceira Margem" stroke={PLAN_COLORS.terceira_margem} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="master" name="Master" stroke={PLAN_COLORS.master} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
