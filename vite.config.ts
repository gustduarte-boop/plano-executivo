import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function getApiKey(): string {
  // Try .env, .env.local, .env.production in order
  for (const file of ['.env.local', '.env', '.env.production']) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), 'utf-8')
      const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m)
      if (match) return match[1].replace(/["']/g, '').trim()
    } catch { /* file doesn't exist */ }
  }
  return ''
}

function apiProxy(): Plugin {
  return {
    name: 'api-analyze-proxy',
    configureServer(server) {
      const apiKey = getApiKey()
      console.log('[api-proxy] Key:', apiKey ? `${apiKey.substring(0, 15)}... (${apiKey.length} chars)` : 'NOT FOUND')

      server.middlewares.use('/api/analyze', async (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: { message: 'Method not allowed' } }))
          return
        }
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: { message: 'ANTHROPIC_API_KEY not found in .env' } }))
          return
        }

        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const body = JSON.parse(Buffer.concat(chunks).toString())

        try {
          const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: body.model || 'claude-sonnet-4-20250514',
              max_tokens: body.max_tokens || 2048,
              system: body.system || '',
              messages: body.messages,
            }),
          })

          const data = await anthropicResp.text()
          res.writeHead(anthropicResp.status, { 'Content-Type': 'application/json' })
          res.end(data)
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: { message: String(e) } }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), apiProxy()],
})
