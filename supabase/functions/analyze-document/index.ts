import "https://deno.land/x/xhr@0.1.0/mod.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

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
- Comprovante PIX/transferência → tipo: capex (registrar como gasto de obra)

Retorne APENAS um JSON válido (sem markdown, sem comentários) com esta estrutura:
{
  "fonte": "nome da instituição identificada",
  "campo": "nome do campo no sistema (ibkr_usd, savings_usd, pension_usd, cdi_brl, lci_brl, fundo_sar_brl, cripto_usd, ouro_usd) ou 'capex' ou 'desconhecido'",
  "valores": [
    {"descricao": "o que é este valor", "valor": 12345.67, "moeda": "USD"}
  ],
  "valor_principal": 12345.67,
  "moeda": "USD",
  "data_ref": "2026-03-15 ou null se não identificada",
  "confianca": "alta/media/baixa",
  "observacao": "qualquer nota relevante"
}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const { image_base64, media_type } = await req.json()

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: 'image_base64 is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: media_type || 'image/png',
                  data: image_base64,
                },
              },
              {
                type: 'text',
                text: 'Analise esta imagem e extraia as informações financeiras conforme as instruções.',
              },
            ],
          },
        ],
        system: SYSTEM_PROMPT,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API error', details: result }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Extract text from Claude response
    const text = result.content?.[0]?.text || ''

    // Parse JSON from response (may have markdown wrapping)
    let parsed
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response', raw: text }
    } catch {
      parsed = { error: 'Invalid JSON in response', raw: text }
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
