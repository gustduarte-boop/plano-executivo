import type { Theme } from '../hooks/useTheme'

const PREMISSAS = [
  { grupo: 'Macroeconômicas', items: [
    ['IPCA premissa central', '4,5% a.a.', 'Meta BC — corrige custo de vida, tickets e manutenção'],
    ['IPCA stress', '8,0% a.a.', 'Cenário adverso — stress test'],
    ['Selic / CDI', '13,25% / 10,5%', 'Taxas vigentes mar/2026'],
    ['LCI/RF líquido', '88,35% CDI ≈ 11,66% a.a.', 'MP 2025, Lei 15.270/2025'],
    ['Câmbio USD/BRL', 'R$ 5,80', 'Referência mar/2026'],
  ]},
  { grupo: 'IBKR / KAUST', items: [
    ['Retorno IBKR', '8,0% a.a.', 'Vanguard VT hist. ~10%; margem de segurança'],
    ['Ouro (hedge)', '8% portfólio | 6% a.a.', 'Proteção de cauda'],
    ['IBKR_TETO Fase 1', 'USD 2.800/mês', 'Plano Executivo v4'],
    ['KAUST Savings', 'USD 1.133/mês', 'EE 566 + ER 566 match'],
    ['KAUST Pension', 'USD 566/mês', 'Fully Vested abr/2026'],
    ['Fundo SAR', 'Teto R$120k | 4,4% a.a.', 'SABB Commodity Investment'],
  ]},
  { grupo: 'Arquitetura Fase 1', items: [
    ['Fluxo Fase 1', 'IBKR_TETO → excedente → Brasil', 'CDI_res até R$200k → SAR → LCI'],
    ['Migração KAUST', 'Sav + Pen + SAR → IBKR', 'Conversão em bloco na saída'],
    ['Custo Arabia', 'SAR 8.500/mês', 'SAR 6.500 base + SAR 2.000 viagens'],
    ['Travel Allowance', 'SAR 9.100/evento', 'Jan/2027, jan/2028, jan/2029'],
  ]},
  { grupo: 'Brasil / Imóveis', items: [
    ['Custo de vida', 'R$14.000 + IPCA', 'Fase 2 — corrigido mensalmente'],
    ['Plano saúde ANS', 'R$2.635/mês (mar/2029)', 'Base R$1.100 × reajuste 10%/a × faixa +80%'],
    ['Manutenção', 'R$2.000/mês total', 'R$60k/5anos × 2 imóveis'],
    ['IRPF aluguel', 'Progressivo 2026', 'Isenção R$5k / redutor até R$7.350'],
    ['Fator CAPEX', '1,5× (tripartite)', 'N(1,5;0,2) no Monte Carlo'],
    ['Valorização imóveis', '8%/10%/15%', 'cons/base/otim — N(10%;3%) no MC'],
    ['Im.1 — Vila Corumbau', '100% | R$391k', 'Terreno R$136k + CAPEX R$255k — set/2026'],
    ['Im.2 — Casa 3 Penas', '66% SPE | R$1.216M', 'Terreno R$523k + R$693k — out/2027'],
    ['Im.2 — benchmark', 'Mandala/Budião', 'R$1.300/suite/noite alta'],
    ['Im.2 — maturação', '2 anos (−30%/−15%)', 'Pleno out/2029'],
    ['Im.2 — CEF', 'R$800k | 11,19% a.a.', '420 meses SAC, carência 12m'],
    ['CDI_RES_TETO', 'R$200k', 'Colchão liquidez Brasil'],
    ['Cenários salariais', '0/8k/12k/16k R$/mês', 'A partir de dez/2029'],
  ]},
]

interface Props { theme: Theme }

export default function PremissasTable({ theme }: Props) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-4" style={{ color: theme.text }}>
        PREMISSAS — PLANO EXECUTIVO 3.0 | VERSÃO 23 | MAR/2026
      </h2>

      <div className="overflow-x-auto">
        <table className="text-[11px] w-full border-collapse min-w-[600px]" style={{ color: theme.text }}>
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Parâmetro</th>
              <th className="px-2 py-1.5 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Valor</th>
              <th className="px-2 py-1.5 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Fonte / Observação</th>
            </tr>
          </thead>
          <tbody>
            {PREMISSAS.map((g) => (
              <>
                <tr key={`g-${g.grupo}`}>
                  <td colSpan={3} className="px-2 py-1.5 font-bold text-[10px] uppercase tracking-wide" style={{ backgroundColor: theme.accentBg, color: theme.accent, borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                    {g.grupo}
                  </td>
                </tr>
                {g.items.map(([param, valor, obs], i) => (
                  <tr key={param} style={{ backgroundColor: i % 2 === 0 ? 'transparent' : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'), borderBottom: `1px solid ${theme.surfaceBorder}` }}>
                    <td className="px-2 py-1">{param}</td>
                    <td className="px-2 py-1 text-right tabular-nums font-medium">{valor}</td>
                    <td className="px-2 py-1" style={{ color: theme.textMuted }}>{obs}</td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
