const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

const SYSTEM_PROMPT = `Você é um assistente financeiro que analisa prints/screenshots de extratos bancários e corretoras.

PASSO 1 — IDENTIFICAÇÃO VISUAL DA INSTITUIÇÃO:
Antes de ler valores, identifique a instituição pela aparência:
- BANCO DO BRASIL: cor amarela/azul, logo BB, "Banco do Brasil", "bb.com.br"
- NUBANK: cor roxa/lilás, logo Nu, "Nubank", fundo roxo escuro
- XP INVESTIMENTOS: cor laranja/preta, logo XP, "XP Inc", "xpi.com.br"
- IBKR: cor vermelha/branca, "Interactive Brokers", "IBKR", interface de trading
- BINANCE: cor amarela/preta, logo Binance, interface cripto, preços em USDT
- SABB: logo SABB, "Saudi British Bank", texto em árabe, valores em SAR
- KAUST: logo KAUST, "King Abdullah University", portal de benefícios

PASSO 2 — ATIVOS CONHECIDOS POR INSTITUIÇÃO:
Use estes nomes de ativos para confirmar a instituição:
- BANCO DO BRASIL: "Fundo de Ações Vale I", "LCI BB", "Ações Vale", "BB Ações", "Poupança BB", fundos BB
- NUBANK: "Caixinha Construir Casa", "Caixinha Turbo", "Caixinha Meu Sonho de Consumo", "Reserva de Emergência", "RDB", "Cofrinhos"
- XP INVESTIMENTOS: "WEGE3", "Trend Ouro FIF", "XP Long Biased", "XP Referenciado", ações brasileiras
- IBKR: "VTI", "VXUS", "BND", "VNQ", "GLD", ETFs americanos, valores em USD
- BINANCE: "BTC", "ETH", "BNB", "SOL", "ADA", "DOT", "RLC", "USDT", spot/futures
- SABB: "Commodity Investment Account", fundo SAR, valores em riyals/SAR
- KAUST Savings: "Savings Plan", "Employee Savings", contribuição mensal USD
- KAUST Pension: "Pension Plan", "Retirement Plan", vesting USD

PASSO 3 — EXTRAIR VALORES:
Extraia TODOS os valores monetários visíveis com suas moedas.

MAPEAMENTO FONTE → CAMPO:
- Banco do Brasil → campo: lci_brl (moeda: BRL)
- Nubank → campo: cdi_brl (moeda: BRL)
- XP Investimentos → campo: lci_brl (moeda: BRL)
- IBKR / Interactive Brokers → campo: ibkr_usd (moeda: USD)
- KAUST Savings → campo: savings_usd (moeda: USD)
- KAUST Pension → campo: pension_usd (moeda: USD)
- SABB → campo: fundo_sar_brl (moeda: BRL, converter de SAR se necessário)
- Binance / cripto → campo: cripto_usd (moeda: USD/USDT)
- Comprovante PIX/transferência → campo: capex

IMPORTANTE: Banco do Brasil NÃO é Nubank. São instituições completamente diferentes. BB é amarelo/azul, Nubank é roxo.

Retorne APENAS um JSON válido com esta estrutura:
{
  "fonte": "nome exato da instituição identificada",
  "campo": "campo do sistema (ibkr_usd, savings_usd, pension_usd, cdi_brl, lci_brl, fundo_sar_brl, cripto_usd, ouro_usd, capex, desconhecido)",
  "valores": [{"descricao": "nome do ativo/conta", "valor": 12345.67, "moeda": "BRL"}],
  "valor_principal": 12345.67,
  "moeda": "BRL",
  "data_ref": "2026-03-15 ou null se não visível",
  "confianca": "alta/media/baixa",
  "observacao": "elementos visuais usados na identificação (cor, logo, nomes de ativos)"
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

export async function analyzeDocument(file: File): Promise<AnalysisResult> {
  console.log('[AI] Starting analysis for', file.name, file.type, file.size, 'bytes')

  const base64 = await fileToBase64(file)
  const mediaType = file.type || 'image/png'
  console.log('[AI] Base64 ready, length:', base64.length)

  if (!ANTHROPIC_KEY) {
    console.log('[AI] No API key configured')
    return {
      fonte: 'desconhecido', campo: 'desconhecido', valores: [],
      valor_principal: 0, moeda: 'BRL', data_ref: null, confianca: 'baixa',
      observacao: 'API key não configurada. Preencha manualmente.',
      error: 'no_api_key',
    }
  }

  console.log('[AI] Calling Anthropic API...')
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
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: 'Analise esta imagem e extraia as informações financeiras.' },
          ],
        }],
      }),
    })

    console.log('[AI] Response status:', resp.status)
    const result = await resp.json()
    console.log('[AI] Response body:', JSON.stringify(result).substring(0, 300))

    if (!resp.ok) {
      return {
        fonte: 'erro', campo: 'desconhecido', valores: [],
        valor_principal: 0, moeda: 'BRL', data_ref: null, confianca: 'baixa',
        observacao: `API error ${resp.status}: ${result.error?.message || JSON.stringify(result)}`,
        error: 'api_error',
      }
    }

    const text = result.content?.[0]?.text || ''
    console.log('[AI] Extracted text:', text.substring(0, 200))

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      console.log('[AI] Parsed result:', parsed)
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
