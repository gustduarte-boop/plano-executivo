import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Theme } from '../hooks/useTheme'
import type { AnalysisResult } from '../lib/analyzeDocument'

interface Props {
  theme: Theme
  analysis: AnalysisResult | null
  onSaved: () => void
}

export default function CapexForm({ theme, analysis, onSaved }: Props) {
  const [imovel, setImovel] = useState<'im1' | 'im2'>('im1')
  const [descricao, setDescricao] = useState('')
  const [valorOrcado, setValorOrcado] = useState('')
  const [valorRealizado, setValorRealizado] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')
  const [dataRealizada, setDataRealizada] = useState('')
  const [status, setStatus] = useState<'planejado' | 'em_andamento' | 'concluido'>('concluido')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!analysis || analysis.error || analysis.campo !== 'capex') return
    if (analysis.valor_principal) setValorRealizado(String(analysis.valor_principal))
    if (analysis.data_ref) setDataRealizada(analysis.data_ref)
    if (analysis.observacao) setDescricao(analysis.observacao)
  }, [analysis])

  const handleSave = async () => {
    if (!descricao.trim()) { setMsg('Descrição obrigatória'); return }
    setSaving(true)
    setMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setMsg('Não autenticado'); setSaving(false); return }

    const { error } = await supabase.from('capex').insert({
      user_id: user.id,
      imovel,
      descricao: descricao.trim(),
      valor_orcado: parseFloat(valorOrcado) || 0,
      valor_realizado: valorRealizado ? parseFloat(valorRealizado) : null,
      data_prevista: dataPrevista || null,
      data_realizada: dataRealizada || null,
      status,
    })

    if (error) {
      setMsg(`Erro: ${error.message}`)
    } else {
      setMsg('CAPEX registrado!')
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
      {/* Imóvel */}
      <div className="flex gap-2">
        {(['im1', 'im2'] as const).map((v) => (
          <button key={v} onClick={() => setImovel(v)}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: imovel === v ? theme.accentBg : 'transparent',
              color: imovel === v ? theme.accent : theme.textFaint,
              border: `1px solid ${imovel === v ? theme.accentBorder : theme.surfaceBorder}`,
            }}>
            {v === 'im1' ? 'Im.1 — Vila Corumbau' : 'Im.2 — Ponta Corumbau'}
          </button>
        ))}
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-[10px] font-medium mb-0.5" style={{ color: theme.textFaint }}>Descrição *</label>
        <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Alvenaria 2º pavimento" className="w-full px-2 py-1 rounded text-xs" style={inputStyle} />
      </div>

      {/* Valores */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium mb-0.5" style={{ color: theme.textFaint }}>Valor orçado (R$)</label>
          <input type="number" step="0.01" value={valorOrcado} onChange={(e) => setValorOrcado(e.target.value)}
            placeholder="0.00" className="w-full px-2 py-1 rounded text-xs tabular-nums" style={inputStyle} />
        </div>
        <div>
          <label className="block text-[10px] font-medium mb-0.5" style={{ color: analysis?.campo === 'capex' ? theme.accent : theme.textFaint }}>
            Valor realizado (R$) {analysis?.campo === 'capex' && '← IA'}
          </label>
          <input type="number" step="0.01" value={valorRealizado} onChange={(e) => setValorRealizado(e.target.value)}
            placeholder="0.00" className="w-full px-2 py-1 rounded text-xs tabular-nums"
            style={{ ...inputStyle, borderColor: analysis?.campo === 'capex' ? theme.accent : theme.surfaceBorder }} />
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium mb-0.5" style={{ color: theme.textFaint }}>Data prevista</label>
          <input type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)}
            className="w-full px-2 py-1 rounded text-xs" style={inputStyle} />
        </div>
        <div>
          <label className="block text-[10px] font-medium mb-0.5" style={{ color: theme.textFaint }}>Data realizada</label>
          <input type="date" value={dataRealizada} onChange={(e) => setDataRealizada(e.target.value)}
            className="w-full px-2 py-1 rounded text-xs" style={inputStyle} />
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-1">
        {(['planejado', 'em_andamento', 'concluido'] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className="flex-1 py-1 rounded text-[10px] font-medium transition-colors"
            style={{
              backgroundColor: status === s ? theme.accentBg : 'transparent',
              color: status === s ? theme.accent : theme.textFaint,
              border: `1px solid ${status === s ? theme.accentBorder : theme.surfaceBorder}`,
            }}>
            {s === 'planejado' ? 'Planejado' : s === 'em_andamento' ? 'Em andamento' : 'Concluído'}
          </button>
        ))}
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        style={{ backgroundColor: theme.accent, color: theme.textInverse }}>
        {saving ? 'Salvando...' : 'Registrar CAPEX'}
      </button>

      {msg && <p className="text-xs text-center" style={{ color: msg.includes('Erro') ? '#E24B4A' : '#1D9E75' }}>{msg}</p>}
    </div>
  )
}
