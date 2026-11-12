import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskEmail(email: string) {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '—'
  return `${local.slice(0, 1)}***@${domain}`
}

export function maskName(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '—'
  return `${parts[0].slice(0, 1)}*** ${parts.at(-1)?.slice(0, 1) ?? ''}***`
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const localDateFormatter = new Intl.DateTimeFormat('pt-PT', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const localDateOnlyFormatter = new Intl.DateTimeFormat('pt-PT', {
  dateStyle: 'medium',
})

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return localDateFormatter.format(date)
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return localDateOnlyFormatter.format(date)
}

export function formatUtc(iso: string | null | undefined) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toISOString().slice(0, 19).replace('T', ' ')} UTC`
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('pt-PT', { maximumFractionDigits }).format(value)
}

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function makeCorrelationId(prefix = 'corr') {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${Date.now().toString(36)}${random}`
}

export function downloadFile(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export function daysBetween(from: string, to: string) {
  const start = new Date(`${from}T00:00:00Z`).getTime()
  const end = new Date(`${to}T00:00:00Z`).getTime()
  return Math.round((end - start) / 86_400_000)
}
