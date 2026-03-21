import { useRef, useState, useCallback } from 'react'
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Line, ComposedChart
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

  // Match each projected point to nearest real saldo (within 62 days)
  // Real data added as cumulative lines on the same projected points
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
      let cum = 0
      cum += closest.cdi;       point.rc_cdi = cum
      cum += closest.lci;       point.rc_lci = cum
      cum += closest.cripto;    point.rc_cripto = cum
      cum += closest.im2;       point.rc_im2 = cum
      cum += closest.im1;       point.rc_im1 = cum
      cum += closest.fundo_sar; point.rc_fundo_sar = cum
      cum += closest.pension;   point.rc_pension = cum
      cum += closest.savings;   point.rc_savings = cum
      cum += closest.ibkr;      point.rc_ibkr = cum
      point.real_total = closest.total
    }
    return point
  })

  const hasReal = merged.some((d) => d.real_total !== undefined)

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

          {/* Projetado — barras empilhadas */}
          {STACK_ORDER.map((key) => (
            <Bar key={key} dataKey={key} name={LABELS[key]} stackId="proj" fill={COLORS[key]} fillOpacity={0.85} />
          ))}

          {/* Linha total projetado */}
          <Line type="monotone" dataKey="total" name="Projetado" stroke={theme.text} strokeWidth={2} dot={{ r: 2, fill: theme.text }} />

          {/* Real — linhas acumuladas por ativo */}
          {hasReal && STACK_ORDER.map((key) => (
            <Line
              key={`rc_${key}`}
              type="monotone"
              dataKey={`rc_${key}`}
              stroke={COLORS[key]}
              strokeWidth={1.5}
              dot={{ r: 1.5, fill: COLORS[key], strokeWidth: 0 }}
              connectNulls={false}
              legendType="none"
            />
          ))}

          {/* Total real */}
          {hasReal && (
            <Line
              type="monotone"
              dataKey="real_total"
              name="Real"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ r: 3, fill: '#22d3ee', strokeWidth: 1, stroke: theme.isDark ? '#000' : '#fff' }}
              connectNulls={false}
              legendType="diamond"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
