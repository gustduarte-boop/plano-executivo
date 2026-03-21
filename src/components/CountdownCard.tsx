interface CountdownCardProps {
  plano: string
  dataAlvo: Date
  cor: string
}

function diffParts(target: Date, now: Date) {
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return { dias: 0, meses: 0, anos: 0, passado: true }
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  const meses = Math.floor(dias / 30.44)
  const anos = Math.floor(meses / 12)
  const mesesRest = meses % 12
  return { dias, meses: mesesRest, anos, passado: false }
}

export default function CountdownCard({ plano, dataAlvo, cor }: CountdownCardProps) {
  const now = new Date()
  const { dias, meses, anos, passado } = diffParts(dataAlvo, now)

  const label = dataAlvo.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{plano}</span>
      </div>
      {passado ? (
        <p className="text-slate-500 text-sm">Saída realizada</p>
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            {anos > 0 && (
              <>
                <span className="text-2xl font-bold text-white">{anos}</span>
                <span className="text-xs text-slate-400 mr-2">a</span>
              </>
            )}
            <span className="text-2xl font-bold text-white">{meses}</span>
            <span className="text-xs text-slate-400 mr-2">m</span>
            <span className="text-2xl font-bold text-white">{dias % 30}</span>
            <span className="text-xs text-slate-400">d</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Saída KAUST {label}</p>
        </>
      )}
    </div>
  )
}
