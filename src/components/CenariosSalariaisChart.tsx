import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { Theme } from '../hooks/useTheme'
import type { Plano } from '../types/database'
import { useExtra } from '../hooks/useExtras'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const CENARIO_META = [
  { key: 'ultra', label: 'Ultra Pessimista (R$0)', color: '#E24B4A' },
  { key: 'pessim', label: 'Pessimista (R$8k)', color: '#EF9F27' },
  { key: 'base', label: 'Base (R$12k)', color: '#1D9E75' },
  { key: 'otim', label: 'Otimista (R$16k)', color: '#185FA5' },
]

interface Props { plano: Plano; theme: Theme }

export default function CenariosSalariaisChart({ plano, theme }: Props) {
  const { data, loading } = useExtra(plano, 'fluxo_mensal')

  if (loading || !data) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: theme.text }}>CENÁRIOS SALARIAIS — FASE 2</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>{loading ? 'Carregando...' : 'Sem dados.'}</p>
      </div>
    )
  }

  const cenarios = CENARIO_META.filter((c) => data[c.key])
  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: theme.text }}>CENÁRIOS SALARIAIS — FASE 2</h2>
      <p className="text-[10px] mb-4" style={{ color: theme.textFaint }}>
        Renda imobiliária + salário vs custo de vida — pós-retorno ao Brasil
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cenarios.map((c) => {
          const meses = (data[c.key] as Array<{ m: number; data: string; renda: number; salario: number; custo: number; excedente: number }>)
            .filter((d) => d.custo > 0) // só Fase 2
            .filter((_, i) => i % 4 === 0) // amostrar

          if (!meses.length) return null

          const chartData = meses.map((d) => {
            const m = d.m
            const ano = 2026 + Math.floor(m / 12)
            const mes = MONTHS_PT[m % 12]
            return {
              mes: `${mes}/${ano}`,
              renda: d.renda / 1000,
              salario: d.salario / 1000,
              custo: d.custo / 1000,
            }
          })

          return (
            <div key={c.key}>
              <h3 className="text-[11px] font-medium mb-1" style={{ color: c.color }}>{c.label}</h3>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
                  <XAxis dataKey="mes" tick={{ fontSize: 7, fill: theme.textFaint }} interval={2} angle={-35} textAnchor="end" height={40} />
                  <YAxis tick={{ fontSize: 8, fill: theme.textFaint }} tickFormatter={(v) => `${v}k`} />
                  <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 6, fontSize: 10 }} labelStyle={{ color: theme.text }}
                    formatter={(value) => [`R$ ${(Number(value) * 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, undefined]} />
                  <Legend wrapperStyle={{ fontSize: 9, color: theme.textMuted }} />
                  <Bar dataKey="renda" name="Renda" stackId="r" fill="#1D9E75" fillOpacity={0.7} />
                  <Bar dataKey="salario" name="Salário" stackId="r" fill="#185FA5" fillOpacity={0.7} />
                  <Line type="monotone" dataKey="custo" name="Custo" stroke="#E24B4A" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )
        })}
      </div>
    </div>
  )
}
