import type { VercelRequest, VercelResponse } from '@vercel/node'

// Allow up to 60s for Claude to process images
export const config = {
  maxDuration: 60,
}

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!ANTHROPIC_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' })
  }

  try {
    const { system, messages, model, max_tokens } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid "messages" in request body' })
    }

    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: max_tokens || 2048,
        system: system || '',
        messages,
      }),
    })

    const data = await anthropicResp.json()

    if (!anthropicResp.ok) {
      return res.status(anthropicResp.status).json({
        error: {
          message: data.error?.message || JSON.stringify(data),
          status: anthropicResp.status,
        },
      })
    }

    return res.status(200).json(data)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[api/analyze] Exception:', message)
    return res.status(500).json({ error: { message: `Server error: ${message}` } })
  }
}
