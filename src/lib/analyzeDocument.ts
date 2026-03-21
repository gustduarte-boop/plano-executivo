const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

const SYSTEM_PROMPT = `Você é um assistente financeiro que analisa prints/screenshots de extratos bancários e corretoras.

PASSO 1 — IDENTIFICAÇÃO VISUAL DA INSTITUIÇÃO:
Antes de ler valores, identifique a instituição pela aparência:
- BANCO DO BRASIL: cor amarela/azul, logo BB, "Banco do Brasil", "bb.com.br"
- NUBANK: cor roxa/lilás, logo Nu, "Nubank", fundo roxo escuro
- XP INVESTIMENTOS: cor laranja/preta, logo XP, "XP Inc", "xpi.com.br"
- IBKR: cor vermelha/branca, "Interactive Brokers", "IBKR", interface de trading
- BINANCE: cor amarela/preta, fundo escuro #181A20, "Visão Geral", tabs "Earn/Spot/Fundos", "Criptomoeda/Conta", botão amarelo "Adicionar fundos", nav "Início/Mercados/Trade/Descubra/Ativos", valores em USDT, botões "Earn" e "TRADE" por ativo
- SABB: logo SABB, "Saudi British Bank", texto em árabe, valores em SAR
- KAUST: logo KAUST, "King Abdullah University", portal de benefícios

PASSO 2 — ATIVOS CONHECIDOS POR INSTITUIÇÃO:
- BANCO DO BRASIL: "Fundo de Ações Vale I", "LCI BB", "Ações Vale", "BB Ações", "Poupança BB"
- NUBANK: "Caixinha Construir Casa", "Caixinha Turbo", "Caixinha Meu Sonho de Consumo", "Reserva de Emergência", "RDB", "Cofrinhos"
- XP INVESTIMENTOS: "WEGE3", "Trend Ouro FIF", "XP Long Biased", "XP Referenciado"
- IBKR: "VTI", "VXUS", "BND", "VNQ", "GLD", ETFs americanos, valores em USD
- BINANCE: "BTC" (Bitcoin), "ETH" (Ethereum), "USDT" (TetherUS), "BNB", "SOL" (Solana), "ADA" (Cardano), "DOT" (Polkadot), "RLC" (iExecRLC), valores em USDT, PNL em verde/vermelho
- SABB: "Commodity Investment Account", fundo SAR
- KAUST Savings: "Savings Plan", "Employee Savings"
- KAUST Pension: "Pension Plan", "Retirement Plan"

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

Retorne APENAS um JSON válido:
{
  "fonte": "nome exato da instituição",
  "campo": "campo do sistema",
  "valores": [{"descricao": "nome do ativo", "valor": 12345.67, "moeda": "USDT"}],
  "valor_principal": 12345.67,
  "moeda": "USDT",
  "data_ref": "2026-03-15 ou null",
  "confianca": "alta/media/baixa",
  "observacao": "elementos visuais usados na identificação"
}`

export interface AnalysisResult {
  fonte: string
  campo: string
  valores: Array<{ descricao: string; valor: number; moeda: string }>
  valor_principal: number
  moeda: string
  data_ref: string | null
  confianca: string
  observacao: string
  error?: string
}

export async function analyzeDocuments(files: File[]): Promise<AnalysisResult> {
  console.log('[AI] Starting analysis for', files.length, 'file(s)')

  if (!ANTHROPIC_KEY) {
    console.log('[AI] No API key configured')
    return {
      fonte: 'desconhecido', campo: 'desconhecido', valores: [],
      valor_principal: 0, moeda: 'BRL', data_ref: null, confianca: 'baixa',
      observacao: 'API key não configurada. Preencha manualmente.',
      error: 'no_api_key',
    }
  }

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

  console.log('[AI] Calling Anthropic API with', content.length - 1, 'image(s)...')
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
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
