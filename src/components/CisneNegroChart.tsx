import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { Theme } from '../hooks/useTheme'
import type { Plano } from '../types/database'
import { useExtra } from '../hooks/useExtras'

interface Props { plano: Plano; theme: Theme }

export default function CisneNegroChart({ plano, theme }: Props) {
  const { data, loading } = useExtra(plano, 'cisne_negro')

  if (loading || !data) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: theme.text }}>CISNE NEGRO — SOBREVIVÊNCIA SEM RENDA</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>{loading ? 'Carregando...' : 'Sem dados.'}</p>
      </div>
    )
  }

  const chartData = [
    { cenario: 'Base\n(sem cisne)', valor: data.base / 1000, color: '#1D9E75' },
    { cenario: 'Stress 6m\n(operacional)', valor: data.stress_6m / 1000, color: '#EF9F27' },
    { cenario: 'Pandemia 12m', valor: data.stress_12m / 1000, color: '#E24B4A' },
  ]

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: theme.text }}>CISNE NEGRO — SOBREVIVÊNCIA SEM RENDA IMOBILIÁRIA</h2>
      <p className="text-[10px] mb-4" style={{ color: theme.textFaint }}>
        CDI residual após interrupção total de renda · IBKR gera 4% passivo durante crise
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
            <XAxis dataKey="cenario" tick={{ fontSize: 9, fill: theme.textFaint }} interval={0} />
            <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v}k`} />
            <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8, fontSize: 11 }} labelStyle={{ color: theme.text }}
              formatter={(value) => [`R$ ${(Number(value) * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 'CDI residual']} />
            <Bar dataKey="valor" name="CDI Residual" fillOpacity={0.85}>
              {chartData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="space-y-2">
          {chartData.map((d) => (
            <div key={d.cenario} className="rounded-lg p-3" style={{ border: `1px solid ${theme.surfaceBorder}` }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-xs font-medium" style={{ color: theme.text }}>{d.cenario.replace('\n', ' ')}</span>
              </div>
              <div className="text-lg font-bold tabular-nums" style={{ color: d.color }}>
                R$ {(d.valor * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px]" style={{ color: theme.textFaint }}>
                {d.valor > 0 ? `Cobre ~${Math.round(d.valor * 1000 / 18000)} meses de custo` : 'CDI esgotado'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
