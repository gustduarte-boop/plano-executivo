import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

interface Props {
  children: ReactNode[]
  labels: string[]
  theme: Theme
}

export default function SectionCarousel({ children, labels, theme }: Props) {
  const [index, setIndex] = useState(0)
  const total = children.length

  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <div>
      {/* Nav bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {labels.map((label, i) => (
            <button
              key={label}
              onClick={() => setIndex(i)}
              className="px-2 py-0.5 rounded text-xs font-medium transition-colors"
              style={{
                backgroundColor: i === index ? theme.accentBg : 'transparent',
                color: i === index ? theme.accent : theme.textFaint,
                border: i === index ? `1px solid ${theme.accentBorder}` : '1px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            className="p-1 rounded transition-colors"
            style={{ color: theme.textMuted }}
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs tabular-nums" style={{ color: theme.textFaint }}>
            {index + 1}/{total}
          </span>
          <button
            onClick={next}
            className="p-1 rounded transition-colors"
            style={{ color: theme.textMuted }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Content with horizontal overflow */}
      <div className="overflow-x-auto">
        {children[index]}
      </div>
    </div>
  )
}
