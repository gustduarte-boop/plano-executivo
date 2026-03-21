import { useState } from 'react'
import { X } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'
import UploadZone from './UploadZone'
import SaldoForm from './SaldoForm'
import CapexForm from './CapexForm'
import { analyzeDocument, type AnalysisResult } from '../lib/analyzeDocument'

interface Props {
  theme: Theme
  onClose: () => void
}

export default function EntradaDados({ theme, onClose }: Props) {
  const [tab, setTab] = useState<'saldo' | 'capex'>('saldo')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setPreview(URL.createObjectURL(file))
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const result = await analyzeDocument(file)
      setAnalysis(result)
      if (result.campo === 'capex') setTab('capex')
      else setTab('saldo')
    } catch (e) {
      setAnalysis({
        fonte: 'erro', campo: 'desconhecido', valores: [], valor_principal: 0,
        moeda: 'BRL', data_ref: null, confianca: 'baixa',
        observacao: `Erro: ${e}`, error: 'exception',
      })
    }
    setAnalyzing(false)
  }

  const tabs = [
    { key: 'saldo' as const, label: 'Saldo Mensal' },
    { key: 'capex' as const, label: 'CAPEX Obra' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-2xl rounded-xl shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sticky top-0 z-10"
          style={{ backgroundColor: theme.surface, borderBottom: `1px solid ${theme.surfaceBorder}` }}>
          <h2 className="text-sm font-bold" style={{ color: theme.text }}>Entrada de Dados</h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: theme.textFaint }}><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Upload */}
          <UploadZone theme={theme} onFile={handleFile} analyzing={analyzing} />

          {/* AI Result */}
          {analysis && !analysis.error && (
            <div className="rounded-lg p-3" style={{ backgroundColor: theme.accentBg, border: `1px solid ${theme.accentBorder}` }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{
                  backgroundColor: analysis.confianca === 'alta' ? '#1D9E75' : analysis.confianca === 'media' ? '#EF9F27' : '#E24B4A'
                }} />
                <span className="text-xs font-medium" style={{ color: theme.text }}>
                  Identificado: <strong>{analysis.fonte}</strong> — confiança {analysis.confianca}
                </span>
              </div>
              {analysis.valores.map((v, i) => (
                <div key={i} className="text-[11px] flex justify-between" style={{ color: theme.textMuted }}>
                  <span>{v.descricao}</span>
                  <span className="font-medium tabular-nums">{v.moeda} {v.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
              {analysis.observacao && (
                <p className="text-[10px] mt-1 italic" style={{ color: theme.textFaint }}>{analysis.observacao}</p>
              )}
            </div>
          )}

          {analysis?.error && (
            <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: theme.isDark ? 'rgba(239,159,39,0.1)' : 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.3)', color: '#EF9F27' }}>
              {analysis.error === 'no_api_key'
                ? 'IA não disponível — preencha manualmente.'
                : `IA: ${analysis.observacao || analysis.error}`}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${theme.surfaceBorder}` }}>
              <img src={preview} alt="Preview" className="w-full max-h-48 object-contain" style={{ backgroundColor: theme.isDark ? '#000' : '#f1f5f9' }} />
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: theme.isDark ? theme.bgAlt : '#f1f5f9', border: `1px solid ${theme.surfaceBorder}` }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  backgroundColor: tab === t.key ? theme.accent : 'transparent',
                  color: tab === t.key ? theme.textInverse : theme.textMuted,
                }}>{t.label}</button>
            ))}
          </div>

          {/* Form */}
          {tab === 'saldo' ? (
            <SaldoForm theme={theme} analysis={analysis} onSaved={onClose} />
          ) : (
            <CapexForm theme={theme} analysis={analysis} onSaved={onClose} />
          )}
        </div>
      </div>
    </div>
  )
}
