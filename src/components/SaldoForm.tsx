import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Theme } from '../hooks/useTheme'
import type { AnalysisResult } from '../lib/analyzeDocument'

const CAMPOS = [
  { key: 'ibkr_usd', label: 'IBKR (USD)', moeda: 'USD' },
  { key: 'savings_usd', label: 'KAUST Savings (USD)', moeda: 'USD' },
  { key: 'pension_usd', label: 'KAUST Pension (USD)', moeda: 'USD' },
  { key: 'cdi_brl', label: 'CDI / Nubank (BRL)', moeda: 'BRL' },
  { key: 'lci_brl', label: 'LCI / XP (BRL)', moeda: 'BRL' },
  { key: 'fundo_sar_brl', label: 'Fundo SAR / SABB (BRL)', moeda: 'BRL' },
  { key: 'cripto_usd', label: 'Cripto (USD)', moeda: 'USD' },
  { key: 'ouro_usd', label: 'Ouro (USD)', moeda: 'USD' },
  { key: 'im1_valor_brl', label: 'Im.1 valor (BRL)', moeda: 'BRL' },
  { key: 'im2_valor_brl', label: 'Im.2 valor (BRL)', moeda: 'BRL' },
  { key: 'cambio_usd_brl', label: 'Câmbio USD/BRL', moeda: '' },
]

interface Props {
  theme: Theme
  analysis: AnalysisResult | null
  onSaved: () => void
}

export default function SaldoForm({ theme, analysis, onSaved }: Props) {
  const now = new Date()
  const [dataRef, setDataRef] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
  const [values, setValues] = useState<Record<string, string>>({})
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Pre-fill from AI analysis
  useEffect(() => {
    if (!analysis || analysis.error) return
    const newVals = { ...values }
    if (analysis.campo && analysis.campo !== 'desconhecido' && analysis.campo !== 'capex') {
      newVals[analysis.campo] = String(analysis.valor_principal)
    }
    if (analysis.data_ref) {
      // Try to parse the date to YYYY-MM-01 format
      const d = new Date(analysis.data_ref)
      if (!isNaN(d.getTime())) {
        setDataRef(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`)
      }
    }
    if (analysis.fonte) {
      setNotas(`Via IA: ${analysis.fonte}`)
    }
    setValues(newVals)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis])

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

    for (const c of CAMPOS) {
      const v = values[c.key]
      row[c.key] = v ? parseFloat(v) : 0
    }

    const { error } = await supabase
      .from('saldos')
      .upsert(row, { onConflict: 'user_id,data_ref' })

    if (error) {
      setMsg(`Erro: ${error.message}`)
    } else {
      setMsg('Salvo com sucesso!')
      setTimeout(onSaved, 800)
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
      {/* Data de referência */}
      <div>
        <label className="block text-[11px] font-medium mb-1" style={{ color: theme.textMuted }}>Mês de referência</label>
        <input
          type="month"
          value={dataRef.substring(0, 7)}
          onChange={(e) => setDataRef(`${e.target.value}-01`)}
          className="w-full px-3 py-1.5 rounded-lg text-xs"
          style={inputStyle}
        />
      </div>

      {/* Campos de valor */}
      <div className="grid grid-cols-2 gap-2">
        {CAMPOS.map((c) => {
          const isHighlighted = analysis?.campo === c.key
          return (
            <div key={c.key}>
              <label className="block text-[10px] font-medium mb-0.5" style={{
                color: isHighlighted ? theme.accent : theme.textFaint
              }}>
                {c.label} {isHighlighted && '← IA'}
              </label>
              <input
                type="number"
                step="0.01"
                value={values[c.key] || ''}
                onChange={(e) => setValues({ ...values, [c.key]: e.target.value })}
                placeholder="0.00"
                className="w-full px-2 py-1 rounded text-xs tabular-nums"
                style={{
                  ...inputStyle,
                  borderColor: isHighlighted ? theme.accent : theme.surfaceBorder,
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
          className="w-full px-2 py-1 rounded text-xs"
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
        {saving ? 'Salvando...' : 'Salvar Saldo'}
      </button>

      {msg && (
        <p className="text-xs text-center" style={{ color: msg.includes('Erro') ? '#E24B4A' : '#1D9E75' }}>{msg}</p>
      )}
    </div>
  )
}
