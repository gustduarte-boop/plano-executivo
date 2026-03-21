import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import type { Theme } from '../hooks/useTheme'
import type { Plano } from '../types/database'
import { TIMELINE, IPCA, TICK_ALTA, N_SUITES, rendaIm2 } from '../lib/formulas'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

interface Props { plano: Plano; theme: Theme }

export default function Im2Maturacao({ plano, theme }: Props) {
  const tl = TIMELINE[plano]

  const data = []
  for (let m = tl.im2Start; m < 84; m++) {
    const age = m - tl.im2Start
    const ano = 2026 + Math.floor(m / 12)
    const mes = MONTHS_PT[m % 12]
    const renda = rendaIm2(m, tl.im2Start) / 1000
    const diariaAlta = TICK_ALTA * (age < 12 ? 0.70 : age < 24 ? 0.85 : 1.0) * Math.pow(1 + IPCA / 12, age)
    const refAlta = TICK_ALTA * Math.pow(1 + IPCA / 12, age)
    data.push({
      mes: `${mes}/${ano}`,
      renda: parseFloat(renda.toFixed(1)),
      diariaAlta: Math.round(diariaAlta),
      refAlta: Math.round(refAlta),
    })
  }

  // Amostrar a cada 2 meses para não sobrecarregar
  const sampled = data.filter((_, i) => i % 2 === 0)

  const tooltipBg = theme.isDark ? '#1e293b' : '#ffffff'
  const tooltipBorder = theme.isDark ? '#334155' : '#e2e8f0'

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: theme.text }}>
        IMÓVEL 2 — PONTA DO CORUMBAU | CURVA DE MATURAÇÃO
      </h2>
      <p className="text-[10px] mb-4" style={{ color: theme.textFaint }}>
        Ponta do Corumbau (66% SPE) — {N_SUITES} suítes — Benchmark: Mandala/Budião (mar/2026)
      </p>

      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={sampled} margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.gridStroke} />
          <XAxis dataKey="mes" tick={{ fontSize: 8, fill: theme.textFaint }} interval={3} angle={-40} textAnchor="end" height={55} />
          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v}k`} label={{ value: 'Renda líq. R$k/mês', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: theme.textFaint } }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => `R$${v}`} label={{ value: 'Diária alta R$/noite', angle: 90, position: 'insideRight', style: { fontSize: 9, fill: theme.textFaint } }} />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: theme.text }}
          />
          <Legend wrapperStyle={{ fontSize: 10, color: theme.textMuted }} />
          <ReferenceLine yAxisId="left" y={0} stroke={theme.textFaint} strokeDasharray="3 3" />
          <Bar yAxisId="left" dataKey="renda" name="Renda líq. (R$k/mês)" fill={theme.accent} fillOpacity={0.7} />
          <Line yAxisId="right" type="monotone" dataKey="diariaAlta" name="Diária alta c/ maturação" stroke="#EF9F27" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="refAlta" name="Referência (sem desconto)" stroke="#94a3b8" strokeWidth={1} dot={false} strokeDasharray="4 2" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Fases de maturação */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { fase: 'Ano 1', desc: '−30% desconto', cor: '#E24B4A' },
          { fase: 'Ano 2', desc: '−15% desconto', cor: '#EF9F27' },
          { fase: 'Pleno', desc: '100% capacidade', cor: '#1D9E75' },
        ].map((f) => (
          <div key={f.fase} className="rounded-lg p-2 text-center" style={{ border: `1px solid ${theme.surfaceBorder}` }}>
            <div className="text-[9px] uppercase tracking-wide" style={{ color: theme.textFaint }}>{f.fase}</div>
            <div className="text-xs font-bold" style={{ color: f.cor }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Benchmark Im.2 */}
      <div className="mt-4 overflow-x-auto">
        <table className="text-[11px] w-full border-collapse" style={{ color: theme.text }}>
          <thead>
            <tr>
              <th className="px-2 py-1 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Parâmetro</th>
              <th className="px-2 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Valor</th>
              <th className="px-2 py-1 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Observação</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Ticket alta', 'R$ 1.300/noite', '108 noites/ano'],
              ['Ticket ombro', 'R$ 1.000/noite', '54 noites/ano'],
              ['Ticket baixa', 'R$ 900/noite', '19 noites/ano'],
              ['Total noites', '181/ano', '6 suítes independentes'],
              ['OPEX', '25%', 'Gestão profissional'],
              ['SPE', '66%', 'Participação societária'],
              ['CEF', 'R$ 800k | 11,19% a.a.', '420 meses SAC | carência 12m'],
              ['Maturação', '2 anos', '−30% / −15% / pleno'],
            ].map(([param, valor, obs], i) => (
              <tr key={param} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : theme.accentBg, borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                <td className="px-2 py-1">{param}</td>
                <td className="px-2 py-1 text-right tabular-nums font-medium">{valor}</td>
                <td className="px-2 py-1" style={{ color: theme.textMuted }}>{obs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
