import type { Theme } from '../hooks/useTheme'
import type { ChartDataPoint, SaldoReal } from '../types/database'

const KEY_DATES = ['2027-07-01', '2028-03-01', '2029-04-01', '2030-01-01', '2032-12-01']

function fmt(v: number): string {
  const abs = Math.abs(v * 1e6)
  if (abs >= 1e6) return `${(v).toFixed(2)}M`
  if (abs >= 1e3) return `${(v * 1e3).toFixed(0)}k`
  return `${(v * 1e6).toFixed(0)}`
}

interface Props {
  data: ChartDataPoint[]
  saldosReais: SaldoReal[]
  theme: Theme
}

export default function TabelaPatrimonial({ data, saldosReais, theme }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: theme.text }}>Tabela Patrimonial Detalhada</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>Sem dados.</p>
      </div>
    )
  }

  // Find nearest real saldo for each data point (within 62 days)
  function findReal(dataRef: string): SaldoReal | undefined {
    const dDate = new Date(dataRef).getTime()
    let closest: SaldoReal | undefined
    let minDist = Infinity
    for (const s of saldosReais) {
      const dist = Math.abs(new Date(s.data_ref).getTime() - dDate)
      if (dist < minDist) { minDist = dist; closest = s }
    }
    return closest && minDist < 62 * 86400000 ? closest : undefined
  }

  const hasReal = saldosReais.length > 0

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: theme.text }}>
        Tabela Patrimonial — Projetado vs Real
      </h2>
      <p className="text-[10px] mb-3" style={{ color: theme.textFaint }}>
        Meses-chave em destaque. {hasReal ? 'Linha "Real" mostra saldo inserido.' : 'Insira saldos para ver a comparação.'}
      </p>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="text-[10px] w-full border-collapse min-w-[800px]" style={{ color: theme.text }}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="px-1.5 py-1 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Mês</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>IBKR</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Savings</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Pension</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>CDI</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>RF Brasil</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>SAR</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Im.1</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Im.2</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Cripto</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Projetado</th>
              {hasReal && (
                <th className="px-1.5 py-1 text-right" style={{ color: '#0a0a0f', backgroundColor: '#22d3ee' }}>Real</th>
              )}
              {hasReal && (
                <th className="px-1.5 py-1 text-right" style={{ color: '#0a0a0f', backgroundColor: '#22d3ee' }}>Desvio</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const isKey = KEY_DATES.includes(d.data_ref)
              const real = findReal(d.data_ref)
              const desvio = real ? ((real.total - d.total) / d.total) * 100 : null

              return (
                <tr
                  key={d.data_ref}
                  style={{
                    backgroundColor: isKey ? theme.accentBg : real ? (theme.isDark ? 'rgba(34,211,238,0.05)' : 'rgba(34,211,238,0.08)') : 'transparent',
                    fontWeight: isKey ? 'bold' : 'normal',
                    borderBottom: `1px solid ${theme.surfaceBorder}`,
                  }}
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
                  {hasReal && (
                    <td className="px-1.5 py-0.5 text-right tabular-nums font-bold" style={{ color: '#22d3ee' }}>
                      {real ? fmt(real.total) : '—'}
                    </td>
                  )}
                  {hasReal && (
                    <td className="px-1.5 py-0.5 text-right tabular-nums font-medium" style={{
                      color: desvio === null ? theme.textFaint : desvio >= 0 ? '#1D9E75' : '#E24B4A'
                    }}>
                      {desvio !== null ? `${desvio >= 0 ? '+' : ''}${desvio.toFixed(1)}%` : '—'}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
