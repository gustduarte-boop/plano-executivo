import { DollarSign, TrendingUp, Target, LogOut } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import CountdownCard from '../components/CountdownCard'
import PatrimonioChart from '../components/PatrimonioChart'
import { useAuth } from '../hooks/useAuth'

// Marcos de saída KAUST por plano
const MARCOS = [
  { plano: 'Sprint 2027', data: new Date(2027, 6, 1), cor: '#E24B4A' },      // jul/2027
  { plano: 'Terceira Margem', data: new Date(2028, 2, 1), cor: '#EF9F27' },  // mar/2028
  { plano: 'Master', data: new Date(2029, 2, 1), cor: '#185FA5' },            // mar/2029
]

// Dados mock — serão substituídos por queries ao Supabase
const MOCK_PATRIMONIO = 'R$ 1.482k'
const MOCK_DESVIO = '+2,3%'
const MOCK_PLANO_ADERENTE = 'Master'

export default function Dashboard() {
  const { signOut, user } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Plano Executivo</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{user?.email}</span>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Countdown */}
        <section>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Countdown — Saída KAUST
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {MARCOS.map((m) => (
              <CountdownCard key={m.plano} plano={m.plano} dataAlvo={m.data} cor={m.cor} />
            ))}
          </div>
        </section>

        {/* KPIs */}
        <section>
          <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
            Indicadores
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              titulo="Patrimônio Total"
              valor={MOCK_PATRIMONIO}
              subtitulo="Mar/2026 — últimos saldos"
              icone={<DollarSign size={18} />}
              corIcone="text-emerald-400"
              tendencia={{ valor: '4,1% vs mês anterior', positivo: true }}
            />
            <KpiCard
              titulo="Desvio vs Cenário Base"
              valor={MOCK_DESVIO}
              subtitulo="Acima do projetado"
              icone={<TrendingUp size={18} />}
              corIcone="text-blue-400"
              tendencia={{ valor: '0,8pp vs mês anterior', positivo: true }}
            />
            <KpiCard
              titulo="Plano Mais Aderente"
              valor={MOCK_PLANO_ADERENTE}
              subtitulo="Menor desvio absoluto"
              icone={<Target size={18} />}
              corIcone="text-amber-400"
            />
          </div>
        </section>

        {/* Gráfico */}
        <section>
          <PatrimonioChart />
        </section>
      </main>
    </div>
  )
}
