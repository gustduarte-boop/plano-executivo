import { useCallback, useRef } from 'react'
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
  // Track last hovered mes to avoid firing onHover repeatedly for same point
  const lastHoveredRef = useRef<string | null>(null)

  const handleMouseLeave = useCallback(() => {
    lastHoveredRef.current = null
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

  const merged = data.map((d) => {
    const real = saldosReais.find((s) => s.data_ref === d.data_ref)
    return { ...d, real: real ? real.total : undefined }
  })

  const hasReal = merged.some((d) => d.real !== undefined)

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme.isDark ? '#334155' : '#e2e8f0'

  // Custom tooltip content — fires onHover without useEffect to avoid re-render loops
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTooltip = (props: any) => {
    const { active, payload, label } = props

    // Fire hover callback synchronously during render (via ref to avoid loop)
    if (active && payload?.length && onHover) {
      const d = payload[0]?.payload as ChartDataPoint
      if (d && lastHoveredRef.current !== d.mes) {
        lastHoveredRef.current = d.mes
        const liq = (d.ibkr + d.savings + d.pension + d.cdi + d.lci + d.fundo_sar + d.cripto + d.ouro) * 1e6
        const iliq = (d.im1 + d.im2) * 1e6
        // Schedule the state update to avoid updating parent during render
        setTimeout(() => onHover({ mes: d.mes, liquido: liq, iliquido: iliq, total: liq + iliq }), 0)
      }
    }

    if (!active || !payload?.length) return null

    return (
      <div style={{
        backgroundColor: tooltipBg,
        border: `1px solid ${tooltipBorder}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}>
        <p style={{ color: theme.text, fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {payload
          .filter((p: { value: number }) => isFinite(p.value) && p.value !== 0)
          .map((p: { name: string; value: number; color: string }) => (
            <p key={p.name} style={{ color: p.color, margin: '1px 0' }}>
              {p.name}: R$ {(p.value * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          ))}
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}
      onMouseLeave={handleMouseLeave}
    >
      <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>{titulo}</h2>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={merged} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="mes" tick={{ fontSize: 9, fill: theme.textFaint }} interval={2} angle={-40} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v.toFixed(1)}M`} />
          <Tooltip content={renderTooltip} />
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
