import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Loader2,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import {
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid' | 'soft'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)] active:translate-y-0 active:scale-[0.98]',
  secondary:
    'border border-line bg-transparent text-ink hover:border-accent hover:bg-accent-soft active:scale-[0.98]',
  ghost: 'bg-transparent text-muted hover:bg-surface hover:text-ink',
  danger:
    'border border-danger/60 bg-transparent text-danger hover:border-danger hover:bg-danger/10 active:scale-[0.98]',
  'danger-solid': 'bg-danger text-[#26070c] hover:brightness-110 active:scale-[0.98]',
  soft: 'bg-accent-soft text-accent hover:bg-accent/20 active:scale-[0.98]',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-[13px] gap-1.5',
  md: 'min-h-12 px-6 text-[15px] gap-2',
  lg: 'min-h-12 px-7 text-base gap-2',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center rounded-ctrl font-semibold transition duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon: LucideIcon
  size?: 'sm' | 'md'
}

export function IconButton({
  label,
  icon: Icon,
  size = 'md',
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-ctrl text-muted transition duration-150 hover:bg-surface hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        size === 'sm' ? 'size-9' : 'size-11',
        className,
      )}
      {...props}
    >
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} aria-hidden="true" />
    </button>
  )
}

type ChipTone = 'accent' | 'success' | 'warning' | 'danger' | 'muted' | 'outline'

const chipTones: Record<ChipTone, string> = {
  accent: 'bg-accent-soft text-accent border-accent/30',
  success: 'bg-success/10 text-success border-success/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  muted: 'bg-surface/70 text-muted border-line',
  outline: 'bg-transparent text-muted border-line',
}

export function Chip({
  tone = 'accent',
  icon: Icon,
  children,
  className,
  size = 'md',
}: {
  tone?: ChipTone
  icon?: LucideIcon
  children: ReactNode
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-pill border font-medium leading-none',
        size === 'sm' ? 'min-h-6 px-2.5 text-[11px]' : 'min-h-8 px-3 text-[13px]',
        chipTones[tone],
        className,
      )}
    >
      {Icon ? <Icon className={size === 'sm' ? 'size-3' : 'size-3.5'} aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section' | 'li'
}) {
  return (
    <Tag className={cn('surface-card', className)}>{children}</Tag>
  )
}

interface FieldShellProps {
  label?: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

function FieldShell({ label, htmlFor, hint, error, required, children, className }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
          {label}
          {required ? (
            <span className="ml-1 text-accent" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="flex items-start gap-1.5 text-xs text-danger">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, id, required, ...props }: InputProps) {
  const generated = useId()
  const inputId = id ?? generated
  const describedBy = [
    hint && !error ? `${inputId}-hint` : null,
    error ? `${inputId}-error` : null,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <FieldShell
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      required={required}
    >
      <input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn('field-base', className)}
        {...props}
      />
    </FieldShell>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

export function Select({
  label,
  hint,
  error,
  className,
  id,
  required,
  children,
  ...props
}: SelectProps) {
  const generated = useId()
  const selectId = id ?? generated
  const describedBy = [
    hint && !error ? `${selectId}-hint` : null,
    error ? `${selectId}-error` : null,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <FieldShell
      label={label}
      htmlFor={selectId}
      hint={hint}
      error={error}
      required={required}
    >
      <select
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn('field-base appearance-auto', className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function TextArea({
  label,
  hint,
  error,
  className,
  id,
  required,
  ...props
}: TextAreaProps) {
  const generated = useId()
  const textareaId = id ?? generated
  const describedBy = [
    hint && !error ? `${textareaId}-hint` : null,
    error ? `${textareaId}-error` : null,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <FieldShell
      label={label}
      htmlFor={textareaId}
      hint={hint}
      error={error}
      required={required}
    >
      <textarea
        id={textareaId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={cn('field-base min-h-28 resize-y py-3 leading-relaxed', className)}
        {...props}
      />
    </FieldShell>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-pill border transition duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50',
        checked ? 'border-accent bg-accent' : 'border-line bg-surface',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute top-0.5 size-5 rounded-full bg-ink shadow-sm transition-transform duration-200 ease-out',
          checked ? 'translate-x-[22px] bg-on-accent' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn('size-5 animate-spin text-accent', className)}
      role="status"
      aria-label="A carregar"
    />
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} aria-hidden="true" />
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'accent',
  label,
}: {
  value: number
  max?: number
  tone?: 'accent' | 'warning' | 'danger'
  label: string
}) {
  const [ready, setReady] = useState(false)
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 30)
    return () => clearTimeout(timer)
  }, [])

  const colors = {
    accent: 'bg-accent',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-pill bg-surface"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
    >
      <div
        className={cn('h-full origin-left rounded-pill transition-transform duration-700 ease-out', colors[tone])}
        style={{ transform: `scaleX(${ready ? ratio : 0})` }}
      />
    </div>
  )
}

export function ProgressRing({
  value,
  max = 100,
  tone = 'accent',
  size = 132,
  label,
  children,
}: {
  value: number
  max?: number
  tone?: 'accent' | 'warning' | 'danger'
  size?: number
  label: string
  children?: ReactNode
}) {
  const [ready, setReady] = useState(false)
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeColor = {
    accent: 'var(--color-accent)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  }[tone]

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 30)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - (ready ? ratio : 0))}
          className="transition-[stroke-dashoffset,stroke] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-card px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = 'Não foi possível carregar',
  description,
  onRetry,
  compact = false,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <XCircle className="size-4" aria-hidden="true" />
          {title}
        </p>
        {onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry} className="w-fit">
            Tentar de novo
          </Button>
        ) : null}
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-danger/30 bg-danger/5 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <XCircle className="size-6" aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tentar de novo
        </Button>
      ) : null}
    </div>
  )
}

export function SuccessMark({ label = 'Concluído' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
      <CheckCircle2 className="size-4" aria-hidden="true" />
      {label}
    </span>
  )
}

export function InlineNote({
  tone = 'warning',
  icon: Icon = AlertTriangle,
  children,
  className,
}: {
  tone?: 'warning' | 'danger' | 'accent' | 'muted'
  icon?: LucideIcon
  children: ReactNode
  className?: string
}) {
  const tones = {
    warning: 'border-warning/40 bg-warning/5 text-warning',
    danger: 'border-danger/40 bg-danger/5 text-danger',
    accent: 'border-accent/40 bg-accent-soft text-accent',
    muted: 'border-line bg-surface/60 text-muted',
  }
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-ctrl border px-4 py-3 text-sm leading-relaxed',
        tones[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="text-ink/90">{children}</div>
    </div>
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const text = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  const classes = {
    sm: 'size-9 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-16 text-xl',
  }[size]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent-soft font-display font-semibold text-accent',
        classes,
      )}
      aria-hidden="true"
    >
      {text}
    </span>
  )
}

export function CheckLine({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
        <Check className="size-3.5" aria-hidden="true" />
      </span>
      <span>{children}</span>
    </li>
  )
}

export function CrossLine({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
        <X className="size-3.5" aria-hidden="true" />
      </span>
      <span>{children}</span>
    </li>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="text-[28px] font-semibold leading-tight md:text-[34px]">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted md:text-[15px]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
