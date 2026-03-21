const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

const SYSTEM_PROMPT = `Você é um assistente financeiro que analisa prints/screenshots de extratos bancários e corretoras.

Ao receber uma imagem, você deve:
1. Identificar a instituição financeira (IBKR, SABB, Nubank, Binance, XP, KAUST Portal, banco, corretora, etc.)
2. Extrair TODOS os valores monetários visíveis
3. Identificar a moeda de cada valor (USD, BRL, SAR, USDT)
4. Identificar a data de referência se visível

Mapeamento de fontes para campos do sistema:
- IBKR / Interactive Brokers → campo: ibkr_usd (moeda: USD)
- KAUST Savings → campo: savings_usd (moeda: USD)
- KAUST Pension → campo: pension_usd (moeda: USD)
- Nubank / Nu → campo: cdi_brl (moeda: BRL)
- SABB / Saudi British Bank → campo: fundo_sar_brl (converter SAR para BRL se necessário)
- Binance / cripto → campo: cripto_usd (moeda: USD/USDT)
- XP Investimentos → campo: lci_brl (moeda: BRL)
- Comprovante PIX/transferência → tipo: capex

Retorne APENAS um JSON válido com esta estrutura:
{
  "fonte": "nome da instituição",
  "campo": "nome do campo (ibkr_usd, savings_usd, pension_usd, cdi_brl, lci_brl, fundo_sar_brl, cripto_usd, ouro_usd, capex, desconhecido)",
  "valores": [{"descricao": "descrição", "valor": 12345.67, "moeda": "USD"}],
  "valor_principal": 12345.67,
  "moeda": "USD",
  "data_ref": "2026-03-15 ou null",
  "confianca": "alta/media/baixa",
  "observacao": "nota relevante"
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
