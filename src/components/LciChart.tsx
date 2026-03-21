import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import type { ChartDataPoint, Cenario } from '../types/database'

const CENARIO_COLORS: Record<Cenario, string> = {
  ultra: '#E24B4A',
  pessim: '#EF9F27',
  base: '#1D9E75',
  otim: '#185FA5',
}

const CENARIO_LABELS: Record<Cenario, string> = {
  ultra: 'Ultra pessimista',
  pessim: 'Pessimista',
  base: 'Base',
  otim: 'Otimista',
}

interface Props {
  data: Record<Cenario, ChartDataPoint[]>
}

export default function LciChart({ data }: Props) {
  // Encontrar o cenário com mais pontos para usar como base de meses
  const cenarios = (Object.keys(data) as Cenario[]).filter((c) => data[c].length > 0)
  if (!cenarios.length) {
    return (
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
        <h2 className="text-sm font-medium text-slate-300 mb-4">Reserva LCI/RF por Cenário</h2>
        <p className="text-slate-500 text-sm">Sem dados.</p>
      </div>
    )
  }

  const basePoints = data[cenarios[0]]

  const chartData = basePoints.map((_, idx) => {
    const point: Record<string, string | number> = { mes: basePoints[idx].mes }
    for (const c of cenarios) {
      const d = data[c][idx]
      if (d) {
        point[c] = parseFloat(((d.cdi + d.lci) * 1000).toFixed(1)) // em R$ mil
      }
    }
    return point
  })

  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
      <h2 className="text-sm font-medium text-slate-300 mb-4">
        Reserva LCI/RF por Cenário (R$ mil)
      </h2>
      <ResponsiveContainer width="100%" height={320}>
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
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={(v) => `R$${v}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value, name) => [
              `R$ ${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}k`,
              CENARIO_LABELS[name as Cenario] || name,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
            formatter={(value) => CENARIO_LABELS[value as Cenario] || value}
          />
          {cenarios.map((c) => (
            <Line
              key={c}
              type="monotone"
              dataKey={c}
              stroke={CENARIO_COLORS[c]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
