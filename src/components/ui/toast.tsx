import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<number[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'success' }: ToastOptions) => {
      counter.current += 1
      const id = counter.current
      setToasts((current) => [...current.slice(-3), { id, title, description, variant }])
      const timer = window.setTimeout(() => dismiss(id), 4_500)
      timers.current.push(timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const active = timers.current
    return () => {
      for (const timer of active) window.clearTimeout(timer)
    }
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
  }
  const tones = {
    success: 'border-success/40 text-success',
    error: 'border-danger/40 text-danger',
    info: 'border-accent/40 text-accent',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-24 right-4 z-[80] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2 sm:bottom-6"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const Icon = icons[item.variant]
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className={`pointer-events-auto flex items-start gap-3 rounded-card border bg-card/95 px-4 py-3 shadow-[var(--shadow-float)] backdrop-blur ${tones[item.variant]}`}
              >
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div className="min-w-0 text-ink">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="ml-auto shrink-0 rounded px-1 text-muted transition hover:text-ink"
                  aria-label="Fechar notificação"
                >
                  ×
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider.')
  return context
}
