import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import type { Theme } from '../hooks/useTheme'

interface Props {
  children: ReactNode[]
  labels: string[]
  theme: Theme
}

export default function SectionCarousel({ children, labels, theme }: Props) {
  const [index, setIndex] = useState(0)
  const total = children.length
  const contentRef = useRef<HTMLDivElement>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const isFirst = index === 0
  const isLast = index === total - 1

  const prev = () => { if (!isFirst) setIndex((i) => i - 1) }
  const next = () => { if (!isLast) setIndex((i) => i + 1) }

  // Check if page has scrollable content below the fold
  const checkScroll = useCallback(() => {
    const scrollable = document.documentElement.scrollHeight > window.innerHeight + 80
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40
    setCanScrollDown(scrollable && !atBottom)
  }, [])

  useEffect(() => {
    checkScroll()
    window.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll, index])

  const scrollDown = () => {
    window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      {/* Label tabs */}
      <div className="flex items-center gap-2 mb-3">
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
        <span className="text-[10px] tabular-nums ml-auto" style={{ color: theme.textFaint }}>
          {index + 1}/{total}
        </span>
      </div>

      {/* Content area with side arrows */}
      <div className="relative flex items-stretch">
        {/* Left arrow */}
        <button
          onClick={prev}
          className="flex-none flex items-center justify-center w-10 rounded-l-xl transition-all duration-200"
          style={{
            opacity: isFirst ? 0 : 1,
            pointerEvents: isFirst ? 'none' : 'auto',
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            color: theme.textMuted,
          }}
          aria-label="Anterior"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>

        {/* Chart */}
        <div ref={contentRef} className="flex-1 overflow-x-auto min-w-0">
          {children[index]}
        </div>

        {/* Right arrow */}
        <button
          onClick={next}
          className="flex-none flex items-center justify-center w-10 rounded-r-xl transition-all duration-200"
          style={{
            opacity: isLast ? 0 : 1,
            pointerEvents: isLast ? 'none' : 'auto',
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            color: theme.textMuted,
          }}
          aria-label="Próximo"
        >
          <ChevronRight size={28} strokeWidth={2.5} />
        </button>
      </div>

      {/* Scroll-down arrow */}
      {canScrollDown && (
        <button
          onClick={scrollDown}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center w-12 h-12 rounded-full transition-opacity duration-300 animate-bounce"
          style={{
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            color: theme.textMuted,
            backdropFilter: 'blur(8px)',
          }}
          aria-label="Rolar para baixo"
        >
          <ChevronDown size={32} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
