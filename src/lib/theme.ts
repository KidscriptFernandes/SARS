import { createContext, useContext } from 'react'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'dws.theme'

export type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored

  const applied = document.documentElement.dataset.theme
  if (applied === 'light' || applied === 'dark') return applied

  return 'dark'
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside ThemeProvider')
  return context
}
