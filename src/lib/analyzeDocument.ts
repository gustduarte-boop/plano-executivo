const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''
const SUPABASE_FUNC_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-document`
  : ''

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
  const base64 = await fileToBase64(file)
  const mediaType = file.type || 'image/png'

  // Try Edge Function first, fall back to direct API
  if (SUPABASE_FUNC_URL) {
    try {
      const resp = await fetch(SUPABASE_FUNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, media_type: mediaType }),
      })
      if (resp.ok) return await resp.json()
    } catch {
      // Fall through to direct API
    }
  }

  if (!ANTHROPIC_KEY) {
    return {
      fonte: 'desconhecido',
      campo: 'desconhecido',
      valores: [],
      valor_principal: 0,
      moeda: 'BRL',
      data_ref: null,
      confianca: 'baixa',
      observacao: 'API key não configurada. Preencha manualmente.',
      error: 'no_api_key',
    }
  }

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

  const result = await resp.json()
  const text = result.content?.[0]?.text || ''

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { fonte: 'erro', campo: 'desconhecido', valores: [], valor_principal: 0, moeda: 'BRL', data_ref: null, confianca: 'baixa', observacao: text, error: 'parse_error' }
  } catch {
    return { fonte: 'erro', campo: 'desconhecido', valores: [], valor_principal: 0, moeda: 'BRL', data_ref: null, confianca: 'baixa', observacao: text, error: 'parse_error' }
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1]) // Remove data:...;base64, prefix
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
