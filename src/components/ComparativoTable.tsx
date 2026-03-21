import type { Theme } from '../hooks/useTheme'
import { useComparativo } from '../hooks/useComparativo'
import type { Cenario } from '../types/database'

function fmt(v: number): string {
  return `R$ ${(v * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
}

const KEY_DATES = ['2027-07-01', '2028-03-01', '2029-04-01', '2030-01-01', '2032-12-01']
const KEY_LABELS: Record<string, string> = {
  '2027-07-01': 'Jul/2027 (Sprint sai)',
  '2028-03-01': 'Mar/2028 (TM sai)',
  '2029-04-01': 'Abr/2029 (Master sai)',
  '2030-01-01': 'Jan/2030',
  '2032-12-01': 'Dez/2032',
}

interface Props {
  cenario: Cenario
  theme: Theme
}

export default function ComparativoTable({ cenario, theme }: Props) {
  const { data, loading } = useComparativo(cenario)

  if (loading || !data.length) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
        <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>Comparativo nos Marcos</h2>
        <p className="text-sm" style={{ color: theme.textFaint }}>{loading ? 'Carregando...' : 'Sem dados.'}</p>
      </div>
    )
  }

  const keyPoints = data.filter((d) => KEY_DATES.includes(d.data_ref))

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-medium mb-4" style={{ color: theme.textMuted }}>
        Comparativo Sprint / TM / Master — Marcos Chave
      </h2>
      <div className="overflow-x-auto">
        <table className="text-[11px] w-full border-collapse min-w-[500px]" style={{ color: theme.text }}>
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left" style={{ color: theme.textFaint, borderBottom: `2px solid ${theme.surfaceBorder}` }}>Marco</th>
              <th className="px-2 py-1.5 text-right" style={{ color: '#E24B4A', borderBottom: `2px solid ${theme.surfaceBorder}` }}>Sprint</th>
              <th className="px-2 py-1.5 text-right" style={{ color: '#1D9E75', borderBottom: `2px solid ${theme.surfaceBorder}` }}>Terc. Margem</th>
              <th className="px-2 py-1.5 text-right" style={{ color: '#185FA5', borderBottom: `2px solid ${theme.surfaceBorder}` }}>Master</th>
            </tr>
          </thead>
          <tbody>
            {keyPoints.map((p) => {
              const vals = [p.sprint, p.terceira_margem, p.master]
              const maxVal = Math.max(...vals)
              return (
                <tr key={p.data_ref} style={{ borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                  <td className="px-2 py-1.5 font-medium" style={{ color: theme.textMuted }}>
                    {KEY_LABELS[p.data_ref] || p.mes}
                  </td>
                  {vals.map((v, i) => (
                    <td
                      key={i}
                      className="px-2 py-1.5 text-right tabular-nums font-medium"
                      style={{
                        backgroundColor: v === maxVal ? theme.accentBg : 'transparent',
                        color: v === maxVal ? theme.accent : theme.text,
                      }}
                    >
                      {fmt(v)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
