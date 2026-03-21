import { useRef, useState, useCallback } from 'react'
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Line, ComposedChart, Customized
} from 'recharts'
import type { ChartDataPoint, SaldoReal } from '../types/database'
import type { Theme } from '../hooks/useTheme'
import { Eye, EyeOff } from 'lucide-react'

const COLORS: Record<string, string> = {
  ibkr: '#185FA5', savings: '#1D9E75', pension: '#9FE1CB',
  fundo_sar: '#FAC775', im1: '#BA7517', im2: '#EF9F27',
  cripto: '#7F77DD', cdi: '#E24B4A', lci: '#F28B82',
}

const LABELS: Record<string, string> = {
  cdi: 'CDI Res.', lci: 'RF Brasil', cripto: 'Cripto',
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

// Overlay component: draws narrow stacked bars for real data on top of the chart
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RealOverlay({ formattedGraphicalItems, data, showReal }: any) {
  if (!showReal || !formattedGraphicalItems?.length) return null

  // Get bar geometry from the first projected bar (cdi)
  const firstBar = formattedGraphicalItems.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => item.props?.dataKey === 'cdi'
  )
  if (!firstBar?.props?.data) return null

  const barItems = firstBar.props.data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yScale = formattedGraphicalItems[0]?.props?.yAxis?.scale
  if (!yScale) return null

  const rects: JSX.Element[] = []

  barItems.forEach((bar: { x: number; width: number }, idx: number) => {
    const d = data[idx]
    if (!d || d.r_total === undefined) return

    const barX = bar.x
    const barW = bar.width
    const narrowW = barW / 3
    const xOff = barX + (barW - narrowW) / 2

    // Draw stacked segments bottom-up
    let cumulative = 0
    for (const key of STACK_ORDER) {
      const val = d[`r_${key}`] as number
      if (!val || val <= 0) continue

      const y1 = yScale(cumulative + val)
      const y0 = yScale(cumulative)
      const height = y0 - y1

      rects.push(
        <rect
          key={`${idx}-${key}`}
          x={xOff}
          y={y1}
          width={narrowW}
          height={height}
          fill={COLORS[key]}
          fillOpacity={0.2}
          stroke={COLORS[key]}
          strokeWidth={1.5}
          rx={1}
        />
      )
      cumulative += val
    }
  })

  return <g>{rects}</g>
}

export default function PatrimonioChart({ data, saldosReais, titulo, theme, onHover }: Props) {
  const lastIndexRef = useRef<number | null>(null)
  const [showReal, setShowReal] = useState(true)

  const handleMouseLeave = useCallback(() => {
    lastIndexRef.current = null
    onHover?.(null)
  }, [onHover])

  if (!data.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>{titulo}</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>Sem dados projetados.</p>
      </div>
    )
  }

  // Match saldos reais to nearest chart point (within 62 days)
  const merged = data.map((d) => {
    const dDate = new Date(d.data_ref).getTime()
    let closest: SaldoReal | undefined
    let minDist = Infinity
    for (const s of saldosReais) {
      const dist = Math.abs(new Date(s.data_ref).getTime() - dDate)
      if (dist < minDist) { minDist = dist; closest = s }
    }
    const hasMatch = closest && minDist < 62 * 86400000

    const point: Record<string, unknown> = { ...d }
    if (hasMatch && closest) {
      point.r_cdi = closest.cdi
      point.r_lci = closest.lci
      point.r_cripto = closest.cripto
      point.r_im2 = closest.im2
      point.r_im1 = closest.im1
      point.r_fundo_sar = closest.fundo_sar
      point.r_pension = closest.pension
      point.r_savings = closest.savings
      point.r_ibkr = closest.ibkr
      point.r_total = closest.total
    }
    return point
  })

  const hasReal = merged.some((d) => d.r_total !== undefined)

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme.isDark ? '#334155' : '#e2e8f0'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartEvent = (state: any) => {
    if (!onHover) return
    const idx = state?.activeTooltipIndex
    if (idx == null || idx === lastIndexRef.current) return
    lastIndexRef.current = idx
    const d = merged[idx] as ChartDataPoint
    if (!d) return
    const liq = (d.ibkr + d.savings + d.pension + d.cdi + d.lci + d.fundo_sar + d.cripto + (d.ouro || 0)) * 1e6
    const iliq = (d.im1 + d.im2) * 1e6
    onHover({ mes: d.mes, liquido: liq, iliquido: iliq, total: liq + iliq })
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium" style={{ color: theme.textMuted }}>{titulo}</h2>
        {hasReal && (
          <button
            onClick={() => setShowReal(!showReal)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
            style={{
              backgroundColor: showReal ? 'rgba(34,211,238,0.15)' : 'transparent',
              color: showReal ? '#22d3ee' : theme.textFaint,
              border: `1px solid ${showReal ? 'rgba(34,211,238,0.4)' : theme.surfaceBorder}`,
            }}
          >
            {showReal ? <Eye size={12} /> : <EyeOff size={12} />}
            Real
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={merged} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} onMouseMove={handleChartEvent}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="mes" tick={{ fontSize: 9, fill: theme.textFaint }} interval={2} angle={-40} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v.toFixed(1)}M`} domain={[0, 10]} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: theme.text }}
            formatter={(value, name) => {
              const v = Number(value)
              if (!isFinite(v) || v === 0) return [null, null]
              return [`R$ ${(v * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, name]
            }}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: theme.textMuted }} />

          {/* Projetado — barras grossas normais */}
          {STACK_ORDER.map((key) => (
            <Bar key={key} dataKey={key} name={LABELS[key]} stackId="proj" fill={COLORS[key]} fillOpacity={0.85} />
          ))}

          {/* Real — overlay SVG customizado (não afeta layout das barras) */}
          <Customized component={<RealOverlay data={merged} showReal={showReal} />} />

          {/* Linha total projetado */}
          <Line type="monotone" dataKey="total" name="Projetado" stroke={theme.text} strokeWidth={2} dot={{ r: 2, fill: theme.text }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
