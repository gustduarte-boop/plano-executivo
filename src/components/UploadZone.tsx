import { useRef, useState, type DragEvent } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

interface Props {
  theme: Theme
  onFiles: (files: File[]) => void
  analyzing: boolean
}

const ACCEPT = '.jpg,.jpeg,.png,.pdf,image/*'

export default function UploadZone({ theme, onFiles, analyzing }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }

  const handleSelect = () => {
    const files = Array.from(inputRef.current?.files || [])
    if (files.length) onFiles(files)
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
      <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={handleSelect} />
      {analyzing ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin" style={{ color: theme.accent }} />
          <span className="text-xs" style={{ color: theme.textMuted }}>Analisando com IA...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload size={24} style={{ color: theme.textFaint }} />
          <span className="text-xs" style={{ color: theme.textMuted }}>
            Arraste prints ou <span style={{ color: theme.accent }}>clique para selecionar</span>
          </span>
          <span className="text-[10px]" style={{ color: theme.textFaint }}>JPG, PNG, PDF — múltiplos arquivos permitidos</span>
        </div>
      )}
    </div>
  )
}
