import { useRef, useState, useCallback, type ReactElement } from 'react'
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart,
} from 'recharts'
import type { ChartDataPoint, SaldoReal } from '../types/database'
import type { Theme } from '../hooks/useTheme'

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

const STACK_ORDER = ['im2', 'im1', 'ibkr', 'cdi', 'lci', 'cripto', 'fundo_sar', 'pension', 'savings']
const ANCHOR_KEY = STACK_ORDER[0] // im2 — bottom-most segment, used to derive scale + baseline
const MONTHS_PER_BAR = 4

type Mode = 'single' | 'monthly'

export interface HoverPoint {
  mes: string
  liquido: number
  iliquido: number
  total: number
}

interface MergedPoint extends ChartDataPoint {
  reals?: (SaldoReal | null)[]
  lastReal?: SaldoReal | null
}

interface Props {
  data: ChartDataPoint[]
  saldosReais: SaldoReal[]
  titulo: string
  theme: Theme
  onHover?: (point: HoverPoint | null) => void
}

export default function PatrimonioChartNested({ data, saldosReais, titulo, theme, onHover }: Props) {
  const [mode, setMode] = useState<Mode>('monthly')
  const lastIndexRef = useRef<number | null>(null)

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

  const merged: MergedPoint[] = data.map((d) => ({
    ...d,
    reals: [null, null, null, null] as (SaldoReal | null)[],
    lastReal: null as SaldoReal | null,
  }))

  if (saldosReais.length > 0 && merged.length > 0) {
    const sortedReals = [...saldosReais].sort(
      (a, b) => new Date(a.data_ref).getTime() - new Date(b.data_ref).getTime(),
    )
    const firstRealTs = new Date(sortedReals[0].data_ref).getTime()
    let hostIdx = 0
    for (let i = 0; i < merged.length; i++) {
      const barTs = new Date(merged[i].data_ref).getTime()
      if (barTs <= firstRealTs) hostIdx = i
      else break
    }
    for (let i = 0; i < sortedReals.length; i++) {
      const chunkIdx = Math.floor(i / MONTHS_PER_BAR)
      const slotIdx = i % MONTHS_PER_BAR
      const target = merged[hostIdx + chunkIdx]
      if (!target) break
      target.reals![slotIdx] = sortedReals[i]
      target.lastReal = sortedReals[i]
    }
  }

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme.isDark ? '#334155' : '#e2e8f0'

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

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: 500,
    backgroundColor: active ? 'rgba(34,211,238,0.15)' : 'transparent',
    color: active ? '#22d3ee' : theme.textFaint,
    border: `1px solid ${active ? 'rgba(34,211,238,0.4)' : theme.surfaceBorder}`,
    cursor: 'pointer',
  })

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium" style={{ color: theme.textMuted }}>{titulo}</h2>
        <div className="flex gap-2">
          <button onClick={() => setMode('single')} style={tabBtn(mode === 'single')}>1 barra (último saldo)</button>
          <button onClick={() => setMode('monthly')} style={tabBtn(mode === 'monthly')}>4 barras (mensal)</button>
        </div>
      </div>
      <p className="text-[10px] mb-4" style={{ color: theme.textFaint }}>
        Barra larga (opacidade 55%) = projetado quadrimestral. Até 4 barrinhas estreitas internas = saldos reais (1 por mês do quadrimestre, empilhados pelos mesmos componentes).
      </p>
      <ResponsiveContainer width="100%" height={420}>
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

          {STACK_ORDER.map((key) => {
            const isAnchor = key === ANCHOR_KEY
            return (
              <Bar
                key={key}
                dataKey={key}
                name={LABELS[key]}
                stackId="proj"
                fill={COLORS[key]}
                fillOpacity={0.55}
                barSize={60}
                shape={isAnchor ? (props: unknown) => <AnchorWithNested {...(props as AnchorShapeProps)} mode={mode} /> : undefined}
              />
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>

      <Legend4MonthIndicator theme={theme} mode={mode} />
    </div>
  )
}

interface AnchorShapeProps {
  x: number
  y: number
  width: number
  height: number
  fill: string
  fillOpacity?: number
  value: number
  payload: MergedPoint
  background?: { x: number; y: number; width: number; height: number }
  mode: Mode
}

function AnchorWithNested(props: AnchorShapeProps) {
  const { x, y, width, height, fill, fillOpacity, value, payload, background, mode } = props

  // Render the original anchor segment (im2) — simple rect at (x, y, width, height).
  const baseRect =
    height > 0 ? (
      <rect x={x} y={y} width={width} height={height} fill={fill} fillOpacity={fillOpacity ?? 0.55} />
    ) : null

  // Derive y-axis scale: pixels per unit.
  // Anchor segment may be 0 (no im2 yet). Fall back to using projected total + plot area.
  let pixelsPerUnit = 0
  let baseline = 0
  if (height > 0 && value > 0) {
    pixelsPerUnit = height / value
    baseline = y + height
  } else if (background && payload?.total) {
    // Without anchor height, derive from chart geometry: 0..10M maps to plot area height.
    // Use yAxis domain of [0, 10] (matches the YAxis prop). 10 = top, 0 = bottom.
    const plotBottom = background.y + background.height
    pixelsPerUnit = background.height / 10
    baseline = plotBottom
  } else {
    return baseRect
  }

  if (!payload) return baseRect

  const drawStack = (key: string, rectX: number, rectW: number, real: SaldoReal) => {
    let cum = 0
    return (
      <g key={key}>
        {STACK_ORDER.map((k) => {
          const v = (real[k as keyof SaldoReal] as number) || 0
          if (v <= 0) return null
          const segH = v * pixelsPerUnit
          const segY = baseline - (cum + v) * pixelsPerUnit
          cum += v
          if (segH <= 0) return null
          return (
            <rect
              key={`${key}-${k}`}
              x={rectX}
              y={segY}
              width={rectW}
              height={segH}
              fill={COLORS[k]}
              fillOpacity={1}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={0.6}
            />
          )
        })}
      </g>
    )
  }

  let nestedBars: ReactElement | null = null
  const projCenter = x + width / 2

  if (mode === 'single' && payload.lastReal) {
    const W = Math.max(14, Math.floor(width * 0.5))
    const xRect = projCenter - W / 2
    nestedBars = drawStack(`${payload.mes}-single`, xRect, W, payload.lastReal)
  } else if (mode === 'monthly' && payload.reals?.some((r) => r)) {
    const usable = width * 0.92
    const GAP = 1
    const NARROW_W = Math.max(5, Math.floor((usable - GAP * 3) / 4))
    const TOTAL_W = NARROW_W * 4 + GAP * 3
    const groupLeft = projCenter - TOTAL_W / 2
    nestedBars = (
      <g>
        {payload.reals.map((real, mIdx) => {
          if (!real) return null
          const rectX = groupLeft + mIdx * (NARROW_W + GAP)
          return drawStack(`${payload.mes}-m${mIdx}`, rectX, NARROW_W, real)
        })}
      </g>
    )
  }

  return (
    <g>
      {baseRect}
      {nestedBars}
    </g>
  )
}

function Legend4MonthIndicator({ theme, mode }: { theme: Theme; mode: Mode }) {
  return (
    <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: theme.textFaint }}>
      <div className="flex items-center gap-1">
        <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#BA7517', opacity: 0.4 }} />
        <span>projetado (quadrimestre)</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex gap-[1px]">
          {(mode === 'single' ? [0] : [0, 1, 2, 3]).map((i) => (
            <div key={i} className="w-1.5 h-3 rounded-[1px]" style={{ backgroundColor: '#BA7517' }} />
          ))}
        </div>
        <span>{mode === 'single' ? 'real (último saldo do quadrimestre)' : 'real (m1, m2, m3, m4)'}</span>
      </div>
    </div>
  )
}
