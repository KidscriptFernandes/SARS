import { ApiError } from './api'

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {}
  if (!error.details || typeof error.details !== 'object') return {}
  const details = error.details as { errors?: unknown }
  if (!details.errors || typeof details.errors !== 'object') return {}
  return details.errors as Record<string, string>
}

export function getCurrentRecord<T>(error: unknown): T | null {
  if (!(error instanceof ApiError)) return null
  if (!error.details || typeof error.details !== 'object') return null
  const details = error.details as { current?: unknown }
  return (details.current as T) ?? null
}

export function isConflict(error: unknown) {
  return error instanceof ApiError && error.status === 409
}
