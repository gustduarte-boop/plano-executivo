import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Theme } from '../hooks/useTheme'
import type { Plano } from '../types/database'
import { useExtra } from '../hooks/useExtras'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

interface Props { plano: Plano; theme: Theme }

export default function StressTestChart({ plano, theme }: Props) {
  const { data, loading } = useExtra(plano, 'stress_test')

  if (loading || !data?.scenarios?.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: theme.text }}>STRESS TEST — CENÁRIOS ADVERSOS</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>{loading ? 'Carregando...' : 'Sem dados.'}</p>
      </div>
    )
  }

  const scenarios = data.scenarios.filter((s: { data: number[] }) => s.data?.length > 0)
  if (!scenarios.length) return null

  const points = scenarios[0].points || []
  const chartData = points.map((m: number, idx: number) => {
    const ano = 2026 + Math.floor(m / 12)
    const mes = MONTHS_PT[m % 12]
    const point: Record<string, string | number> = { mes: `${mes}/${ano}` }
    for (const s of scenarios) {
      point[s.name] = s.data[idx] || 0
    }
    return point
  })

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: theme.text }}>STRESS TEST — CENÁRIOS ADVERSOS</h2>
      <p className="text-[10px] mb-4" style={{ color: theme.textFaint }}>
        Sólido: Base/Moderado/Severo · Tracejado: Ultra pessimista (sal R$0, occ 50%, CAPEX 1,2×) | Otimista (sal R$16k, occ 115%, CAPEX 1,8×)
      </p>

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="mes" tick={{ fontSize: 9, fill: theme.textFaint }} interval={2} angle={-40} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v.toFixed(1)}M`} />
          <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: theme.text }}
            formatter={(value) => [`R$ ${(Number(value) * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, undefined]} />
          <Legend wrapperStyle={{ fontSize: 10, color: theme.textMuted }} />
          {scenarios.map((s: { name: string; color: string; style: string }) => (
            <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2}
              strokeDasharray={s.style === 'dashed' ? '6 3' : undefined} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
