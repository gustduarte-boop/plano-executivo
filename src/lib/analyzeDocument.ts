const SYSTEM_PROMPT = `Você é um assistente financeiro que analisa prints/screenshots de extratos bancários e corretoras.

PASSO 1 — IDENTIFICAÇÃO VISUAL DA INSTITUIÇÃO:
Antes de ler valores, identifique a instituição pela aparência:
- BANCO DO BRASIL: fundo branco/cinza claro, header com seta ← e título do ativo, banner amarelo "Transação realizada com sucesso!", seções cinza "Lançamentos"/"RESUMO SALDO EM:"/"RENTABILIDADE"/"OUTRAS INFORMAÇÕES", valores em azul, rentabilidade vermelha (neg) e azul (pos), botões "RESGATAR" (azul) e "INVESTIR" (amarelo), indicador "●●●● Risco Alto" (vermelho), campos LCI "LCI Nr./Data Vencimento/Taxa % do CDI/Capital/Rendimentos/IOF/IR"
- NUBANK: fundo preto/roxo escuro (pode ser foto de tela com reflexo/ângulo), logo "nu" roxo circular, headers "Distribuição"/"Caixinhas" com X, ações com ícone circular + "TICKER · Nome" + tipo "Ação brasileira"/"BDR", campos "Quantidade/Preço Médio/Cotação atual/Minha posição ↑%", botões "Vender" (cinza) e "Comprar" (roxo), caixinhas com imagem decorativa + nome + saldo + rendimento verde ↑, badge "Ultravioleta" roxo, "Seu saldo disponível", botão "Criar nova" roxo
- XP INVESTIMENTOS: fundo preto (dark mode), header com seta ← e título da categoria ("Renda Variável Brasil", "Alternativos", "Renda Fixa"), ícone circular com % amarelo/dourado, "Total Investido", "Meus Ativos — X ativo(s) encontrado(s)", cards com fundo cinza escuro, badges "Risco Médio"/"Risco Alto" em dourado, campos "Posição/Valor aplicado/Rendimento/Valor líquido/Cotização de resgate", botões "Resgatar" (outline amarelo) e "Investir" (filled amarelo), rendimento verde com ▲
- IBKR: fundo azul escuro/preto (#1B2838), header "Carteira" com ≡/lupa/sino, banner "Somente leitura", resumo com valor em K + P&L não realizados/realizados, métricas "VALOR DE MERCADO/EXCEDENTE DE LIQ./SMA/PODER DE COMPRA/SPX DELTA", tabs "Posições/Saldos/Ordens/Impact Lens", tabela INSTRUMENTO/ÚLTIMO/VRÇÃ/POSIÇÃO/P&L, exchanges ARCA/NASDAQ.NMS, "Saldos disponíveis", "Dados fornecidos por GFIS", nav "Principal/Carteira/Negociação/Listas de obs./Mercados"
- BINANCE: cor amarela/preta, fundo escuro #181A20, "Visão Geral", tabs "Earn/Spot/Fundos", "Criptomoeda/Conta", botão amarelo "Adicionar fundos", nav "Início/Mercados/Trade/Descubra/Ativos", valores em USDT, botões "Earn" e "TRADE" por ativo
- SABB / SAB: fundo branco, logo vermelho SAB com "الأول" e "Advance", conta "Current **XXXX" com ícone olho, símbolo ﷼ (riyal), botões "Transfers/Insights/Details/More", seção "Credit Cards" com card cinza "SAB Emirates Credit Card" + VISA, "Available Limit", seções "Finance"/"Products" (Family, ICSAB+), nav "Home/Payments(سداد)/Transfers/ForYou/Menu", Home em vermelho quando ativo. NOTA: gasto no cartão = limite total (ex: 38800) - Available Limit
- KAUST: fundo cinza claro, interface web, headers azuis "Global Employee Savings Plan" e/ou "Global Employee Pension Plan", botões "Details"/"Rate of Return"/"Withdrawal"/"Risk Tolerance"/"Termination Request", tabela "Fund Name / Amount / Rate of Return", fundos Vanguard, setas verdes nos retornos

PASSO 2 — ATIVOS CONHECIDOS POR INSTITUIÇÃO:
- BANCO DO BRASIL: "Ações Vale I" (fundo), "BB LCI" / "Extrato LCI" (renda fixa 83% CDI), "Poupança BB", campos "Saldo atual/Rendimento/Capital/Rentabilidade"
- NUBANK: "Construir a casa" (caixinha principal CDI), "Caixinha Turbo Ultravioleta", "Meu sonho de consumo", "Reserva de Emergência", "ROXO34" (Nu Holdings BDR), "VALE3" (Vale ação), saldo disponível em conta
- XP INVESTIMENTOS: "WEGE3" (Weg), "Trend Ouro FIF Multi RL", "XP Long Biased FIC FIM RL", "XP Referenciado", categorias "Renda Variável Brasil", "Alternativos", "Renda Fixa"
- IBKR: "VTI" (Vanguard Total Stock), "VXUS" (Vanguard Int'l), "BND" (Vanguard Bond), "VNQ" (Vanguard REIT), "GLD" (Gold ETF), ETFs americanos em ARCA/NASDAQ.NMS, valores em USD, P&L em vermelho quando negativo
- BINANCE: "BTC" (Bitcoin), "ETH" (Ethereum), "USDT" (TetherUS), "BNB", "SOL" (Solana), "ADA" (Cardano), "DOT" (Polkadot), "RLC" (iExecRLC), "FET" (Fetch.ai), "ONDO" (Ondo Finance), valores em USDT, PNL em verde/vermelho
- SABB / SAB: "Commodity Investment Account", conta corrente SAR, "SAB Emirates Credit Card", limite cartão 38.800 SAR
- KAUST Savings: "Global Employee Savings Plan", "Savings Plan", fundos "Vanguard Emerging Markets Stock Index Fund Inst", "Vanguard U.S. Opportunities Fund Inst", "Vanguard U.S. 500 Stock Index Fund Inst"
- KAUST Pension: "Global Employee Pension Plan", "Pension Plan", "Vanguard Pension Trust Cash Account"

PASSO 3 — EXTRAIR VALORES:
Extraia CADA ATIVO INDIVIDUAL com seu valor. Para Binance/cripto, liste cada moeda separadamente.
Se receber múltiplas imagens, consolide todos os ativos de todas as imagens (sem duplicar).
O valor_principal deve ser o TOTAL SOMADO de todos os ativos.

MAPEAMENTO FONTE → CAMPO:
- Banco do Brasil → campo: lci_brl (moeda: BRL)
- Nubank → campo: cdi_brl (moeda: BRL)
- XP Investimentos → campo: lci_brl (moeda: BRL)
- IBKR / Interactive Brokers → campo: ibkr_usd (moeda: USD)
- KAUST Savings → campo: savings_usd (moeda: USD)
- KAUST Pension → campo: pension_usd (moeda: USD)
- SABB → campo: fundo_sar_brl (moeda: BRL)
- Binance / cripto → campo: cripto_usd (moeda: USD/USDT)
- Comprovante PIX/transferência → campo: capex

IMPORTANTE: Banco do Brasil NÃO é Nubank. BB é amarelo/azul, Nubank é roxo.
NOTA: Algumas imagens podem ser FOTOS DE TELA (tiradas com outro celular), não screenshots. Podem ter reflexo, ângulo, borda do celular visível. Ainda assim, identifique a instituição pelos elementos visuais e extraia os valores.

CASO ESPECIAL — MÚLTIPLOS CAMPOS NO MESMO PRINT:
Se o print mostrar Savings E Pension juntos (KAUST portal), use campo "kaust_ambos" e inclua ambos nos valores.
Se o print mostrar múltiplas contas do mesmo banco, some tudo no valor_principal.

Retorne APENAS um JSON válido:
{
  "fonte": "nome exato da instituição",
  "campo": "campo do sistema (ou kaust_ambos se Savings+Pension juntos)",
  "valores": [{"descricao": "nome do ativo/conta", "valor": 12345.67, "moeda": "USD"}],
  "valor_principal": 12345.67,
  "moeda": "USD",
  "campos_extras": {"savings_usd": 45661.43, "pension_usd": 20196.46},
  "data_ref": "2026-03-15 ou null",
  "confianca": "alta/media/baixa",
  "observacao": "elementos visuais usados"
}
O campo "campos_extras" é opcional — use quando houver mais de um campo para preencher.`

export interface AnalysisResult {
  fonte: string
  campo: string
  valores: Array<{ descricao: string; valor: number; moeda: string }>
  valor_principal: number
  moeda: string
  campos_extras?: Record<string, number>
  data_ref: string | null
  confianca: string
  observacao: string
  error?: string
}

export async function analyzeDocuments(files: File[]): Promise<AnalysisResult> {
  console.log('[AI] Starting analysis for', files.length, 'file(s)')

  // Build content array with all images
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = []
  for (const file of files) {
    console.log('[AI] Processing', file.name, file.size, 'bytes')
    const base64 = await fileToBase64(file)
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: file.type || 'image/png', data: base64 },
    })
  }
  content.push({
    type: 'text',
    text: files.length > 1
      ? `Estas ${files.length} imagens são prints da MESMA instituição/conta. Consolide todos os ativos visíveis em todas as imagens (sem duplicar). Retorne um único JSON com o total.`
      : 'Analise esta imagem e extraia as informações financeiras.',
  })

  console.log('[AI] Calling /api/analyze with', content.length - 1, 'image(s)...')
  try {
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      }),
    })

    console.log('[AI] Response status:', resp.status)
    const result = await resp.json()

    if (!resp.ok) {
      return {
        fonte: 'erro', campo: 'desconhecido', valores: [],
        valor_principal: 0, moeda: 'BRL', data_ref: null, confianca: 'baixa',
        observacao: `API error ${resp.status}: ${result.error?.message || JSON.stringify(result)}`,
        error: 'api_error',
      }
    }

    const text = result.content?.[0]?.text || ''
    console.log('[AI] Response text:', text.substring(0, 300))

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      console.log('[AI] Parsed:', parsed.fonte, '—', parsed.valores?.length, 'valores, total:', parsed.valor_principal)
      return parsed
    }

    return {
      fonte: 'erro', campo: 'desconhecido', valores: [],
      valor_principal: 0, moeda: 'BRL', data_ref: null, confianca: 'baixa',
      observacao: text, error: 'parse_error',
    }
  } catch (e) {
    console.error('[AI] Exception:', e)
    return {
      fonte: 'erro', campo: 'desconhecido', valores: [],
      valor_principal: 0, moeda: 'BRL', data_ref: null, confianca: 'baixa',
      observacao: `Exception: ${e}`, error: 'exception',
    }
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
