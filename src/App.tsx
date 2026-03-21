import { useMemo, Component, type ReactNode } from 'react'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#E24B4A', fontFamily: 'monospace', fontSize: 13, backgroundColor: '#0a0a0f', minHeight: '100vh' }}>
          <h1 style={{ color: '#fff', marginBottom: 16 }}>Erro na aplicação</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const { user, loading } = useAuth()

  const isDark = useMemo(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: isDark ? '#0a0a0f' : '#f8f9fb' }}>
        <div className="text-sm" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Carregando...</div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {user ? <Dashboard /> : <Login />}
    </ErrorBoundary>
  )
}

export default App
