import { useMemo } from 'react'
import type { Theme } from '../hooks/useTheme'
import type { Plano } from '../types/database'
import {
  TIMELINE, gerarMatriz,
  rpCapexCambio, rpCambioOcc, rpTicketOcc, rpRendaCdi
} from '../lib/formulas'

interface Props {
  plano: Plano
  theme: Theme
}

// Parâmetros fixos dos scripts
const capexVals = [1.0, 1.2, 1.5, 1.8, 2.0, 2.2]
const cambioVals = [4.50, 5.00, 5.50, 5.80, 6.50, 7.00]
const occVals = [0.70, 0.80, 0.85, 1.00, 1.10, 1.15]
const ticketVals = [0.70, 0.80, 0.90, 1.00, 1.10, 1.20]
const rimVals = [0.60, 0.70, 0.80, 0.90, 1.00, 1.10]
const cdiVals = [0.08, 0.09, 0.10, 0.105, 0.12, 0.13]

function colorScale(val: number, min: number, max: number, isDark: boolean): string {
  const t = Math.max(0, Math.min(1, (val - min) / (max - min || 1)))
  // Red → Yellow → Green
  const r = Math.round(t < 0.5 ? 220 : 220 - (t - 0.5) * 2 * 180)
  const g = Math.round(t < 0.5 ? 60 + t * 2 * 160 : 220)
  const b = Math.round(40)
  const alpha = isDark ? 0.3 : 0.2
  return `rgba(${r},${g},${b},${alpha})`
}

function HeatmapTable({ title, rowLabels, colLabels, rowHeader, colHeader, matrix, theme }: {
  title: string
  rowLabels: string[]
  colLabels: string[]
  rowHeader: string
  colHeader: string
  matrix: number[][]
  theme: Theme
}) {
  const allVals = matrix.flat()
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)

  return (
    <div className="mb-4">
      <h3 className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>{title}</h3>
      <div className="overflow-x-auto">
        <table className="text-[11px] w-full border-collapse" style={{ color: theme.text }}>
          <thead>
            <tr>
              <th className="px-2 py-1 text-left" style={{ color: theme.textFaint, borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                {rowHeader} \ {colHeader}
              </th>
              {colLabels.map((c) => (
                <th key={c} className="px-2 py-1 text-center font-medium" style={{ borderBottom: `1px solid ${theme.surfaceBorder}`, color: theme.textMuted }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={ri}>
                <td className="px-2 py-1 font-medium" style={{ color: theme.textMuted, borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                  {rowLabels[ri]}
                </td>
                {row.map((val, ci) => (
                  <td
                    key={ci}
                    className="px-2 py-1 text-center tabular-nums font-medium"
                    style={{
                      backgroundColor: colorScale(val, min, max, theme.isDark),
                      borderBottom: `1px solid ${theme.surfaceBorder}`,
                    }}
                  >
                    {val.toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function SensibilidadeHeatmap({ plano, theme }: Props) {
  const tl = TIMELINE[plano]
  const mRef = tl.transition + 1 // primeiro mês pós-retorno

  const matrices = useMemo(() => {
    const t1 = gerarMatriz(capexVals, cambioVals, (cap, cam) => rpCapexCambio(cap, cam, mRef, tl.im2Start))
    const t2 = gerarMatriz(cambioVals, occVals, (cam, occ) => rpCambioOcc(cam, occ, mRef, tl.im2Start))
    const t3 = gerarMatriz(ticketVals, occVals, (tick, occ) => rpTicketOcc(tick, occ, mRef, tl.im2Start))
    const t4 = gerarMatriz(rimVals, cdiVals, (rim, cdi) => rpRendaCdi(rim, cdi, mRef, tl.im2Start))
    return { t1, t2, t3, t4 }
  }, [plano, mRef, tl.im2Start])

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-medium mb-1" style={{ color: theme.textMuted }}>
        Sensibilidade — Renda Passiva (R$ k/mês)
      </h2>
      <p className="text-[10px] mb-4" style={{ color: theme.textFaint }}>
        Valores no primeiro mês pós-retorno ao Brasil
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HeatmapTable
          title="T1: Fator CAPEX × Câmbio"
          rowLabels={capexVals.map((v) => `${v.toFixed(1)}×`)}
          colLabels={cambioVals.map((v) => `R$${v.toFixed(2)}`)}
          rowHeader="CAPEX"
          colHeader="Câmbio"
          matrix={matrices.t1}
          theme={theme}
        />
        <HeatmapTable
          title="T2: Câmbio × Ocupação"
          rowLabels={cambioVals.map((v) => `R$${v.toFixed(2)}`)}
          colLabels={occVals.map((v) => `${(v * 100).toFixed(0)}%`)}
          rowHeader="Câmbio"
          colHeader="Ocupação"
          matrix={matrices.t2}
          theme={theme}
        />
        <HeatmapTable
          title="T3: Ticket × Ocupação"
          rowLabels={ticketVals.map((v) => `${(v * 100).toFixed(0)}%`)}
          colLabels={occVals.map((v) => `${(v * 100).toFixed(0)}%`)}
          rowHeader="Ticket"
          colHeader="Ocupação"
          matrix={matrices.t3}
          theme={theme}
        />
        <HeatmapTable
          title="T4: Renda Imobiliária × CDI"
          rowLabels={rimVals.map((v) => `${(v * 100).toFixed(0)}%`)}
          colLabels={cdiVals.map((v) => `${(v * 100).toFixed(1)}%`)}
          rowHeader="RIM mult."
          colHeader="CDI"
          matrix={matrices.t4}
          theme={theme}
        />
      </div>
    </div>
  )
}
