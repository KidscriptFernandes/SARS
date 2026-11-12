import { motion } from 'framer-motion'
import {
  ChevronRight,
  RotateCw,
  Search,
  SlidersHorizontal,
  UsersRound,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import type { Role, UserRecord } from '../../lib/types'
import { cn, formatDateTime, maskEmail } from '../../lib/utils'
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Skeleton,
} from '../../components/ui'
import { RoleChip, UserStatusChip } from '../../components/admin/StatusChips'

type RoleFilter = 'all' | Role
type StatusFilter = 'all' | 'Activo' | 'Suspenso'

const ease = [0.22, 1, 0.36, 1] as const

export function Users() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [items, setItems] = useState<UserRecord[]>([])
  const [total, setTotal] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const generation = useRef(0)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const current = generation.current + 1
    generation.current = current
    setLoading(true)
    setError(null)
    setItems([])
    setNextCursor(null)
    api
      .listUsers({ search: debouncedSearch, role, status })
      .then((result) => {
        if (generation.current !== current) return
        setItems(result.items)
        setNextCursor(result.nextCursor)
        setTotal(result.total)
      })
      .catch((cause: unknown) => {
        if (generation.current !== current) return
        setError(cause)
      })
      .finally(() => {
        if (generation.current === current) setLoading(false)
      })
  }, [debouncedSearch, role, status, reloadKey])

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore || loading || error) return
    const current = generation.current
    setLoadingMore(true)
    try {
      const result = await api.listUsers({
        search: debouncedSearch,
        role,
        status,
        cursor: nextCursor,
      })
      if (generation.current !== current) return
      setItems((previous) => [...previous, ...result.items])
      setNextCursor(result.nextCursor)
      setTotal(result.total)
    } catch (cause: unknown) {
      if (generation.current === current) setError(cause)
    } finally {
      if (generation.current === current) setLoadingMore(false)
    }
  }, [debouncedSearch, error, loading, loadingMore, nextCursor, role, status])

  useEffect(() => {
    const node = sentinel.current
    if (!node || !nextCursor || loading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore()
      },
      { rootMargin: '240px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore, nextCursor, loading])

  const hasFilters = search.trim() !== '' || role !== 'all' || status !== 'all'

  function clearFilters() {
    setSearch('')
    setRole('all')
    setStatus('all')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ADM-01"
        title="Utilizadores e permissões"
        description="Pesquise, filtre e gerencie perfis, estados e permissões. As credenciais protegidas nunca são apresentadas nem editáveis aqui."
        actions={
          <span className="inline-flex min-h-10 items-center gap-2 rounded-ctrl border border-line bg-card px-3 text-xs text-muted">
            <UsersRound className="size-4 text-accent" aria-hidden="true" />
            {loading ? 'A carregar…' : `${total} resultado${total === 1 ? '' : 's'}`}
          </span>
        }
      />

      <section aria-label="Filtros de utilizadores" className="space-y-4 rounded-card border border-line bg-card p-4 sm:p-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            aria-label="Pesquisar utilizadores por nome, e-mail ou identificador"
            placeholder="Pesquisar por nome, e-mail ou identificador…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10 pr-10"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpar pesquisa"
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded text-muted transition hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
                <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                Perfil
              </span>
              {(
                [
                  ['all', 'Todos'],
                  ['Utilizador', 'Utilizador'],
                  ['Administrador', 'Administrador'],
                ] as const
              ).map(([value, label]) => (
                <FilterChip
                  key={value}
                  active={role === value}
                  onClick={() => setRole(value)}
                >
                  {label}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[11px] uppercase tracking-wide text-muted">Estado</span>
              {(
                [
                  ['all', 'Todos'],
                  ['Activo', 'Activo'],
                  ['Suspenso', 'Suspenso'],
                ] as const
              ).map(([value, label]) => (
                <FilterChip
                  key={value}
                  active={status === value}
                  onClick={() => setStatus(value)}
                >
                  {label}
                </FilterChip>
              ))}
            </div>
          </div>
          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          ) : null}
        </div>
      </section>

      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="A carregar utilizadores">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 rounded-card border border-line bg-card p-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="hidden h-6 w-24 sm:block" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Não foi possível carregar os utilizadores"
          description={getErrorMessage(error)}
          onRetry={() => setReloadKey((value) => value + 1)}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Nenhum utilizador corresponde aos filtros"
          description="Experimente outro termo de pesquisa ou remova os filtros activos."
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          <ul className="space-y-2">
            {items.map((user, index) => (
              <motion.li
                key={user.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.24,
                  delay: index < 8 ? index * 0.04 : 0,
                  ease,
                }}
              >
                <Link
                  to={`/admin/utilizadores/${user.id}`}
                  className="group flex flex-col gap-3 rounded-card border border-line bg-card p-4 transition duration-200 hover:border-accent/50 hover:bg-surface/30 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={user.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                      <p className="truncate text-xs text-muted">{maskEmail(user.email)}</p>
                      <p className="mono mt-0.5 truncate text-[10px] text-muted/70">{user.id}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:w-[320px] sm:justify-end">
                    <RoleChip role={user.role} />
                    <UserStatusChip status={user.status} />
                    <div className="w-full text-left text-[11px] text-muted sm:w-auto sm:min-w-[124px] sm:text-right">
                      <span className="block text-[9px] uppercase tracking-wide text-muted/60">
                        Último acesso
                      </span>
                      {formatDateTime(user.lastAccessAt)}
                    </div>
                    <ChevronRight
                      className="hidden size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent sm:block"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </motion.li>
            ))}
          </ul>

          <div ref={sentinel} aria-hidden="true" className="h-1" />

          {nextCursor ? (
            <div className="flex justify-center pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void loadMore()}
                loading={loadingMore}
                icon={!loadingMore ? <RotateCw className="size-3.5" /> : undefined}
              >
                {loadingMore ? 'A carregar…' : 'Carregar mais'}
              </Button>
            </div>
          ) : (
            <p className="pt-2 text-center text-[11px] text-muted/70">
              Fim da lista · {total} resultado{total === 1 ? '' : 's'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-h-8 rounded-pill border px-3 text-xs font-medium transition duration-150',
        active
          ? 'border-accent bg-accent-soft text-accent'
          : 'border-line bg-surface/50 text-muted hover:border-line hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}
