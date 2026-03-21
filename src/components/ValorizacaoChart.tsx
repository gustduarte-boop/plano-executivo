import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import type { ChartDataPoint } from '../types/database'
import type { Theme } from '../hooks/useTheme'

const RATES = [
  { key: 'piso', rate: 0.04, color: '#888780', label: 'Piso 4%' },
  { key: 'conservador', rate: 0.07, color: '#E24B4A', label: 'Conservador 7%' },
  { key: 'moderado', rate: 0.10, color: '#1D9E75', label: 'Base 10%' },
  { key: 'otimista', rate: 0.15, color: '#BA7517', label: 'Otimista 15%' },
]

const IM1_START = 8
const IM2_START_MAP: Record<string, number> = { sprint: 19, terceira_margem: 21, master: 21 }
const IM1_BASE = 136_195
const IM1_CAPEX = 170_000 * 1.5
const IM2_TERRENO = 523_000
const IM2_CAPEX = 700_000 * 1.5 * 0.66

function im1Mkt(m: number, rate: number) {
  if (m < IM1_START) return IM1_BASE
  return (IM1_BASE + IM1_CAPEX) * Math.pow(1 + rate / 12, m - IM1_START)
}
function im2Mkt(m: number, rate: number, s: number) {
  if (m < s) return IM2_TERRENO
  return (IM2_TERRENO + IM2_CAPEX) * Math.pow(1 + rate / 12, m - s)
}

interface Props {
  baseData: ChartDataPoint[]
  plano: string
  theme: Theme
}

export default function ValorizacaoChart({ baseData, plano, theme }: Props) {
  if (!baseData.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>Patrimônio × Valorização Imobiliária</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>Sem dados.</p>
      </div>
    )
  }

  const im2Start = IM2_START_MAP[plano] || 21
  const chartData = baseData.map((d, idx) => {
    const m = idx * 4
    const fixed = d.ibkr + d.savings + d.pension + d.cdi + d.lci + d.fundo_sar + d.cripto + d.ouro
    const result: Record<string, string | number> = { mes: d.mes }
    for (const r of RATES) {
      result[r.key] = parseFloat((fixed + im1Mkt(m, r.rate) / 1e6 + im2Mkt(m, r.rate, im2Start) / 1e6).toFixed(3))
    }
    return result
  })

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme.isDark ? '#334155' : '#e2e8f0'

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>Patrimônio × Valorização Imobiliária</h2>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="mes" tick={{ fontSize: 9, fill: theme.textFaint }} interval={2} angle={-40} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v.toFixed(1)}M`} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: theme.text }}
            formatter={(value, name) => [`R$ ${(Number(value) * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: theme.textMuted }} />
          {RATES.map((r) => (
            <Line key={r.key} type="monotone" dataKey={r.key} name={r.label} stroke={r.color} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
