import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import type { Theme } from '../../hooks/useTheme'
import type { CategoriaItem } from '../../hooks/useCapex'

interface ExtractedData {
  valor: number
  descricao: string
  data: string | null
  categoria_sugerida: string | null
  confianca: string
  observacao: string
}

interface Props {
  categorias: CategoriaItem[]
  onExtracted: (data: ExtractedData) => void
  theme: Theme
}

const SYSTEM_PROMPT_CAPEX = `Você é um assistente que analisa fotos de notas fiscais, recibos e comprovantes de pagamento de OBRAS DE CONSTRUÇÃO.

Extraia:
1. VALOR TOTAL pago (número, em reais)
2. DATA do pagamento ou da nota (formato YYYY-MM-DD)
3. DESCRIÇÃO curta do que foi comprado/pago (1 linha)
4. CATEGORIA SUGERIDA — escolha UMA entre:
   fundacao, alvenaria, telhado, hidraulica, eletrica, acabamento, piscina,
   poco_artesiano, mao_de_obra, material, transporte, projeto, acompanhamento, outros

Dicas para categorizar:
- Nomes de pessoas (pedreiro, servente, Ednaldo, João etc.) → mao_de_obra
- Cimento, areia, brita, ferro, tijolo, bloco, saco → material
- Frete, caminhão, entrega → transporte
- PIX para arquiteto, engenheiro, planta → projeto
- Nota de loja de construção com vários itens → material
- Se o comprovante mostra PIX/transferência para pessoa, verifique se a descrição indica o serviço

Se a imagem não for um comprovante de obra, retorne categoria "outros" e confiança "baixa".

Retorne APENAS JSON válido:
{
  "valor": 1234.56,
  "descricao": "descrição curta",
  "data": "2026-04-14",
  "categoria_sugerida": "material",
  "confianca": "alta",
  "observacao": "elementos visuais usados para identificar"
}`

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function CapexReceiptUpload({ categorias, onExtracted, theme }: Props) {
  const [analyzing, setAnalyzing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setPreview(URL.createObjectURL(file))
    setAnalyzing(true)
    setError('')

    try {
      const base64 = await fileToBase64(file)
      const isPdf = file.type === 'application/pdf'

      const content = [
        isPdf
          ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
          : { type: 'image', source: { type: 'base64', media_type: file.type || 'image/png', data: base64 } },
        { type: 'text', text: 'Analise este comprovante/nota de obra e extraia as informações.' },
      ]

      // Build dynamic category list from user's categories
      const catList = categorias.map(c => c.key).join(', ')
      const systemWithCats = SYSTEM_PROMPT_CAPEX.replace(
        /fundacao, alvenaria.*outros/,
        catList
      )

      const resp = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemWithCats,
          messages: [{ role: 'user', content }],
        }),
      })

      const rawText = await resp.text()
      let result: Record<string, unknown>
      try {
        result = JSON.parse(rawText)
      } catch {
        console.error('[CapexReceipt] Response not JSON:', rawText.substring(0, 200))
        setError(`Resposta inválida do servidor (${resp.status})`)
        setAnalyzing(false)
        return
      }

      if (!resp.ok) {
        const errMsg = (result.error as Record<string, string>)?.message || `Status ${resp.status}`
        setError(`Erro API: ${errMsg}`)
        setAnalyzing(false)
        return
      }

      const text = (result.content as Array<{ text: string }>)?.[0]?.text || ''
      console.log('[CapexReceipt] AI response:', text.substring(0, 300))
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ExtractedData
        onExtracted(parsed)
      } else {
        setError('Não consegui extrair dados da imagem')
      }
    } catch (e) {
      setError(`Erro: ${e}`)
    }
    setAnalyzing(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleSelect = () => {
    const file = inputRef.current?.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.surfaceBorder}` }}>
      <h3 className="text-xs font-semibold mb-2" style={{ color: theme.textMuted }}>
        Upload Nota / Comprovante
      </h3>

      <div className="flex gap-3 items-start">
        {/* Upload area */}
        <div
          className="flex-1 rounded-lg p-4 text-center cursor-pointer transition-colors"
          style={{ border: `2px dashed ${theme.surfaceBorder}` }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,image/*" className="hidden" onChange={handleSelect} />
          {analyzing ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 size={20} className="animate-spin" style={{ color: theme.accent }} />
              <span className="text-[10px]" style={{ color: theme.textMuted }}>Analisando nota...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Camera size={20} style={{ color: theme.textFaint }} />
              <span className="text-[10px]" style={{ color: theme.textMuted }}>
                Foto da nota ou <span style={{ color: theme.accent }}>clique</span>
              </span>
            </div>
          )}
        </div>

        {/* Preview */}
        {preview && (
          <img
            src={preview}
            alt="Nota"
            className="rounded-lg h-20 w-20 object-cover flex-none"
            style={{ border: `1px solid ${theme.surfaceBorder}` }}
          />
        )}
      </div>

      {error && (
        <p className="text-[10px] mt-2" style={{ color: '#EF9F27' }}>{error}</p>
      )}
    </div>
  )
}
