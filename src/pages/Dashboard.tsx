import { useState, useCallback } from 'react'
import { LogOut } from 'lucide-react'
import CountdownCard from '../components/CountdownCard'
import PatrimonioChart, { type HoverPoint } from '../components/PatrimonioChart'
import ValorizacaoChart from '../components/ValorizacaoChart'
import LciChart from '../components/LciChart'
import ComparativoChart from '../components/ComparativoChart'
import CoberturaChart from '../components/CoberturaChart'
import SensibilidadeHeatmap from '../components/SensibilidadeHeatmap'
import SinteseTable from '../components/SinteseTable'
import ComparativoTable from '../components/ComparativoTable'
import Im1Benchmark from '../components/Im1Benchmark'
import Im2Maturacao from '../components/Im2Maturacao'
import NotaMetodologica from '../components/NotaMetodologica'
import PremissasTable from '../components/PremissasTable'
import FotografiaPatrimonial from '../components/FotografiaPatrimonial'
import TabelaPatrimonial from '../components/TabelaPatrimonial'
import TabelaRendaDisponivel from '../components/TabelaRendaDisponivel'
import MonteCarloChart from '../components/MonteCarloChart'
import StressTestChart from '../components/StressTestChart'
import CisneNegroChart from '../components/CisneNegroChart'
import CenariosSalariaisChart from '../components/CenariosSalariaisChart'
import SectionCarousel from '../components/SectionCarousel'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { usePatrimonio, useAllCenarios, useSaldosReais, usePatrimonioFull } from '../hooks/usePatrimonio'
import type { Plano, Cenario } from '../types/database'

const MARCOS = [
  { plano: 'Sprint 2027', data: new Date(2027, 6, 1), cor: '#E24B4A' },
  { plano: 'Terceira Margem', data: new Date(2028, 2, 1), cor: '#1D9E75' },
  { plano: 'Master', data: new Date(2029, 2, 1), cor: '#185FA5' },
]

const PLANOS: { key: Plano; label: string; short: string }[] = [
  { key: 'sprint', label: 'Sprint', short: 'SPR' },
  { key: 'terceira_margem', label: 'Terceira Margem', short: 'TM' },
  { key: 'master', label: 'Master', short: 'MST' },
]

const CENARIOS: { key: Cenario; label: string; short: string }[] = [
  { key: 'ultra', label: 'Ultra Pessimista', short: 'Ultra' },
  { key: 'pessim', label: 'Pessimista', short: 'Pessim' },
  { key: 'base', label: 'Base', short: 'Base' },
  { key: 'otim', label: 'Otimista', short: 'Otim' },
]

function fmt(v: number): string {
  if (v >= 1e6) return `R$ ${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `R$ ${(v / 1e3).toFixed(0)}k`
  return `R$ ${v.toFixed(0)}`
}

export default function Dashboard() {
  const { signOut, user } = useAuth()
  const [plano, setPlano] = useState<Plano>('master')
  const [cenario, setCenario] = useState<Cenario>('base')
  const theme = useTheme(plano)
  const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null)
  const onChartHover = useCallback((p: HoverPoint | null) => setHoverPoint(p), [])

  const { data: chartData, loading } = usePatrimonio(plano, cenario)
  const { data: fullData } = usePatrimonioFull(plano, cenario)
  const { data: allCenarios } = useAllCenarios(plano)
  const saldosReais = useSaldosReais()

  const lastPoint = chartData[chartData.length - 1]
  const defaultLiq = lastPoint
    ? (lastPoint.ibkr + lastPoint.savings + lastPoint.pension + lastPoint.cdi +
       lastPoint.lci + lastPoint.fundo_sar + lastPoint.cripto + lastPoint.ouro) * 1e6 : 0
  const defaultIliq = lastPoint ? (lastPoint.im1 + lastPoint.im2) * 1e6 : 0
  const patLiquido = hoverPoint ? hoverPoint.liquido : defaultLiq
  const patIliquido = hoverPoint ? hoverPoint.iliquido : defaultIliq
  const patTotal = patLiquido + patIliquido
  const refLabel = hoverPoint ? hoverPoint.mes : 'Dez/2032'

  const cenariosDisponiveis = plano === 'terceira_margem'
    ? CENARIOS.filter((c) => c.key !== 'ultra') : CENARIOS
  const planoLabel = PLANOS.find((p) => p.key === plano)?.label || plano
  const cenarioLabel = CENARIOS.find((c) => c.key === cenario)?.label || cenario

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: theme.bg }}>
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-20 backdrop-blur-md transition-colors duration-300"
        style={{ backgroundColor: theme.isDark ? 'rgba(10,10,15,0.85)' : 'rgba(255,255,255,0.85)', borderBottom: `1px solid ${theme.surfaceBorder}` }}>
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-5 rounded-sm" style={{ backgroundColor: theme.accent }} />
              <h1 className="text-base font-bold" style={{ color: theme.text }}>Plano Executivo</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: theme.textFaint }}>{user?.email}</span>
              <button onClick={signOut} className="p-1 rounded" style={{ color: theme.textFaint }} title="Sair"><LogOut size={14} /></button>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: theme.isDark ? theme.surface : theme.bgAlt, border: `1px solid ${theme.surfaceBorder}` }}>
              {PLANOS.map((p) => (
                <button key={p.key} onClick={() => { setPlano(p.key); if (p.key === 'terceira_margem' && cenario === 'ultra') setCenario('pessim') }}
                  className="px-3 py-1 rounded-md text-xs font-semibold transition-all duration-200"
                  style={{ backgroundColor: plano === p.key ? theme.accent : 'transparent', color: plano === p.key ? theme.textInverse : theme.textMuted }}>{p.short}</button>
              ))}
            </div>
            <div className="flex gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: theme.isDark ? theme.surface : theme.bgAlt, border: `1px solid ${theme.surfaceBorder}` }}>
              {cenariosDisponiveis.map((c) => (
                <button key={c.key} onClick={() => setCenario(c.key)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200"
                  style={{ backgroundColor: cenario === c.key ? theme.accentBg : 'transparent', color: cenario === c.key ? theme.accent : theme.textFaint, border: cenario === c.key ? `1px solid ${theme.accentBorder}` : '1px solid transparent' }}>{c.short}</button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="rounded-lg px-3 py-1.5 min-w-[120px] text-center" style={{ backgroundColor: theme.accentBg, border: `1px solid ${theme.accentBorder}` }}>
              <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: theme.textFaint }}>Total {refLabel}</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: theme.accent }}>{loading ? '...' : fmt(patTotal)}</div>
            </div>
            <div className="rounded-lg px-3 py-1.5 min-w-[120px] text-center" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.surfaceBorder}` }}>
              <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: theme.textFaint }}>Líquido</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: theme.text }}>{loading ? '...' : fmt(patLiquido)}</div>
            </div>
            <div className="rounded-lg px-3 py-1.5 min-w-[120px] text-center" style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${theme.surfaceBorder}` }}>
              <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: theme.textFaint }}>Ilíquido</div>
              <div className="text-sm font-bold tabular-nums" style={{ color: theme.text }}>{loading ? '...' : fmt(patIliquido)}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="max-w-6xl mx-auto px-4 py-5 space-y-5">
        {/* Countdown */}
        <section>
          <h2 className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: theme.textFaint }}>Countdown — Saída KAUST</h2>
          <div className="grid grid-cols-3 gap-2">
            {MARCOS.map((m) => (<CountdownCard key={m.plano} plano={m.plano} dataAlvo={m.data} cor={m.cor} theme={theme} />))}
          </div>
        </section>

        {/* Carousel único — todos os slides em sequência */}
        <SectionCarousel
          labels={[
            'Evolução', 'LCI/RF', 'Valorização', 'Comparativo', 'Cobertura',
            'Imóveis', 'Risco', 'Stress', 'Salariais',
            'Síntese', 'Detalhado', 'Referência',
          ]}
          theme={theme}
        >
          <PatrimonioChart data={chartData} saldosReais={saldosReais} titulo={`Evolução Patrimonial — ${planoLabel} · ${cenarioLabel}`} theme={theme} onHover={onChartHover} />
          <LciChart data={allCenarios} cenarioAtivo={cenario} theme={theme} />
          <ValorizacaoChart baseData={chartData} plano={plano} theme={theme} />
          <div className="space-y-4">
            <ComparativoChart cenario={cenario} theme={theme} />
            <ComparativoTable cenario={cenario} theme={theme} />
          </div>
          <CoberturaChart data={chartData} plano={plano} theme={theme} />
          <div className="space-y-4">
            <Im1Benchmark theme={theme} />
            <Im2Maturacao plano={plano} theme={theme} />
          </div>
          <div className="space-y-4">
            <MonteCarloChart plano={plano} theme={theme} />
            <SensibilidadeHeatmap plano={plano} theme={theme} />
          </div>
          <div className="space-y-4">
            <StressTestChart plano={plano} theme={theme} />
            <CisneNegroChart plano={plano} theme={theme} />
          </div>
          <CenariosSalariaisChart plano={plano} theme={theme} />
          <SinteseTable theme={theme} />
          <div className="space-y-4">
            <TabelaPatrimonial data={fullData} theme={theme} />
            <TabelaRendaDisponivel plano={plano} cenario={cenario} theme={theme} />
          </div>
          <div className="space-y-4">
            <PremissasTable theme={theme} />
            <FotografiaPatrimonial theme={theme} />
            <NotaMetodologica theme={theme} />
          </div>
        </SectionCarousel>
      </main>
    </div>
  )
}
