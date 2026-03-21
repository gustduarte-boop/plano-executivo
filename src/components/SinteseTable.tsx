import type { Theme } from '../hooks/useTheme'
import { useSintese } from '../hooks/useComparativo'

const PLANO_LABELS: Record<string, string> = {
  sprint: 'Sprint', terceira_margem: 'Terc. Margem', master: 'Master',
}
const CENARIO_LABELS: Record<string, string> = {
  pessim: 'Pessim.', base: 'Base', otim: 'Otim.',
}
const DATA_LABELS: Record<string, string> = {
  '2028-03-01': 'Mar/2028', '2029-04-01': 'Abr/2029', '2032-12-01': 'Dez/2032',
}

function fmt(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}k`
  return v.toFixed(0)
}

interface Props {
  theme: Theme
}

export default function SinteseTable({ theme }: Props) {
  const { data, loading } = useSintese()

  if (loading) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>Síntese — 3 Horizontes × 3 Cenários</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>Carregando...</p>
      </div>
    )
  }

  // Agrupar por plano
  const planos = ['sprint', 'terceira_margem', 'master'] as const
  const cenarios = ['pessim', 'base', 'otim'] as const
  const datas = ['2028-03-01', '2029-04-01', '2032-12-01'] as const

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>
        Síntese — 3 Horizontes × 3 Cenários × 3 Planos
      </h2>
      <div className="overflow-x-auto">
        <table className="text-[11px] w-full border-collapse min-w-[700px]" style={{ color: theme.text }}>
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left" style={{ color: theme.textFaint, borderBottom: `2px solid ${theme.surfaceBorder}` }}>Plano</th>
              <th className="px-2 py-1.5 text-left" style={{ color: theme.textFaint, borderBottom: `2px solid ${theme.surfaceBorder}` }}>Cenário</th>
              {datas.map((d) => (
                <th key={d} className="px-2 py-1.5 text-right" style={{ color: theme.textMuted, borderBottom: `2px solid ${theme.surfaceBorder}` }}>
                  {DATA_LABELS[d]}
                </th>
              ))}
              {datas.map((d) => (
                <th key={`r-${d}`} className="px-2 py-1.5 text-right" style={{ color: theme.textFaint, borderBottom: `2px solid ${theme.surfaceBorder}` }}>
                  Renda {DATA_LABELS[d].split('/')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planos.map((p) =>
              cenarios.map((c, ci) => {
                const rows = datas.map((d) =>
                  data.find((r) => r.plano === p && r.cenario === c && r.data_ref === d)
                )
                const isBase = c === 'base'
                return (
                  <tr
                    key={`${p}-${c}`}
                    style={{
                      backgroundColor: isBase ? theme.accentBg : 'transparent',
                      borderBottom: ci === cenarios.length - 1 ? `2px solid ${theme.surfaceBorder}` : `1px solid ${theme.surfaceBorder}`,
                    }}
                  >
                    <td className="px-2 py-1.5 font-medium" style={{ color: theme.textMuted }}>
                      {ci === 0 ? PLANO_LABELS[p] : ''}
                    </td>
                    <td className="px-2 py-1.5" style={{ color: isBase ? theme.accent : theme.textMuted }}>
                      {CENARIO_LABELS[c]}
                    </td>
                    {rows.map((r, i) => (
                      <td key={i} className="px-2 py-1.5 text-right tabular-nums font-medium">
                        {r ? `R$ ${fmt(r.patrimonio_total_brl)}` : '—'}
                      </td>
                    ))}
                    {rows.map((r, i) => (
                      <td key={`r-${i}`} className="px-2 py-1.5 text-right tabular-nums" style={{ color: theme.textMuted }}>
                        {r ? `R$ ${fmt(r.renda_passiva_brl)}/m` : '—'}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
