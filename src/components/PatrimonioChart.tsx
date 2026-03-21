import { useRef, useState, useCallback } from 'react'
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Line, BarChart
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

// Determines which third of the quarter bar the real month falls in
// data_ref is the projected quarter start (e.g. 2026-01-01)
// saldo data_ref is the real month (e.g. 2026-03-01)
// Returns 0 (1st third), 1 (2nd), or 2 (3rd)
function getMonthOffset(projDate: string, realDate: string): number {
  const pMonth = parseInt(projDate.split('-')[1])
  const rMonth = parseInt(realDate.split('-')[1])
  const diff = ((rMonth - pMonth) + 12) % 12
  return Math.min(diff, 2) // 0, 1, or 2
}

// Custom shape: positions the bar in the correct 1/3 section
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PositionedRealBar(props: any) {
  const { x, y, width, height, fill, monthOffset } = props
  if (!height || height <= 0 || !width) return null
  const thirdW = width / 3
  const xPos = x + thirdW * (monthOffset ?? 2)
  return (
    <rect
      x={xPos}
      y={y}
      width={thirdW}
      height={height}
      fill={fill}
      fillOpacity={0.3}
      stroke={fill}
      strokeWidth={1.5}
      rx={1}
    />
  )
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
    if (hasMatch && closest && showReal) {
      point.r_cdi = closest.cdi
      point.r_lci = closest.lci
      point.r_cripto = closest.cripto
      point.r_im2 = closest.im2
      point.r_im1 = closest.im1
      point.r_fundo_sar = closest.fundo_sar
      point.r_pension = closest.pension
      point.r_savings = closest.savings
      point.r_ibkr = closest.ibkr
      // Store offset for positioning (which third of the bar)
      point._monthOffset = getMonthOffset(d.data_ref, closest.data_ref)
      point._realDataRef = closest.data_ref
    }
    return point
  })

  const hasReal = merged.some((d) => d.r_ibkr !== undefined)

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

  // Get the month offset for custom shape rendering
  const monthOffsets = merged.map((d) => (d._monthOffset as number) ?? 2)

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium" style={{ color: theme.textMuted }}>{titulo}</h2>
        {saldosReais.length > 0 && (
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
        <BarChart
          data={merged}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          onMouseMove={handleChartEvent}
          barGap={-100}
          barCategoryGap="15%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="mes" tick={{ fontSize: 9, fill: theme.textFaint }} interval={2} angle={-40} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v.toFixed(1)}M`} domain={[0, 10]} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: theme.text }}
            formatter={(value, name) => {
              const v = Number(value)
              if (!isFinite(v) || v === 0) return [null, null]
              const n = String(name)
              const label = n.startsWith('R:') ? n : (LABELS[n] || n)
              return [`R$ ${(v * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, label]
            }}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: theme.textMuted }} />

          {/* Projetado — barras largas */}
          {STACK_ORDER.map((key) => (
            <Bar key={key} dataKey={key} name={LABELS[key]} stackId="proj" fill={COLORS[key]} fillOpacity={0.85} />
          ))}

          {/* Real — barras com shape customizado posicionado no terço correto */}
          {hasReal && STACK_ORDER.map((key) => (
            <Bar
              key={`r_${key}`}
              dataKey={`r_${key}`}
              name={`R:${LABELS[key]}`}
              stackId="real"
              fill={COLORS[key]}
              legendType="none"
              shape={(props: Record<string, unknown>) => {
                const idx = props.index as number
                return <PositionedRealBar {...props} monthOffset={monthOffsets[idx ?? 0]} />
              }}
            />
          ))}

          {/* Linha total projetado */}
          <Line type="monotone" dataKey="total" name="Projetado" stroke={theme.text} strokeWidth={2} dot={{ r: 2, fill: theme.text }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
