import type { VercelRequest, VercelResponse } from '@vercel/node'

// Ping diário nos dois projetos Supabase (free tier pausa após ~7 dias sem atividade).
// Agendado via "crons" no vercel.json — independe da máquina local estar ligada.

const TARGETS = [
  {
    name: 'plano-executivo',
    url: process.env.VITE_SUPABASE_URL || '',
    key: process.env.VITE_SUPABASE_ANON_KEY || '',
    table: 'capex',
  },
  {
    name: 'imoveis-machine-learning',
    url: 'https://jatmuprgxuopyumezjyv.supabase.co',
    // chave publishable (pública por design; RLS protege os dados)
    key: 'sb_publishable_FzmYg8KD7TafRK7rSMEmWg_Qxni-DQ-',
    table: 'premissas',
  },
]

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const results = await Promise.all(
    TARGETS.map(async (t) => {
      if (!t.url || !t.key) return { name: t.name, ok: false, error: 'missing config' }
      try {
        const r = await fetch(`${t.url}/rest/v1/${t.table}?select=id&limit=1`, {
          headers: { apikey: t.key, Authorization: `Bearer ${t.key}` },
        })
        return { name: t.name, ok: r.ok, status: r.status }
      } catch (e) {
        return { name: t.name, ok: false, error: String(e) }
      }
    })
  )

  const allOk = results.every((r) => r.ok)
  return res.status(allOk ? 200 : 500).json({ pingedAt: new Date().toISOString(), results })
}
