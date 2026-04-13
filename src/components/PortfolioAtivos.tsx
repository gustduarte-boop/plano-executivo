import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import type { Theme } from '../hooks/useTheme'
import { useAssetPositions } from '../hooks/useAssetPositions'

interface Props { theme: Theme }

const COLORS = [
  '#1D9E75', '#185FA5', '#EF9F27', '#E24B4A', '#22d3ee',
  '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#60a5fa',
]

function fmtVal(v: number, moeda: string) {
  if (v >= 1e6) return `${moeda} ${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${moeda} ${(v / 1e3).toFixed(1)}k`
  return `${moeda} ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function fmtDate(d: string) {
  const [y, m] = d.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`
}

export default function PortfolioAtivos({ theme }: Props) {
  const { data, loading } = useAssetPositions()

  // Latest date per institution
  const latestPerInst = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of data) {
      if (!map[p.instituicao] || p.data_ref > map[p.instituicao]) {
        map[p.instituicao] = p.data_ref
      }
    }
    return map
  }, [data])

  // Latest snapshot date (for display)
  const latestDate = useMemo(() => {
    const dates = Object.values(latestPerInst)
    return dates.length ? dates.sort().at(-1)! : null
  }, [latestPerInst])

  // Current positions: most recent entry per institution
  const currentPositions = useMemo(() =>
    data.filter(p => latestPerInst[p.instituicao] === p.data_ref),
    [data, latestPerInst]
  )

  // Group by institution for snapshot bar chart
  const byInst = useMemo(() => {
    const map: Record<string, { instituicao: string; total: number; moeda: string; ativos: typeof currentPositions }> = {}
    for (const p of currentPositions) {
      if (!map[p.instituicao]) map[p.instituicao] = { instituicao: p.instituicao, total: 0, moeda: p.moeda, ativos: [] }
      map[p.instituicao].total += p.valor
      map[p.instituicao].ativos.push(p)
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [currentPositions])

  // All unique institutions across history
  const allInsts = useMemo(() => {
    const s = new Set(data.map(p => p.instituicao))
    return Array.from(s)
  }, [data])

  // History: group by date → { date, inst1: val | undefined, ... }
  const historyData = useMemo(() => {
    const dates = Array.from(new Set(data.map(p => p.data_ref))).sort()
    return dates.map(date => {
      const row: Record<string, string | number | undefined> = { date: fmtDate(date) }
      for (const inst of allInsts) {
        const positions = data.filter(p => p.data_ref === date && p.instituicao === inst)
        row[inst] = positions.length ? positions.reduce((s, p) => s + p.valor, 0) : undefined
      }
      return row
    })
  }, [data, allInsts])

  // All individual assets for table (latest date)
  const tableRows = useMemo(() =>
    [...currentPositions].sort((a, b) => b.valor - a.valor),
    [currentPositions]
  )

  const totalUSD = currentPositions.filter(p => p.moeda === 'USD').reduce((s, p) => s + p.valor, 0)
  const totalBRL = currentPositions.filter(p => p.moeda === 'BRL').reduce((s, p) => s + p.valor, 0)

  if (loading) return (
    <div className="flex items-center justify-center h-48" style={{ color: theme.textFaint }}>
      <span className="text-sm">Carregando portfólio...</span>
    </div>
  )

  if (!data.length) return (
    <div className="rounded-xl p-6 text-center space-y-2" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <p className="text-sm font-medium" style={{ color: theme.text }}>Nenhum ativo registrado ainda</p>
      <p className="text-xs" style={{ color: theme.textFaint }}>
        Faça upload de um extrato (Binance, KAUST, Nubank...) via Entrada de Dados. Os ativos individuais serão salvos automaticamente.
      </p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Totais */}
      <div className="flex gap-3 flex-wrap">
        <div className="rounded-lg px-4 py-2 text-center" style={{ backgroundColor: theme.accentBg, border: `1px solid ${theme.accentBorder}` }}>
          <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: theme.textFaint }}>Total USD</div>
          <div className="text-sm font-bold tabular-nums" style={{ color: theme.accent }}>{fmtVal(totalUSD, 'USD')}</div>
        </div>
        <div className="rounded-lg px-4 py-2 text-center" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${theme.surfaceBorder}` }}>
          <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: theme.textFaint }}>Total BRL</div>
          <div className="text-sm font-bold tabular-nums" style={{ color: theme.text }}>{fmtVal(totalBRL, 'BRL')}</div>
        </div>
        {latestDate && (
          <div className="rounded-lg px-4 py-2 text-center" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: `1px solid ${theme.surfaceBorder}` }}>
            <div className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: theme.textFaint }}>Última atualização</div>
            <div className="text-sm font-bold" style={{ color: theme.text }}>{fmtDate(latestDate)}</div>
          </div>
        )}
      </div>

      {/* Snapshot por instituição */}
      {byInst.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
          <h3 className="text-xs font-semibold mb-3" style={{ color: theme.textMuted }}>Snapshot atual — por instituição</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byInst} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <YAxis type="category" dataKey="instituicao" tick={{ fontSize: 10, fill: theme.textMuted }} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8 }}
                labelStyle={{ color: theme.text, fontSize: 11 }}
                formatter={(v) => [fmtVal(Number(v ?? 0), ''), 'Total']}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}
                fill={theme.accent}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Evolução histórica */}
      {historyData.length > 1 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
          <h3 className="text-xs font-semibold mb-3" style={{ color: theme.textMuted }}>Evolução por instituição</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={historyData} margin={{ left: 8, right: 16, top: 4, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.textFaint }} />
              <YAxis tick={{ fontSize: 10, fill: theme.textFaint }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}`, borderRadius: 8 }}
                labelStyle={{ color: theme.text, fontSize: 11 }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {allInsts.map((inst, i) => (
                <Line key={inst} type="monotone" dataKey={inst} stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela de ativos */}
      {tableRows.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${theme.surfaceBorder}` }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                <th className="text-left px-3 py-2 font-medium" style={{ color: theme.textFaint }}>Instituição</th>
                <th className="text-left px-3 py-2 font-medium" style={{ color: theme.textFaint }}>Ativo</th>
                <th className="text-right px-3 py-2 font-medium" style={{ color: theme.textFaint }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={row.id} style={{ borderTop: i > 0 ? `1px solid ${theme.surfaceBorder}` : undefined }}>
                  <td className="px-3 py-1.5" style={{ color: theme.textMuted }}>{row.instituicao}</td>
                  <td className="px-3 py-1.5" style={{ color: theme.text }}>{row.ativo}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-medium" style={{ color: theme.accent }}>
                    {fmtVal(row.valor, row.moeda)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
