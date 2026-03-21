import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import type { ChartDataPoint } from '../types/database'

const RATES = [
  { key: 'piso', rate: 0.04, color: '#888780', label: 'Piso 4%' },
  { key: 'conservador', rate: 0.07, color: '#E24B4A', label: 'Conservador 7%' },
  { key: 'moderado', rate: 0.10, color: '#1D9E75', label: 'Base 10%' },
  { key: 'otimista', rate: 0.15, color: '#BA7517', label: 'Otimista 15%' },
]

// Constantes dos scripts (comuns aos 3 planos)
const IM1_START = 8
const IM2_START_MAP: Record<string, number> = {
  sprint: 19,
  terceira_margem: 21,
  master: 21,
}
const IM1_BASE = 136_195
const IM1_CAPEX = 170_000 * 1.5
const IM2_TERRENO = 523_000
const IM2_CAPEX = 700_000 * 1.5 * 0.66
function im1Mkt(m: number, rate: number): number {
  if (m < IM1_START) return IM1_BASE
  return (IM1_BASE + IM1_CAPEX) * Math.pow(1 + rate / 12, m - IM1_START)
}

function im2Mkt(m: number, rate: number, im2Start: number): number {
  if (m < im2Start) return IM2_TERRENO
  return (IM2_TERRENO + IM2_CAPEX) * Math.pow(1 + rate / 12, m - im2Start)
}

interface Props {
  baseData: ChartDataPoint[]
  plano: string
}

export default function ValorizacaoChart({ baseData, plano }: Props) {
  if (!baseData.length) {
    return (
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
        <h2 className="text-sm font-medium text-slate-300 mb-4">
          Patrimônio × Valorização Imobiliária
        </h2>
        <p className="text-slate-500 text-sm">Sem dados.</p>
      </div>
    )
  }

  const im2Start = IM2_START_MAP[plano] || 21

  // Calcula patrimônio total para cada taxa de valorização
  const chartData = baseData.map((d, idx) => {
    const m = idx * 4 // mês absoluto (amostragem a cada 4)

    // Componentes que NÃO mudam com a taxa de valorização
    const fixedPart = d.ibkr + d.savings + d.pension + d.cdi + d.lci +
      d.fundo_sar + d.cripto + d.ouro

    const result: Record<string, string | number> = { mes: d.mes }

    for (const r of RATES) {
      const im1 = im1Mkt(m, r.rate) / 1e6
      const im2 = im2Mkt(m, r.rate, im2Start) / 1e6
      result[r.key] = parseFloat((fixedPart + im1 + im2).toFixed(3))
    }

    return result
  })

  const formatM = (v: number) => `R$${v.toFixed(1)}M`

  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
      <h2 className="text-sm font-medium text-slate-300 mb-4">
        Patrimônio × Valorização Imobiliária
      </h2>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 9, fill: '#94a3b8' }}
            interval={2}
            angle={-40}
            textAnchor="end"
            height={55}
          />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={formatM} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value, name) => [
              `R$ ${(Number(value) * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
              name,
            ]}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          {RATES.map((r) => (
            <Line
              key={r.key}
              type="monotone"
              dataKey={r.key}
              name={r.label}
              stroke={r.color}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
