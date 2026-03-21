import { useRef } from 'react'
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Line, ComposedChart, Scatter
} from 'recharts'
import type { ChartDataPoint, SaldoReal } from '../types/database'
import type { Theme } from '../hooks/useTheme'

const COLORS: Record<string, string> = {
  ibkr: '#185FA5', savings: '#1D9E75', pension: '#9FE1CB',
  fundo_sar: '#FAC775', im1: '#BA7517', im2: '#EF9F27',
  cripto: '#7F77DD', cdi: '#E24B4A', lci: '#F28B82',
}

const LABELS: Record<string, string> = {
  cdi: 'CDI Res.', lci: 'LCI/RF', cripto: 'Cripto',
  im2: 'Im.2 (66%)', im1: 'Im.1 (100%)', fundo_sar: 'Fundo SAR',
  pension: 'Pension', savings: 'Savings', ibkr: 'IBKR+Ouro',
}

const STACK_ORDER = ['cdi', 'lci', 'cripto', 'im2', 'im1', 'fundo_sar', 'pension', 'savings', 'ibkr']

export interface HoverPoint {
  mes: string
  liquido: number
  iliquido: number
  total: number
}

interface Props {
  data: ChartDataPoint[]
  saldosReais: SaldoReal[]
  titulo: string
  theme: Theme
  onHover?: (point: HoverPoint | null) => void
}

export default function PatrimonioChart({ data, saldosReais, titulo, theme, onHover }: Props) {
  const lastIndexRef = useRef<number | null>(null)

  if (!data.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>{titulo}</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>Sem dados projetados.</p>
      </div>
    )
  }

  const merged = data.map((d) => {
    const real = saldosReais.find((s) => s.data_ref === d.data_ref)
    return { ...d, real: real ? real.total : undefined }
  })

  const hasReal = merged.some((d) => d.real !== undefined)

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme.isDark ? '#334155' : '#e2e8f0'

  // Recharts onMouseMove — fires with chart state including activeTooltipIndex
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartEvent = (state: any) => {
    if (!onHover) return
    const idx = state?.activeTooltipIndex
    if (idx == null || idx === lastIndexRef.current) return
    lastIndexRef.current = idx
    const d = merged[idx]
    if (!d) return
    const liq = (d.ibkr + d.savings + d.pension + d.cdi + d.lci + d.fundo_sar + d.cripto + (d.ouro || 0)) * 1e6
    const iliq = (d.im1 + d.im2) * 1e6
    onHover({ mes: d.mes, liquido: liq, iliquido: iliq, total: liq + iliq })
  }

  const handleMouseLeave = () => {
    lastIndexRef.current = null
    onHover?.(null)
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}
      onMouseLeave={handleMouseLeave}
    >
      <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>{titulo}</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={merged}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          onMouseMove={handleChartEvent}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="mes" tick={{ fontSize: 9, fill: theme.textFaint }} interval={2} angle={-40} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v.toFixed(1)}M`} domain={[0, 10]} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: theme.text }}
            formatter={(value, name) => {
              const v = Number(value)
              if (!isFinite(v)) return [null, null]
              return [`R$ ${(v * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, name]
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: theme.textMuted }} />
          {STACK_ORDER.map((key) => (
            <Bar key={key} dataKey={key} name={LABELS[key]} stackId="pat" fill={COLORS[key]} fillOpacity={0.85} />
          ))}
          <Line type="monotone" dataKey="total" name="Total" stroke={theme.text} strokeWidth={2} dot={{ r: 2, fill: theme.text }} />
          {hasReal && (
            <Scatter dataKey="real" name="Real" fill="#22d3ee" shape="diamond" legendType="diamond" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
