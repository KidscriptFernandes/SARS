import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'
import { Button, IconButton } from './primitives'

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const handler = () => setMatches(media.matches)
    handler()
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [query])

  return matches
}

function useOverlay(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const timer = window.setTimeout(() => {
      panelRef.current?.focus()
    }, 30)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null)
      if (focusables.length === 0) {
        event.preventDefault()
        panelRef.current.focus()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [open])

  return panelRef
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const panelRef = useOverlay(open, onClose)
  const titleId = `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}`
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <motion.div
            className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-card border border-line bg-card shadow-[var(--shadow-card)] outline-none',
              widths[size],
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
              <div className="space-y-1">
                <h2 id={titleId} className="text-xl font-semibold">
                  {title}
                </h2>
                {description ? (
                  <p className="text-sm leading-relaxed text-muted">{description}</p>
                ) : null}
              </div>
              <IconButton label="Fechar" icon={X} size="sm" onClick={onClose} />
            </div>
            {children ? <div className="scroll-area overflow-y-auto px-6 py-5">{children}</div> : null}
            {footer ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface/30 px-6 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  width?: 'md' | 'lg'
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
}: SheetProps) {
  const panelRef = useOverlay(open, onClose)
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const titleId = `sheet-title-${title.replace(/\s+/g, '-').toLowerCase()}`
  const widths = { md: 'sm:max-w-xl', lg: 'sm:max-w-2xl' }
  const closed = isDesktop ? { x: '100%' } : { y: '100%' }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-[var(--scrim)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={closed}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={closed}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col overflow-hidden rounded-t-card border border-line bg-card shadow-[var(--shadow-card)] outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:rounded-none sm:border-y-0 sm:border-r-0',
              widths[width],
            )}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-pill bg-line sm:hidden" aria-hidden="true" />
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
              <div className="space-y-1">
                <h2 id={titleId} className="text-lg font-semibold sm:text-xl">
                  {title}
                </h2>
                {description ? (
                  <p className="text-sm leading-relaxed text-muted">{description}</p>
                ) : null}
              </div>
              <IconButton label="Fechar" icon={X} size="sm" onClick={onClose} />
            </div>
            <div className="scroll-area flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
            {footer ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface/30 px-5 py-4 sm:px-6">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export interface ConfirmDetail {
  label: string
  before: string | null
  after: string
}

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  tone?: 'primary' | 'danger'
  busy?: boolean
  details?: ConfirmDetail[]
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  tone = 'danger',
  busy = false,
  details,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger-solid' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div
          className={cn(
            'flex items-start gap-3 rounded-ctrl border px-4 py-3 text-sm leading-relaxed',
            tone === 'danger'
              ? 'border-danger/40 bg-danger/5 text-ink'
              : 'border-accent/40 bg-accent-soft text-ink',
          )}
        >
          <AlertTriangle
            className={cn('mt-0.5 size-4 shrink-0', tone === 'danger' ? 'text-danger' : 'text-accent')}
            aria-hidden="true"
          />
          <p>{description}</p>
        </div>
        {details && details.length > 0 ? (
          <dl className="divide-y divide-line overflow-hidden rounded-ctrl border border-line">
            {details.map((detail) => (
              <div key={detail.label} className="grid gap-1 bg-surface/50 px-4 py-3 text-sm">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">{detail.label}</dt>
                <dd className="flex flex-wrap items-center gap-2 text-ink">
                  {detail.before ? (
                    <>
                      <span className="text-muted line-through">{detail.before}</span>
                      <span aria-hidden="true" className="text-accent">
                        →
                      </span>
                    </>
                  ) : null}
                  <span className="font-medium">{detail.after}</span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {children}
      </div>
    </Modal>
  )
}
