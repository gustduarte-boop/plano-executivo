import { useState, useRef, useEffect } from 'react'
import type { Theme } from '../../hooks/useTheme'
import type { CategoriaItem } from '../../hooks/useCapex'
import type { PrefilledEntry } from '../CapexDashboard'

interface Props {
  onSave: (entry: { valor: number; categoria: string; descricao: string; data: string }) => Promise<{ error: string | null }>
  categorias: CategoriaItem[]
  prefilled: PrefilledEntry | null
  theme: Theme
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Auto-detect category from description keywords (hardcoded fallback)
const KEYWORD_MAP: [RegExp, string][] = [
  [/pedreiro|servente|ednaldo|mestre|ajudante|diari(a|sta)|empreiteiro|pintor|encanador|eletricista/i, 'mao_de_obra'],
  [/cimento|areia|brita|ferro|vergalh|tijolo|bloco|argamassa|concreto|seixo|pedra|cal |saco/i, 'material'],
  [/fundação|fundacao|sapata|radier|estaca|viga baldrame|alicerce|escavação/i, 'fundacao'],
  [/alvenaria|parede|muro|chapisco|reboco|emboço/i, 'alvenaria'],
  [/telhado|telha|cobertura|madeiramento|caibro|ripa|cumeeira|calha|rufo/i, 'telhado'],
  [/hidr[aá]ulica|cano|tubo|pvc|esgoto|caixa d.?[aá]gua|registro|torneira|encanamento/i, 'hidraulica'],
  [/el[eé]trica|fio|cabo|disjuntor|tomada|interruptor|quadro|conduíte|conduite/i, 'eletrica'],
  [/piso|revestimento|cerâmica|ceramica|porcelanato|acabamento|pintura|tinta|verniz|massa corrida|rejunte/i, 'acabamento'],
  [/piscina|bomba piscina|filtro piscina|cloro|borda piscina/i, 'piscina'],
  [/po[çc]o|artesiano|perfura[çc]/i, 'poco_artesiano'],
  [/frete|transporte|carret|caminhão|caminhao|entrega|mudança/i, 'transporte'],
  [/projeto|arquitet|engenheiro|planta|ART|RRT|aprovação|prefeitura|licen[çc]a/i, 'projeto'],
  [/acompanhamento|acompanhar|tio|aluguel obra|sal[aá]rio obra|fiscal/i, 'acompanhamento'],
]

function detectCategoria(text: string, categorias: CategoriaItem[]): string | null {
  const lower = text.toLowerCase()

  // First check user-defined keywords from DB
  for (const cat of categorias) {
    if (cat.keywords) {
      const words = cat.keywords.split(',').map(w => w.trim()).filter(Boolean)
      for (const word of words) {
        if (lower.includes(word.toLowerCase())) return cat.key
      }
    }
  }

  // Then fallback to hardcoded map
  for (const [regex, key] of KEYWORD_MAP) {
    if (regex.test(lower)) {
      // Only match if this key exists in current categorias
      if (categorias.some(c => c.key === key)) return key
    }
  }

  return null
}

export default function CapexQuickEntry({ onSave, categorias, prefilled, theme }: Props) {
  const [data, setData] = useState(todayStr())
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState(categorias[0]?.key || 'outros')
  const [descricao, setDescricao] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const manualCat = useRef(false)
  const [autoDetected, setAutoDetected] = useState(false)

  // Pre-fill from AI analysis
  useEffect(() => {
    if (!prefilled) return
    if (prefilled.valor) setValor(prefilled.valor)
    if (prefilled.descricao) setDescricao(prefilled.descricao)
    if (prefilled.data) setData(prefilled.data)
    if (prefilled.categoria) {
      setCategoria(prefilled.categoria)
      if (prefilled.fromAi) setAutoDetected(true)
    }
  }, [prefilled])

  const handleSave = async () => {
    const v = parseFloat(valor)
    if (!v || v <= 0) { setMsg('Informe o valor'); return }
    setSaving(true)
    setMsg('')
    const result = await onSave({ valor: v, categoria, descricao: descricao.trim(), data })
    if (result.error) {
      setMsg(result.error)
    } else {
      setValor('')
      setDescricao('')
      manualCat.current = false
      setAutoDetected(false)
      setMsg('Lancado!')
      setTimeout(() => setMsg(''), 2000)
    }
    setSaving(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) handleSave()
  }

  const inputStyle = {
    backgroundColor: theme.isDark ? theme.bgAlt : '#f8f9fb',
    border: `1px solid ${theme.surfaceBorder}`,
    color: theme.text,
  }

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h3 className="text-xs font-semibold mb-3" style={{ color: theme.textMuted }}>Lançamento Rápido</h3>

      <div className="grid grid-cols-2 sm:grid-cols-[100px_120px_1fr_1fr_auto] gap-2 items-end">
        {/* Data */}
        <div>
          <label className="block text-[9px] font-medium mb-0.5" style={{ color: theme.textFaint }}>Data</label>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="w-full px-2 py-1.5 rounded text-xs"
            style={inputStyle}
          />
        </div>

        {/* Valor */}
        <div>
          <label className="block text-[9px] font-medium mb-0.5" style={{ color: theme.textFaint }}>Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={e => setValor(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0,00"
            className="w-full px-2 py-1.5 rounded text-xs tabular-nums"
            style={inputStyle}
            autoFocus
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-[9px] font-medium mb-0.5" style={{ color: autoDetected ? '#1D9E75' : theme.textFaint }}>
            Categoria {autoDetected && '(auto)'}
          </label>
          <select
            value={categoria}
            onChange={e => { setCategoria(e.target.value); manualCat.current = true; setAutoDetected(false) }}
            className="w-full px-2 py-1.5 rounded text-xs"
            style={inputStyle}
          >
            {categorias.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-[9px] font-medium mb-0.5" style={{ color: theme.textFaint }}>Descrição</label>
          <input
            type="text"
            value={descricao}
            onChange={e => {
              const val = e.target.value
              setDescricao(val)
              if (!manualCat.current) {
                const detected = detectCategoria(val, categorias)
                if (detected) { setCategoria(detected); setAutoDetected(true) }
                else setAutoDetected(false)
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ex: 50 sacos cimento"
            className="w-full px-2 py-1.5 rounded text-xs"
            style={inputStyle}
          />
        </div>

        {/* Botão */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="col-span-2 sm:col-span-1 px-4 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50"
          style={{ backgroundColor: theme.accent, color: theme.textInverse }}
        >
          {saving ? '...' : 'Lançar'}
        </button>
      </div>

      {msg && (
        <p className="text-[10px] mt-1.5" style={{ color: msg.includes('Erro') || msg.includes('Informe') ? '#E24B4A' : '#1D9E75' }}>
          {msg}
        </p>
      )}
    </div>
  )
}
