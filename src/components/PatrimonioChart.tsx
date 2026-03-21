import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Line, ComposedChart, Scatter
} from 'recharts'
import type { ChartDataPoint, SaldoReal } from '../types/database'

const COLORS: Record<string, string> = {
  ibkr: '#185FA5',
  savings: '#1D9E75',
  pension: '#9FE1CB',
  fundo_sar: '#FAC775',
  im1: '#BA7517',
  im2: '#EF9F27',
  cripto: '#7F77DD',
  cdi: '#E24B4A',
  lci: '#F28B82',
  ouro: '#C4A23D',
}

const LABELS: Record<string, string> = {
  cdi: 'CDI Res.',
  lci: 'LCI/RF',
  cripto: 'Cripto',
  im2: 'Im.2 (66%)',
  im1: 'Im.1 (100%)',
  fundo_sar: 'Fundo SAR',
  pension: 'Pension',
  savings: 'Savings',
  ibkr: 'IBKR+Ouro',
}

const STACK_ORDER = ['cdi', 'lci', 'cripto', 'im2', 'im1', 'fundo_sar', 'pension', 'savings', 'ibkr']

const formatM = (v: number) => `R$${v.toFixed(1)}M`

interface Props {
  data: ChartDataPoint[]
  saldosReais: SaldoReal[]
  titulo: string
}

export default function PatrimonioChart({ data, saldosReais, titulo }: Props) {
  if (!data.length) {
    return (
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
        <h2 className="text-sm font-medium text-slate-300 mb-4">{titulo}</h2>
        <p className="text-slate-500 text-sm">Sem dados projetados.</p>
      </div>
    )
  }

  // Merge saldos reais nos pontos do gráfico
  const merged = data.map((d) => {
    const real = saldosReais.find((s) => s.data_ref === d.data_ref)
    return { ...d, real: real?.total ?? null }
  })

  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
      <h2 className="text-sm font-medium text-slate-300 mb-4">{titulo}</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={merged} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
            tickFormatter={formatM}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value, name) => {
              const v = Number(value)
              if (name === 'Real') return [`R$ ${(v * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, name]
              return [`R$ ${(v * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, name]
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />

          {STACK_ORDER.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              name={LABELS[key]}
              stackId="pat"
              fill={COLORS[key]}
              fillOpacity={0.85}
            />
          ))}

          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#f8fafc"
            strokeWidth={2}
            dot={{ r: 2, fill: '#f8fafc' }}
          />

          <Scatter
            dataKey="real"
            name="Real"
            fill="#22d3ee"
            shape="diamond"
            legendType="diamond"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
