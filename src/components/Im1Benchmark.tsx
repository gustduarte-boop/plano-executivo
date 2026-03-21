import type { Theme } from '../hooks/useTheme'

const ESTACOES = [
  { estacao: 'Alta (jan/fev/mai/dez)', ticket: 720, noites: 45 },
  { estacao: 'Ombro (mar/abr/set/out/nov)', ticket: 530, noites: 75 },
  { estacao: 'Baixa (jun/jul/ago)', ticket: 430, noites: 55 },
  { estacao: 'Réveillon', ticket: 1100, noites: 7 },
]

const TOTAL_NOITES = 182
const OCUPACAO = 0.50
const OPEX = 0.21
const BRUTO_ANUAL = ESTACOES.reduce((s, e) => s + e.ticket * e.noites, 0)
const BRUTO_MES = BRUTO_ANUAL / 12

interface Props { theme: Theme }

export default function Im1Benchmark({ theme }: Props) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: theme.text }}>
        IMÓVEL 1 — VILA CORUMBAU | BENCHMARK AIRBNB
      </h2>
      <p className="text-[10px] mb-4" style={{ color: theme.textFaint }}>
        Im.1 Vila Corumbau (100%) — 75m² 2Q piscina — Benchmark: 12 comparáveis Airbnb Corumbau (mar/2026)
      </p>

      <div className="overflow-x-auto">
        <table className="text-[11px] w-full border-collapse" style={{ color: theme.text }}>
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Estação</th>
              <th className="px-2 py-1.5 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Ticket R$/noite</th>
              <th className="px-2 py-1.5 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Noites/ano</th>
              <th className="px-2 py-1.5 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Receita/ano</th>
            </tr>
          </thead>
          <tbody>
            {ESTACOES.map((e, i) => (
              <tr key={e.estacao} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : theme.accentBg, borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                <td className="px-2 py-1.5">{e.estacao}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">R$ {e.ticket.toLocaleString('pt-BR')}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{e.noites}</td>
                <td className="px-2 py-1.5 text-right tabular-nums font-medium">R$ {(e.ticket * e.noites).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
            <tr style={{ borderTop: `2px solid ${theme.surfaceBorder}`, fontWeight: 'bold' }}>
              <td className="px-2 py-1.5">TOTAL</td>
              <td className="px-2 py-1.5 text-right">—</td>
              <td className="px-2 py-1.5 text-right tabular-nums">{TOTAL_NOITES}</td>
              <td className="px-2 py-1.5 text-right tabular-nums">R$ {BRUTO_ANUAL.toLocaleString('pt-BR')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {[
          { label: 'Ocupação', value: `${(OCUPACAO * 100).toFixed(0)}%` },
          { label: 'OPEX (gestão)', value: `${(OPEX * 100).toFixed(0)}%` },
          { label: 'Receita bruta/mês', value: `R$ ${BRUTO_MES.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` },
          { label: 'Receita líq./mês', value: `R$ ${(BRUTO_MES * (1 - OPEX)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` },
        ].map((k) => (
          <div key={k.label} className="rounded-lg p-2 text-center" style={{ backgroundColor: theme.accentBg, border: `1px solid ${theme.surfaceBorder}` }}>
            <div className="text-[9px] uppercase tracking-wide" style={{ color: theme.textFaint }}>{k.label}</div>
            <div className="text-xs font-bold tabular-nums mt-0.5" style={{ color: theme.text }}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
