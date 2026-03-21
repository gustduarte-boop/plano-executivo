import type { Theme } from '../hooks/useTheme'
import type { ChartDataPoint } from '../types/database'

const KEY_DATES = ['2027-07-01', '2028-03-01', '2029-04-01', '2030-01-01', '2032-12-01']

function fmt(v: number): string {
  const abs = Math.abs(v * 1e6)
  if (abs >= 1e6) return `${(v).toFixed(2)}M`
  if (abs >= 1e3) return `${(v * 1e3).toFixed(0)}k`
  return `${(v * 1e6).toFixed(0)}`
}

interface Props {
  data: ChartDataPoint[]
  theme: Theme
}

export default function TabelaPatrimonial({ data, theme }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: theme.text }}>Tabela Patrimonial Detalhada</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>Sem dados.</p>
      </div>
    )
  }

  // Usar todos os pontos (amostrados a cada 4 meses no hook)
  const cols = ['IBKR', 'Savings', 'Pension', 'CDI', 'RF Brasil', 'SAR', 'Im.1', 'Im.2', 'Cripto', 'Total']

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: theme.text }}>
        Tabela Patrimonial Detalhada — 84 Meses
      </h2>
      <p className="text-[10px] mb-3" style={{ color: theme.textFaint }}>
        Meses-chave em destaque. Valores em R$.
      </p>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="text-[10px] w-full border-collapse min-w-[700px]" style={{ color: theme.text }}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="px-1.5 py-1 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Mês</th>
              {cols.map((c) => (
                <th key={c} className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const isKey = KEY_DATES.includes(d.data_ref)
              const bg = isKey ? theme.accentBg : 'transparent'
              const weight = isKey ? 'bold' : 'normal'
              return (
                <tr
                  key={d.data_ref}
                  style={{ backgroundColor: bg, fontWeight: weight, borderBottom: `1px solid ${theme.surfaceBorder}` }}
                >
                  <td className="px-1.5 py-0.5 whitespace-nowrap">{d.mes}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(d.ibkr)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(d.savings)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(d.pension)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(d.cdi)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(d.lci)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(d.fundo_sar)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(d.im1)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(d.im2)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums">{fmt(d.cripto)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums font-bold" style={{ color: theme.accent }}>{fmt(d.total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
