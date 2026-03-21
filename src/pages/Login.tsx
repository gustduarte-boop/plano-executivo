import { useState, useMemo, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isDark = useMemo(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  const bg = isDark ? '#0a0a0f' : '#f8f9fb'
  const surface = isDark ? '#161822' : '#ffffff'
  const border = isDark ? '#1e2133' : '#e2e8f0'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  const textMuted = isDark ? '#94a3b8' : '#64748b'
  const inputBg = isDark ? '#0f1117' : '#f1f5f9'
  const inputBorder = isDark ? '#1e2133' : '#cbd5e1'

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: bg }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: text }}>Plano Executivo</h1>
          <p className="mt-1 text-sm" style={{ color: textMuted }}>Acompanhamento financeiro</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-6 shadow-xl"
          style={{ backgroundColor: surface, border: `1px solid ${border}` }}
        >
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1.5" style={{ color: textMuted }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: text }}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1.5" style={{ color: textMuted }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: text }}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
