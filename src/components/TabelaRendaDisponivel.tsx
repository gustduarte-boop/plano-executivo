import type { Theme } from '../hooks/useTheme'
import type { Plano, Cenario } from '../types/database'
import { useExtra } from '../hooks/useExtras'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const KEY_DATES = ['2027-07-01', '2028-03-01', '2029-04-01', '2030-01-01', '2032-12-01']

function fmtR(v: number): string {
  if (v === 0) return '—'
  const sign = v >= 0 ? '' : '-'
  const abs = Math.abs(v)
  if (abs >= 1000) return `${sign}R$ ${(abs / 1000).toFixed(1)}k`
  return `${sign}R$ ${abs.toFixed(0)}`
}

interface Props {
  plano: Plano
  cenario: Cenario
  theme: Theme
}

export default function TabelaRendaDisponivel({ plano, cenario, theme }: Props) {
  const { data, loading } = useExtra(plano, 'fluxo_mensal')

  if (loading) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: theme.text }}>Renda Disponível</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>Carregando...</p>
      </div>
    )
  }

  // Mapear cenario selecionado para a key do fluxo
  const fluxo = data?.[cenario] || data?.['base']
  if (!fluxo) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: theme.text }}>Renda Disponível</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>Sem dados de fluxo para este plano/cenário.</p>
      </div>
    )
  }

  const rows = fluxo as Array<{ m: number; data: string; renda: number; salario: number; custo: number; excedente: number }>

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: theme.text }}>
        Renda Disponível — 84 Meses
      </h2>
      <p className="text-[10px] mb-3" style={{ color: theme.textFaint }}>
        Renda passiva (Im.1+Im.2) + salário − custo de vida − saúde ANS − manutenção. Meses-chave em destaque.
      </p>

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="text-[10px] w-full border-collapse min-w-[600px]" style={{ color: theme.text }}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="px-1.5 py-1 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Mês</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Renda Im.</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Salário</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Receita Total</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Custo Total</th>
              <th className="px-1.5 py-1 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Excedente</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isKey = KEY_DATES.includes(r.data)
              const receita = r.renda + r.salario
              const excedente = r.custo > 0 ? receita - r.custo : 0
              const m = r.m
              const ano = 2026 + Math.floor(m / 12)
              const mes = MONTHS_PT[m % 12]
              const label = `${mes}/${ano}`
              const isPositive = excedente >= 0

              // Skip months with no activity (Phase 1 pre-return)
              if (r.renda === 0 && r.custo === 0) return null

              return (
                <tr
                  key={r.data}
                  style={{
                    backgroundColor: isKey ? theme.accentBg : 'transparent',
                    fontWeight: isKey ? 'bold' : 'normal',
                    borderBottom: `1px solid ${theme.surfaceBorder}`,
                  }}
                >
                  <td className="px-1.5 py-0.5 whitespace-nowrap">{label}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums" style={{ color: '#1D9E75' }}>{fmtR(r.renda)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums" style={{ color: '#185FA5' }}>{fmtR(r.salario)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums font-medium">{fmtR(receita)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums" style={{ color: '#E24B4A' }}>{fmtR(r.custo)}</td>
                  <td className="px-1.5 py-0.5 text-right tabular-nums font-medium" style={{ color: isPositive ? '#1D9E75' : '#E24B4A' }}>
                    {r.custo > 0 ? fmtR(excedente) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
