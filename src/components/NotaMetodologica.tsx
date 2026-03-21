import type { Theme } from '../hooks/useTheme'

const ESTRATOS = [
  {
    estrato: '1. Fotografia patrimonial auditada',
    conteudo: 'Saldos IBKR, KAUST Savings/Pension, cripto, caixa BRL e imóveis em 15/03/2026 — extraídos de extratos e prints oficiais.',
    certeza: 'Alta',
    certezaDesc: 'Valores verificáveis em documentos primários.',
    certezaCor: '#27500A',
    certezaBg: '#EAF3DE',
  },
  {
    estrato: '2. Projeção-base 2026–2029',
    conteudo: 'Evolução patrimonial, renda imobiliária e reserva RF Brasil — baseadas nas premissas do Plano Executivo 3.0 e no cronograma operacional de referência.',
    certeza: 'Média',
    certezaDesc: 'Condicionada à execução do Plano: janela operacional set/2026 (Im.1), janela out/2027 (Im.2), aportes IBKR mantidos.',
    certezaCor: '#7A5000',
    certezaBg: '#FFF8EE',
  },
  {
    estrato: '3. Projeção expandida 2030–2033',
    conteudo: 'Maturação imobiliária, renda em regime pleno, reserva RF Brasil acumulada — horizonte especulativo com múltiplas premissas incertas.',
    certeza: 'Baixa',
    certezaDesc: 'Usar como ordem de grandeza, não como meta patrimonial.',
    certezaCor: '#A32D2D',
    certezaBg: '#FFF0F0',
  },
]

interface Props { theme: Theme }

export default function NotaMetodologica({ theme }: Props) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-4" style={{ color: theme.text }}>
        NOTA METODOLÓGICA — TRÊS ESTRATOS DE LEITURA
      </h2>

      <div className="overflow-x-auto">
        <table className="text-[11px] w-full border-collapse" style={{ color: theme.text }}>
          <thead>
            <tr>
              <th className="px-3 py-2 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>ESTRATO</th>
              <th className="px-3 py-2 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>CONTEÚDO</th>
              <th className="px-3 py-2 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>GRAU DE CERTEZA</th>
            </tr>
          </thead>
          <tbody>
            {ESTRATOS.map((e) => (
              <tr key={e.estrato} style={{ borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                <td className="px-3 py-2 font-medium align-top" style={{ minWidth: 140 }}>{e.estrato}</td>
                <td className="px-3 py-2 align-top" style={{ color: theme.textMuted }}>{e.conteudo}</td>
                <td className="px-3 py-2 align-top">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: e.certezaBg, color: e.certezaCor }}>
                    {e.certeza}
                  </span>
                  <p className="mt-1 text-[10px]" style={{ color: e.certezaCor }}>{e.certezaDesc}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] mt-3 italic" style={{ color: theme.textFaint }}>
        Nota incorporada na revisão quadripartite de 15/03/2026. Datas imobiliárias são janelas de decisão e execução, não garantias lineares.
      </p>
    </div>
  )
}
