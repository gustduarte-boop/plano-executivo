import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Theme } from '../hooks/useTheme'
import type { AnalysisResult } from '../lib/analyzeDocument'

interface Instituicao {
  key: string
  label: string
  campos: { key: string; label: string; moeda: string }[]
}

const INSTITUICOES: Instituicao[] = [
  { key: 'ibkr', label: 'IBKR', campos: [
    { key: 'ibkr_usd', label: 'Saldo IBKR (USD)', moeda: 'USD' },
    { key: 'ouro_usd', label: 'Ouro / Gold (USD)', moeda: 'USD' },
  ]},
  { key: 'savings', label: 'KAUST Savings', campos: [
    { key: 'savings_usd', label: 'Savings (USD)', moeda: 'USD' },
  ]},
  { key: 'pension', label: 'KAUST Pension', campos: [
    { key: 'pension_usd', label: 'Pension (USD)', moeda: 'USD' },
  ]},
  { key: 'nubank', label: 'Nubank', campos: [
    { key: 'cdi_brl', label: 'CDI / Caixinhas (BRL)', moeda: 'BRL' },
  ]},
  { key: 'bb', label: 'Banco do Brasil', campos: [
    { key: 'lci_brl', label: 'RF Brasil — BB+XP (BRL)', moeda: 'BRL' },
  ]},
  { key: 'xp', label: 'XP Investimentos', campos: [
    { key: 'lci_brl', label: 'RF Brasil — BB+XP (BRL)', moeda: 'BRL' },
  ]},
  { key: 'sabb', label: 'SABB', campos: [
    { key: 'fundo_sar_brl', label: 'Fundo SAR (BRL)', moeda: 'BRL' },
  ]},
  { key: 'binance', label: 'Binance', campos: [
    { key: 'cripto_usd', label: 'Cripto (USD)', moeda: 'USD' },
  ]},
  { key: 'im1', label: 'Im.1 valor estimado', campos: [
    { key: 'im1_valor_brl', label: 'Valor Im.1 (BRL)', moeda: 'BRL' },
  ]},
  { key: 'im2', label: 'Im.2 valor estimado', campos: [
    { key: 'im2_valor_brl', label: 'Valor Im.2 (BRL)', moeda: 'BRL' },
  ]},
  { key: 'cambio', label: 'Câmbio', campos: [
    { key: 'cambio_usd_brl', label: 'USD/BRL', moeda: '' },
  ]},
  { key: 'outro', label: 'Outro (todos os campos)', campos: [
    { key: 'ibkr_usd', label: 'IBKR (USD)', moeda: 'USD' },
    { key: 'savings_usd', label: 'Savings (USD)', moeda: 'USD' },
    { key: 'pension_usd', label: 'Pension (USD)', moeda: 'USD' },
    { key: 'cdi_brl', label: 'CDI / Nubank (BRL)', moeda: 'BRL' },
    { key: 'lci_brl', label: 'RF Brasil — BB+XP (BRL)', moeda: 'BRL' },
    { key: 'fundo_sar_brl', label: 'Fundo SAR (BRL)', moeda: 'BRL' },
    { key: 'cripto_usd', label: 'Cripto (USD)', moeda: 'USD' },
    { key: 'ouro_usd', label: 'Ouro (USD)', moeda: 'USD' },
    { key: 'im1_valor_brl', label: 'Im.1 (BRL)', moeda: 'BRL' },
    { key: 'im2_valor_brl', label: 'Im.2 (BRL)', moeda: 'BRL' },
    { key: 'cambio_usd_brl', label: 'Câmbio', moeda: '' },
  ]},
]

// Map AI campo → instituição key
const CAMPO_TO_INST: Record<string, string> = {
  ibkr_usd: 'ibkr', ouro_usd: 'ibkr',
  savings_usd: 'savings', pension_usd: 'pension',
  cdi_brl: 'nubank', lci_brl: 'xp',
  fundo_sar_brl: 'sabb', cripto_usd: 'binance',
  im1_valor_brl: 'im1', im2_valor_brl: 'im2',
  cambio_usd_brl: 'cambio',
}

interface Props {
  theme: Theme
  analysis: AnalysisResult | null
  onSaved: () => void
}

export default function SaldoForm({ theme, analysis, onSaved }: Props) {
  const now = new Date()
  const [inst, setInst] = useState('outro')
  const [dataRef, setDataRef] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
  const [values, setValues] = useState<Record<string, string>>({})
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Pre-fill from AI analysis
  useEffect(() => {
    if (!analysis || analysis.error) return

    // Auto-select institution
    if (analysis.campo && analysis.campo !== 'desconhecido' && analysis.campo !== 'capex') {
      const mappedInst = CAMPO_TO_INST[analysis.campo]
      // KAUST ambos → show all fields
      if (analysis.campo === 'kaust_ambos') {
        setInst('outro')
      } else if (mappedInst) {
        setInst(mappedInst)
      }

      const newVals: Record<string, string> = {}
      // Fill from campos_extras if available (e.g. savings + pension together)
      if (analysis.campos_extras) {
        for (const [k, v] of Object.entries(analysis.campos_extras)) {
          newVals[k] = String(v)
        }
      } else {
        newVals[analysis.campo] = String(analysis.valor_principal)
      }
      setValues(prev => ({ ...prev, ...newVals }))
    }

    // Auto-fill date
    if (analysis.data_ref) {
      const d = new Date(analysis.data_ref)
      if (!isNaN(d.getTime())) {
        setDataRef(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
      }
    }

    if (analysis.fonte) {
      setNotas(`Via IA: ${analysis.fonte}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis])

  const selectedInst = INSTITUICOES.find(i => i.key === inst) || INSTITUICOES[INSTITUICOES.length - 1]

  const handleSave = async () => {
    setSaving(true)
    setMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Não autenticado'); setSaving(false); return }

    const row: Record<string, unknown> = {
      user_id: user.id,
      data_ref: dataRef,
      notas: notas || null,
    }

    // Set all possible fields, defaulting to 0
    const allKeys = ['ibkr_usd','savings_usd','pension_usd','cdi_brl','lci_brl',
      'fundo_sar_brl','cripto_usd','ouro_usd','im1_valor_brl','im2_valor_brl','cambio_usd_brl']
    for (const k of allKeys) {
      const v = values[k]
      row[k] = v ? parseFloat(v) : (k === 'cambio_usd_brl' ? 5.80 : 0)
    }

    const { error } = await supabase
      .from('saldos')
      .upsert(row, { onConflict: 'user_id,data_ref' })

    if (error) {
      setMsg(`Erro: ${error.message}`)
    } else {
      setMsg('Salvo!')
      setTimeout(onSaved, 600)
    }
    setSaving(false)
  }

  const inputStyle = {
    backgroundColor: theme.isDark ? theme.bgAlt : '#f8f9fb',
    border: `1px solid ${theme.surfaceBorder}`,
    color: theme.text,
  }

  return (
    <div className="space-y-3">
      {/* Instituição selector */}
      <div>
        <label className="block text-[11px] font-medium mb-1.5" style={{ color: theme.textMuted }}>Instituição</label>
        <div className="flex flex-wrap gap-1">
          {INSTITUICOES.map((i) => {
            const isActive = inst === i.key
            const isAi = analysis && !analysis.error && CAMPO_TO_INST[analysis.campo] === i.key
            return (
              <button
                key={i.key}
                onClick={() => setInst(i.key)}
                className="px-2 py-1 rounded text-[10px] font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? theme.accent : isAi ? theme.accentBg : 'transparent',
                  color: isActive ? theme.textInverse : isAi ? theme.accent : theme.textFaint,
                  border: `1px solid ${isActive ? theme.accent : isAi ? theme.accentBorder : theme.surfaceBorder}`,
                }}
              >
                {i.label} {isAi && !isActive && '← IA'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Data de referência */}
      <div>
        <label className="block text-[10px] font-medium mb-0.5" style={{ color: theme.textMuted }}>Mês de referência</label>
        <input
          type="month"
          value={dataRef.substring(0, 7)}
          onChange={(e) => setDataRef(`${e.target.value}-01`)}
          className="w-full px-3 py-1.5 rounded-lg text-xs"
          style={inputStyle}
        />
      </div>

      {/* Campos da instituição selecionada */}
      <div className="space-y-2">
        {selectedInst.campos.map((c) => {
          const isAiField = analysis?.campo === c.key
          return (
            <div key={c.key}>
              <label className="block text-[10px] font-medium mb-0.5" style={{
                color: isAiField ? theme.accent : theme.textFaint
              }}>
                {c.label} {c.moeda && `(${c.moeda})`} {isAiField && '← IA'}
              </label>
              <input
                type="number"
                step="0.01"
                value={values[c.key] || ''}
                onChange={(e) => setValues({ ...values, [c.key]: e.target.value })}
                placeholder="0.00"
                className="w-full px-2 py-1.5 rounded text-xs tabular-nums"
                style={{
                  ...inputStyle,
                  borderColor: isAiField ? theme.accent : theme.surfaceBorder,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Notas */}
      <div>
        <label className="block text-[10px] font-medium mb-0.5" style={{ color: theme.textFaint }}>Notas</label>
        <input
          type="text"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Observações opcionais"
          className="w-full px-2 py-1.5 rounded text-xs"
          style={inputStyle}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        style={{ backgroundColor: theme.accent, color: theme.textInverse }}
      >
        {saving ? 'Salvando...' : `Salvar ${selectedInst.label}`}
      </button>

      {msg && (
        <p className="text-xs text-center" style={{ color: msg.includes('Erro') ? '#E24B4A' : '#1D9E75' }}>{msg}</p>
      )}
    </div>
  )
}
