import { useState } from 'react'
import { DollarSign, TrendingUp, Target, LogOut } from 'lucide-react'
import KpiCard from '../components/KpiCard'
import CountdownCard from '../components/CountdownCard'
import PatrimonioChart from '../components/PatrimonioChart'
import ValorizacaoChart from '../components/ValorizacaoChart'
import LciChart from '../components/LciChart'
import { useAuth } from '../hooks/useAuth'
import { usePatrimonio, useAllCenarios, useSaldosReais } from '../hooks/usePatrimonio'
import type { Plano, Cenario } from '../types/database'

const MARCOS = [
  { plano: 'Sprint 2027', data: new Date(2027, 6, 1), cor: '#E24B4A' },
  { plano: 'Terceira Margem', data: new Date(2028, 2, 1), cor: '#EF9F27' },
  { plano: 'Master', data: new Date(2029, 2, 1), cor: '#185FA5' },
]

const PLANOS: { key: Plano; label: string }[] = [
  { key: 'sprint', label: 'Sprint' },
  { key: 'terceira_margem', label: 'Terceira Margem' },
  { key: 'master', label: 'Master' },
]

const CENARIOS: { key: Cenario; label: string }[] = [
  { key: 'ultra', label: 'Ultra Pessimista' },
  { key: 'pessim', label: 'Pessimista' },
  { key: 'base', label: 'Base' },
  { key: 'otim', label: 'Otimista' },
]

function formatBRL(v: number): string {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(0)}k`
  return `R$ ${v.toFixed(0)}`
}

export default function Dashboard() {
  const { signOut, user } = useAuth()
  const [plano, setPlano] = useState<Plano>('master')
  const [cenario, setCenario] = useState<Cenario>('base')

  const { data: chartData, loading } = usePatrimonio(plano, cenario)
  const { data: allCenarios } = useAllCenarios(plano)
  const saldosReais = useSaldosReais()

  // KPIs do último ponto disponível
  const lastPoint = chartData[chartData.length - 1]
  const patTotal = lastPoint ? lastPoint.total * 1e6 : 0

  // Desvio: real vs projetado (último saldo real vs projeção no mesmo mês)
  const lastReal = saldosReais[saldosReais.length - 1]
  let desvio = '--'
  let desvioPositivo = true
  if (lastReal) {
    const projected = chartData.find((d) => d.data_ref === lastReal.data_ref)
    if (projected) {
      const pct = ((lastReal.total - projected.total) / projected.total) * 100
      desvio = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
      desvioPositivo = pct >= 0
    }
  }

  // Plano mais aderente
  let planoAderente = '--'
  if (lastReal) {
    // Para isso precisaríamos de dados dos 3 planos — simplificado por enquanto
    planoAderente = plano === 'master' ? 'Master' : plano === 'sprint' ? 'Sprint' : 'Terc. Margem'
  }

  // Cenários disponíveis por plano
  const cenariosDisponiveis = plano === 'terceira_margem'
    ? CENARIOS.filter((c) => c.key !== 'ultra')
    : CENARIOS

  const cenarioLabel = CENARIOS.find((c) => c.key === cenario)?.label || cenario
  const planoLabel = PLANOS.find((p) => p.key === plano)?.label || plano

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

        {/* Navigation: Plano tabs */}
        <section>
          <div className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800 w-fit">
            {PLANOS.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setPlano(p.key)
                  // Se TM, não tem ultra
                  if (p.key === 'terceira_margem' && cenario === 'ultra') setCenario('pessim')
                }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  plano === p.key
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Navigation: Cenário */}
        <section>
          <div className="flex gap-1 bg-slate-900 rounded-lg p-1 border border-slate-800 w-fit">
            {cenariosDisponiveis.map((c) => (
              <button
                key={c.key}
                onClick={() => setCenario(c.key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  cenario === c.key
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* KPIs */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              titulo="Patrimônio Dez/2032"
              valor={loading ? '...' : formatBRL(patTotal)}
              subtitulo={`${planoLabel} — ${cenarioLabel}`}
              icone={<DollarSign size={18} />}
              corIcone="text-emerald-400"
            />
            <KpiCard
              titulo="Desvio vs Projetado"
              valor={desvio}
              subtitulo={lastReal ? `Ref: ${lastReal.mes}` : 'Sem saldos reais'}
              icone={<TrendingUp size={18} />}
              corIcone="text-blue-400"
              tendencia={desvio !== '--' ? { valor: desvio, positivo: desvioPositivo } : undefined}
            />
            <KpiCard
              titulo="Plano Ativo"
              valor={planoAderente}
              subtitulo="Selecionado"
              icone={<Target size={18} />}
              corIcone="text-amber-400"
            />
          </div>
        </section>

        {/* FIG 1A/1B: Evolução Patrimonial */}
        <section>
          <PatrimonioChart
            data={chartData}
            saldosReais={saldosReais}
            titulo={`Evolução Patrimonial — ${planoLabel} · ${cenarioLabel}`}
          />
        </section>

        {/* FIG 1C: LCI/RF por cenário */}
        <section>
          <LciChart data={allCenarios} />
        </section>

        {/* FIG 2: Patrimônio × Valorização */}
        <section>
          <ValorizacaoChart
            baseData={chartData}
            plano={plano}
          />
        </section>
      </main>
    </div>
  )
}
