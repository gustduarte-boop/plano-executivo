import { useRef, useState, type DragEvent } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

interface Props {
  theme: Theme
  onFile: (file: File) => void
  analyzing: boolean
}

const ACCEPT = '.jpg,.jpeg,.png,.pdf,image/*'

export default function UploadZone({ theme, onFile, analyzing }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  const handleSelect = () => {
    const file = inputRef.current?.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div
      className="rounded-lg p-6 text-center cursor-pointer transition-colors"
      style={{
        border: `2px dashed ${dragOver ? theme.accent : theme.surfaceBorder}`,
        backgroundColor: dragOver ? theme.accentBg : 'transparent',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={handleSelect} />
      {analyzing ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin" style={{ color: theme.accent }} />
          <span className="text-xs" style={{ color: theme.textMuted }}>Analisando com IA...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload size={24} style={{ color: theme.textFaint }} />
          <span className="text-xs" style={{ color: theme.textMuted }}>
            Arraste um print ou <span style={{ color: theme.accent }}>clique para selecionar</span>
          </span>
          <span className="text-[10px]" style={{ color: theme.textFaint }}>JPG, PNG, PDF — extrato, screenshot, comprovante</span>
        </div>
      )}
    </div>
  )
}
