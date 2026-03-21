import type { Theme } from '../hooks/useTheme'

interface CountdownCardProps {
  plano: string
  dataAlvo: Date
  cor: string
  theme: Theme
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

export default function CountdownCard({ plano, dataAlvo, cor, theme }: CountdownCardProps) {
  const now = new Date()
  const { dias, meses, anos, passado } = diffParts(dataAlvo, now)
  const label = dataAlvo.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cor }} />
        <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: theme.textFaint }}>{plano}</span>
      </div>
      {passado ? (
        <p className="text-xs" style={{ color: theme.textFaint }}>Saída realizada</p>
      ) : (
        <>
          <div className="flex items-baseline gap-0.5">
            {anos > 0 && (
              <>
                <span className="text-lg font-bold" style={{ color: theme.text }}>{anos}</span>
                <span className="text-[10px] mr-1" style={{ color: theme.textFaint }}>a</span>
              </>
            )}
            <span className="text-lg font-bold" style={{ color: theme.text }}>{meses}</span>
            <span className="text-[10px] mr-1" style={{ color: theme.textFaint }}>m</span>
            <span className="text-lg font-bold" style={{ color: theme.text }}>{dias % 30}</span>
            <span className="text-[10px]" style={{ color: theme.textFaint }}>d</span>
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: theme.textFaint }}>Saída KAUST {label}</p>
        </>
      )}
    </div>
  )
}
