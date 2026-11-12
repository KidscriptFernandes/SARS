import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'
import { cn } from '../lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-ctrl border border-line bg-card/60 text-muted transition hover:border-accent hover:text-accent',
        className,
      )}
    >
      {theme === 'dark' ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
