import type { Theme } from '../hooks/useTheme'
import { useSaldosReais } from '../hooks/usePatrimonio'

const SEED_DATA = [
  { ativo: 'IBKR (ETFs VTI/VXUS/BND/VNQ)', valor: 'USD 10.594', obs: '+USD 6.854 em 74 dias vs jan/2026' },
  { ativo: 'KAUST Savings', valor: 'USD 47.223', obs: 'Retorno 40,09% em 18 meses' },
  { ativo: 'KAUST Pension', valor: 'USD 19.630', obs: 'Fully Vested abr/2026' },
  { ativo: 'Total KAUST + IBKR', valor: 'USD 77.447', obs: '—', bold: true },
  { ativo: 'Cripto — BTC', valor: 'USDT 1.153', obs: 'Preço médio USDT 69.528' },
  { ativo: 'Cripto — ETH', valor: 'USDT 552', obs: 'Preço médio USDT 4.051' },
  { ativo: 'Cripto — BNB/RLC/SOL/ADA/DOT', valor: 'USDT 570', obs: 'Posições residuais' },
  { ativo: 'Cripto — USDT (dry powder)', valor: 'USDT 641', obs: 'Aguardando sinal de entrada' },
  { ativo: 'Nubank CDI (construção)', valor: 'R$ 105.585', obs: 'Entrada + contingência Casa Maior' },
  { ativo: 'Nubank reserva emergência', valor: 'R$ 7.562', obs: '110% CDI' },
  { ativo: 'XP + Nubank + BB', valor: '~R$ 19.000', obs: 'Ações e fundos' },
  { ativo: 'Terreno 486m² (Corumbau vila)', valor: 'R$ 136.195', obs: '486,41m² × R$280/m²' },
  { ativo: 'Terreno 660m² (Ponta Corumbau)', valor: 'R$ 792.000', obs: '660m² × R$1.200/m²' },
  { ativo: 'PATRIMÔNIO TOTAL', valor: '~R$ 1,35M', obs: 'Financeiro + imóveis', bold: true },
]

interface Props { theme: Theme }

export default function FotografiaPatrimonial({ theme }: Props) {
  const saldosReais = useSaldosReais()
  const lastSaldo = saldosReais[saldosReais.length - 1]
  const dataRef = lastSaldo ? lastSaldo.mes : '15/03/2026'

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h2 className="text-sm font-bold mb-1" style={{ color: theme.text }}>
        FOTOGRAFIA PATRIMONIAL — {dataRef}
      </h2>
      <p className="text-[10px] mb-4" style={{ color: theme.textFaint }}>
        {lastSaldo ? 'Dados do último saldo inserido' : 'Dados de referência — inserir saldos reais para atualizar'}
      </p>

      {lastSaldo && (
        <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: theme.accentBg, border: `1px solid ${theme.accentBorder}` }}>
          <div className="text-xs font-bold" style={{ color: theme.accent }}>
            Patrimônio Real: R$ {(lastSaldo.total * 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px]" style={{ color: theme.textMuted }}>Ref: {lastSaldo.mes}</div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="text-[11px] w-full border-collapse min-w-[500px]" style={{ color: theme.text }}>
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Ativo</th>
              <th className="px-2 py-1.5 text-right" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Valor</th>
              <th className="px-2 py-1.5 text-left" style={{ color: theme.textInverse, backgroundColor: theme.accent }}>Observação</th>
            </tr>
          </thead>
          <tbody>
            {SEED_DATA.map((r, i) => (
              <tr
                key={r.ativo}
                style={{
                  backgroundColor: r.bold ? theme.accentBg : (i % 2 === 0 ? 'transparent' : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')),
                  borderBottom: `1px solid ${theme.surfaceBorder}`,
                  fontWeight: r.bold ? 'bold' : 'normal',
                }}
              >
                <td className="px-2 py-1">{r.ativo}</td>
                <td className="px-2 py-1 text-right tabular-nums">{r.valor}</td>
                <td className="px-2 py-1" style={{ color: theme.textMuted }}>{r.obs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
