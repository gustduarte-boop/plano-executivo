import { type ReactNode } from 'react'

interface KpiCardProps {
  titulo: string
  valor: string
  subtitulo?: string
  icone: ReactNode
  corIcone?: string
  tendencia?: { valor: string; positivo: boolean }
}

export default function KpiCard({ titulo, valor, subtitulo, icone, corIcone = 'text-blue-400', tendencia }: KpiCardProps) {
  return (
    <div className="bg-slate-900 rounded-xl p-5 border border-slate-800">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{titulo}</span>
        <span className={corIcone}>{icone}</span>
      </div>
      <p className="text-2xl font-bold text-white">{valor}</p>
      {subtitulo && <p className="text-xs text-slate-500 mt-1">{subtitulo}</p>}
      {tendencia && (
        <p className={`text-xs mt-1 ${tendencia.positivo ? 'text-emerald-400' : 'text-red-400'}`}>
          {tendencia.positivo ? '+' : ''}{tendencia.valor}
        </p>
      )}
    </div>
  )
}
