import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { Theme } from '../hooks/useTheme'
import type { Plano } from '../types/database'
import { useExtra } from '../hooks/useExtras'

interface Props { plano: Plano; theme: Theme }

function Histogram({ title, histogram, percentiles, color, unit, theme }: {
  title: string; histogram: { counts: number[]; edges: number[] }; percentiles: { p10: number; p50: number; p90: number }
  color: string; unit: string; theme: Theme
}) {
  const data = histogram.counts.map((count: number, i: number) => ({
    bin: `${histogram.edges[i].toFixed(1)}`,
    count,
    rangeLabel: `${histogram.edges[i].toFixed(2)}–${histogram.edges[i + 1].toFixed(2)} ${unit}`,
  }))

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'

  return (
    <div>
      <h3 className="text-xs font-medium mb-1" style={{ color: theme.textMuted }}>{title}</h3>
      <div className="flex gap-2 mb-2">
        {[
          { label: 'P10', value: percentiles.p10 },
          { label: 'P50', value: percentiles.p50 },
          { label: 'P90', value: percentiles.p90 },
        ].map((p) => (
          <div key={p.label} className="rounded px-2 py-0.5 text-center" style={{ backgroundColor: theme.accentBg, border: `1px solid ${theme.surfaceBorder}` }}>
            <span className="text-[9px]" style={{ color: theme.textFaint }}>{p.label}: </span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: theme.text }}>{p.value.toFixed(2)} {unit}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="bin" tick={{ fontSize: 7, fill: theme.textFaint }} interval={9} />
          <YAxis tick={{ fontSize: 8, fill: theme.textFaint }} />
          <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, fontSize: 10 }} labelStyle={{ color: theme.text }} />
          <ReferenceLine x={data.findIndex((d: { bin: string }) => parseFloat(d.bin) >= percentiles.p50).toString()} stroke="#fff" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Bar dataKey="count" fill={color} fillOpacity={0.7} name="Frequência" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function MonteCarloChart({ plano, theme }: Props) {
  const { data, loading } = useExtra(plano, 'monte_carlo')

  if (loading || !data) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: theme.text }}>ANÁLISE DE MONTE CARLO — 5.000 SIMULAÇÕES</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>{loading ? 'Carregando...' : 'Sem dados.'}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: theme.text }}>ANÁLISE DE MONTE CARLO — {data.n_sims.toLocaleString()} SIMULAÇÕES</h2>
      <p className="text-[10px] mb-4" style={{ color: theme.textFaint }}>
        ETFs N(8%,12%) · IPCA N(4,5%,1,5%) · Câmbio N(5,80;0,80) · Ocupação N(100%,15%) · CAPEX N(1,5;0,2) · Val N(10%;3%)
      </p>

      <div className="space-y-4">
        {data.ibkr && (
          <Histogram title="IBKR Consolidado (R$ M)" histogram={data.ibkr.histogram} percentiles={data.ibkr.percentiles} color="#185FA5" unit="M" theme={theme} />
        )}
        {data.total && (
          <Histogram title="Patrimônio Total (R$ M)" histogram={data.total.histogram} percentiles={data.total.percentiles} color="#1D9E75" unit="M" theme={theme} />
        )}
        {data.renda && (
          <Histogram title="Renda Passiva (R$ k/mês)" histogram={data.renda.histogram} percentiles={data.renda.percentiles} color="#EF9F27" unit="k" theme={theme} />
        )}
      </div>
    </div>
  )
}
