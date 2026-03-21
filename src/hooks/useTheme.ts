import { useMemo } from 'react'
import type { Plano } from '../types/database'

export interface Theme {
  // Plano accent
  accent: string
  accentHover: string
  accentBg: string
  accentBorder: string
  accentMuted: string
  // Surfaces (dark/light aware)
  bg: string
  bgAlt: string
  surface: string
  surfaceBorder: string
  surfaceHover: string
  // Text
  text: string
  textMuted: string
  textFaint: string
  textInverse: string
  // Chart grid
  gridStroke: string
  // Mode
  isDark: boolean
}

const PLAN_ACCENTS: Record<Plano, { h: number; name: string }> = {
  sprint:          { h: 0,   name: 'red' },     // #E24B4A
  terceira_margem: { h: 155, name: 'green' },   // #1D9E75
  master:          { h: 215, name: 'blue' },     // #185FA5
}

export function useTheme(plano: Plano): Theme {
  const prefersDark = useMemo(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }, [])

  return useMemo(() => {
    const { h } = PLAN_ACCENTS[plano]
    const isDark = prefersDark

    if (isDark) {
      return {
        accent: `hsl(${h}, 65%, 50%)`,
        accentHover: `hsl(${h}, 65%, 60%)`,
        accentBg: `hsla(${h}, 65%, 50%, 0.15)`,
        accentBorder: `hsla(${h}, 65%, 50%, 0.4)`,
        accentMuted: `hsl(${h}, 30%, 40%)`,
        bg: '#0a0a0f',
        bgAlt: '#0f1117',
        surface: '#161822',
        surfaceBorder: '#1e2133',
        surfaceHover: '#1c1f2e',
        text: '#e2e8f0',
        textMuted: '#94a3b8',
        textFaint: '#475569',
        textInverse: '#0a0a0f',
        gridStroke: '#1e2133',
        isDark: true,
      }
    }

    return {
      accent: `hsl(${h}, 65%, 42%)`,
      accentHover: `hsl(${h}, 65%, 35%)`,
      accentBg: `hsla(${h}, 65%, 42%, 0.08)`,
      accentBorder: `hsla(${h}, 65%, 42%, 0.25)`,
      accentMuted: `hsl(${h}, 20%, 60%)`,
      bg: '#f8f9fb',
      bgAlt: '#ffffff',
      surface: '#ffffff',
      surfaceBorder: '#e2e8f0',
      surfaceHover: '#f1f5f9',
      text: '#1e293b',
      textMuted: '#64748b',
      textFaint: '#94a3b8',
      textInverse: '#ffffff',
      gridStroke: '#e2e8f0',
      isDark: false,
    }
  }, [plano, prefersDark])
}
