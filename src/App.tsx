import { useMemo } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function App() {
  const { user, loading } = useAuth()

  const isDark = useMemo(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: isDark ? '#0a0a0f' : '#f8f9fb' }}
      >
        <div className="text-sm" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
          Carregando...
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}

export default App
