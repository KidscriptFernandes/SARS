import {
  Activity,
  Bug,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Inbox,
  MessageSquare,
  RotateCw,
  ScrollText,
  Search,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import {
  MODULES,
  MODULE_LABELS,
  type AiInteraction,
  type AnalysisRun,
  type AuditEntry,
  type AuditFilters,
  type AuditResult,
  type ModuleId,
  type SystemError,
} from '../../lib/types'
import { cn, daysBetween, downloadFile, formatDate, formatUtc, toDateInput } from '../../lib/utils'
import { useAsyncData } from '../../lib/useAsyncData'
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  InlineNote,
  Input,
  PageHeader,
  Select,
  Sheet,
  Skeleton,
  useToast,
} from '../../components/ui'
import { ResultChip } from '../../components/admin/StatusChips'

type Tab = 'auditoria' | 'interacoes' | 'execucoes' | 'erros'
type ResultFilter = AuditResult | 'all'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'auditoria', label: 'Auditoria', icon: ScrollText },
  { id: 'interacoes', label: 'Interações IA', icon: MessageSquare },
  { id: 'execucoes', label: 'Execuções', icon: Activity },
  { id: 'erros', label: 'Erros', icon: Bug },
]

const TAB_IDS = TABS.map((item) => item.id)

const DEFAULT_TO = toDateInput(new Date())
const DEFAULT_FROM = toDateInput(new Date(Date.now() - 6 * 86_400_000))

type AuditFeed =
  | { kind: 'audit'; items: AuditEntry[]; total: number }
  | { kind: 'interactions'; items: AiInteraction[]; total: number }
  | { kind: 'runs'; items: AnalysisRun[]; total: number }
  | { kind: 'errors'; items: SystemError[]; total: number }

type Selected =
  | { kind: 'audit'; item: AuditEntry }
  | { kind: 'interactions'; item: AiInteraction }
  | { kind: 'runs'; item: AnalysisRun }
  | { kind: 'errors'; item: SystemError }
  | null

const EMPTY_COPY: Record<Tab, { title: string; description: string }> = {
  auditoria: {
    title: 'Sem registos de auditoria',
    description: 'Não existem acções registadas para o intervalo e filtros selecionados.',
  },
  interacoes: {
    title: 'Sem interações de IA',
    description: 'Não existem perguntas registadas para o intervalo e filtros selecionados.',
  },
  execucoes: {
    title: 'Sem execuções',
    description: 'Não existem execuções de análise para o intervalo e filtros selecionados.',
  },
  erros: {
    title: 'Sem erros registados',
    description: 'Não existem erros técnicos para o intervalo e filtros selecionados.',
  },
}

function feedFor(tab: Tab): AuditFeed {
  switch (tab) {
    case 'auditoria':
      return { kind: 'audit', items: [], total: 0 }
    case 'interacoes':
      return { kind: 'interactions', items: [], total: 0 }
    case 'execucoes':
      return { kind: 'runs', items: [], total: 0 }
    case 'erros':
      return { kind: 'errors', items: [], total: 0 }
  }
}

export function Audit() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('separador')
  const tab: Tab = TAB_IDS.includes(tabParam as Tab) ? (tabParam as Tab) : 'auditoria'

  const [from, setFrom] = useState(DEFAULT_FROM)
  const [to, setTo] = useState(DEFAULT_TO)
  const [search, setSearch] = useState('')
  const [actor, setActor] = useState(() => searchParams.get('actor') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [debouncedActor, setDebouncedActor] = useState('')
  const [result, setResult] = useState<ResultFilter>('all')
  const [module, setModule] = useState<ModuleId | 'all'>('all')
  const [selected, setSelected] = useState<Selected>(null)
  const [exporting, setExporting] = useState(false)
  const [revealing, setRevealing] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search)
      setDebouncedActor(actor)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [actor, search])

  const rangeIssue = useMemo(() => {
    if (!from || !to) return 'Indique a data inicial e a data final.'
    if (from > to) return 'A data inicial tem de ser anterior à data final.'
    if (daysBetween(from, to) > 31) {
      return 'O intervalo máximo por consulta é de 31 dias. Refine as datas.'
    }
    return null
  }, [from, to])

  const filters = useMemo<AuditFilters>(
    () => ({
      from,
      to,
      actor: debouncedActor || undefined,
      result: result === 'all' ? undefined : result,
      search: debouncedSearch || undefined,
      module: module === 'all' ? undefined : module,
    }),
    [debouncedActor, debouncedSearch, from, module, result, to],
  )

  const filterKey = `${tab}|${from}|${to}|${debouncedSearch}|${debouncedActor}|${result}|${module}`

  const feed = useAsyncData<AuditFeed>(async () => {
    if (rangeIssue) return feedFor(tab)
    switch (tab) {
      case 'auditoria': {
        const data = await api.getAudit(filters)
        return { kind: 'audit', ...data }
      }
      case 'interacoes': {
        const data = await api.getInteractions(filters)
        return { kind: 'interactions', ...data }
      }
      case 'execucoes': {
        const data = await api.getRuns(filters)
        return { kind: 'runs', ...data }
      }
      case 'erros': {
        const data = await api.getErrors(filters)
        return { kind: 'errors', ...data }
      }
      default:
        return feedFor(tab)
    }
  }, filterKey)

  const hasFilters =
    from !== DEFAULT_FROM ||
    to !== DEFAULT_TO ||
    search.trim() !== '' ||
    actor.trim() !== '' ||
    result !== 'all' ||
    module !== 'all'

  function selectTab(next: Tab) {
    const params = new URLSearchParams(searchParams)
    params.set('separador', next)
    setSearchParams(params, { replace: true })
    setSelected(null)
  }

  function clearFilters() {
    setFrom(DEFAULT_FROM)
    setTo(DEFAULT_TO)
    setSearch('')
    setActor('')
    setResult('all')
    setModule('all')
  }

  const copy = useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value)
        toast({ title: 'Copiado', description: value, variant: 'success' })
      } catch {
        toast({
          title: 'Não foi possível copiar',
          description: 'Copie manualmente o identificador apresentado.',
          variant: 'error',
        })
      }
    },
    [toast],
  )

  async function exportCsv() {
    setExporting(true)
    try {
      const file = await api.exportAuditCsv(filters)
      downloadFile(file.filename, file.content)
      feed.reload()
      toast({
        title: 'Exportação concluída',
        description: `${file.filename} — a exportação também foi registada em auditoria.`,
        variant: 'success',
      })
    } catch (cause: unknown) {
      toast({ title: 'Não foi possível exportar', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setExporting(false)
    }
  }

  async function revealQuestion(item: AiInteraction) {
    setRevealing(item.id)
    try {
      const updated = await api.revealInteractionQuestion(item.id)
      setSelected({ kind: 'interactions', item: updated })
      if (feed.data?.kind === 'interactions') {
        feed.setData({
          ...feed.data,
          items: feed.data.items.map((entry) => (entry.id === updated.id ? updated : entry)),
        })
      }
      toast({
        title: 'Pergunta revelada',
        description: 'A revelação ficou registada em auditoria.',
        variant: 'success',
      })
    } catch (cause: unknown) {
      toast({ title: 'Não foi possível revelar', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setRevealing(null)
    }
  }

  const selectedTitle =
    selected === null
      ? ''
      : {
          audit: 'Registo de auditoria',
          interactions: 'Interação de IA',
          runs: 'Execução de análise',
          errors: 'Erro do sistema',
        }[selected.kind]

  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ADM-04"
        title="Auditoria e logs"
        description="Consulte registos de auditoria, interações de IA, execuções de análise e erros técnicos. Os registos são só de leitura; exportações e revelações de perguntas são elas próprias auditadas."
        actions={
          tab === 'auditoria' ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="size-4" />}
              loading={exporting}
              disabled={Boolean(rangeIssue)}
              onClick={() => void exportCsv()}
            >
              Exportar CSV
            </Button>
          ) : undefined
        }
      />

      <div
        role="tablist"
        aria-label="Vistas de auditoria e logs"
        className="scroll-area flex gap-1 overflow-x-auto rounded-card border border-line bg-card p-1.5"
      >
        {TABS.map((item) => {
          const active = item.id === tab
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={active}
              aria-controls={`panel-${item.id}`}
              onClick={() => selectTab(item.id)}
              className={cn(
                'flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-ctrl px-3 text-[13px] font-medium transition duration-150',
                active
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:bg-surface/60 hover:text-ink',
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
              {active && feed.data ? (
                <span className="rounded-pill bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold">
                  {feed.data.total}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            Filtros
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">Intervalo máximo: 31 dias</span>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Data inicial"
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => setFrom(event.target.value)}
          />
          <Input
            label="Data final"
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => setTo(event.target.value)}
          />
          <div className="md:col-span-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <Input
                aria-label="Pesquisar nos registos"
                placeholder={
                  tab === 'auditoria'
                    ? 'Pesquisar por acção, alvo, id ou correlação…'
                    : tab === 'interacoes'
                      ? 'Pesquisar por id, contexto ou correlação…'
                      : tab === 'execucoes'
                        ? 'Pesquisar por método, id ou correlação…'
                        : 'Pesquisar por fonte, mensagem ou correlação…'
                }
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
          </div>
          {tab === 'auditoria' ? (
            <Input
              label="Actor"
              placeholder="Ex.: a***@exemplo.pt ou usr_01"
              value={actor}
              onChange={(event) => setActor(event.target.value)}
            />
          ) : null}
          {tab !== 'erros' ? (
            <Select
              label="Resultado"
              value={result}
              onChange={(event) => setResult(event.target.value as ResultFilter)}
            >
              <option value="all">Todos</option>
              <option value="success">Sucesso</option>
              <option value="error">Erro</option>
            </Select>
          ) : null}
          {tab === 'interacoes' || tab === 'execucoes' ? (
            <Select
              label="Módulo"
              value={module}
              onChange={(event) => setModule(event.target.value as ModuleId | 'all')}
            >
              <option value="all">Todos</option>
              {MODULES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          ) : null}
        </div>

        <p className="text-[11px] leading-relaxed text-muted/70">
          Datas de calendário; registos técnicos apresentados em UTC (ISO 8601). A exportação CSV usa
          a vista filtrada de auditoria.
        </p>
      </Card>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="space-y-3"
      >
        {rangeIssue ? (
          <InlineNote tone="warning">
            <span className="font-medium">Intervalo inválido.</span> {rangeIssue}
          </InlineNote>
        ) : feed.status === 'loading' ? (
          <div className="space-y-2" aria-busy="true" aria-label="A carregar registos">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-card border border-line bg-card px-4 py-4"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-80 max-w-full" />
                </div>
                <Skeleton className="hidden h-3 w-32 sm:block" />
              </div>
            ))}
          </div>
        ) : feed.status === 'error' ? (
          <ErrorState
            title={`Não foi possível carregar ${activeTab.label.toLowerCase()}`}
            description={getErrorMessage(feed.error)}
            onRetry={feed.reload}
          />
        ) : !feed.data || feed.data.total === 0 ? (
          <EmptyState
            icon={Inbox}
            title={EMPTY_COPY[tab].title}
            description={EMPTY_COPY[tab].description}
            action={
              hasFilters ? (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {feed.data.kind === 'audit' ? (
              <GroupedList items={feed.data.items}>
                {(item) => (
                  <RowButton
                    key={item.id}
                    id={item.id}
                    ts={item.ts}
                    onOpen={() => setSelected({ kind: 'audit', item })}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{item.action}</span>
                      <ResultChip result={item.result} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">{item.target}</p>
                    <p className="mt-1 text-[11px] text-muted/70">
                      {item.actorMasked} · {item.id}
                    </p>
                  </RowButton>
                )}
              </GroupedList>
            ) : feed.data.kind === 'interactions' ? (
              <GroupedList items={feed.data.items}>
                {(item) => (
                  <RowButton
                    key={item.id}
                    id={item.id}
                    ts={item.ts}
                    onOpen={() => setSelected({ kind: 'interactions', item })}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone="accent" size="sm">
                        {MODULE_LABELS[item.module]}
                      </Chip>
                      <ResultChip result={item.result} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">{item.questionMasked}</p>
                    <p className="mt-1 text-[11px] text-muted/70">
                      {item.actorMasked} · {item.contextRefs.join(' · ')}
                    </p>
                  </RowButton>
                )}
              </GroupedList>
            ) : feed.data.kind === 'runs' ? (
              <GroupedList items={feed.data.items}>
                {(item) => (
                  <RowButton
                    key={item.id}
                    id={item.id}
                    ts={item.ts}
                    onOpen={() => setSelected({ kind: 'runs', item })}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{item.method}</span>
                      <RunStateChip state={item.state} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">
                      {MODULE_LABELS[item.module]} · {item.id}
                      {item.resultRef ? ` · ${item.resultRef}` : ''}
                    </p>
                    <p className="mt-1 text-[11px] text-muted/70">
                      Duração:{' '}
                      {item.durationSeconds === null ? 'não disponível' : `${item.durationSeconds}s`}
                    </p>
                  </RowButton>
                )}
              </GroupedList>
            ) : (
              <GroupedList items={feed.data.items}>
                {(item) => (
                  <RowButton
                    key={item.id}
                    id={item.id}
                    ts={item.ts}
                    onOpen={() => setSelected({ kind: 'errors', item })}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{item.source}</span>
                      <ErrorSeverityChip severity={item.severity} />
                      <Chip tone="muted" size="sm">
                        {item.count}×
                      </Chip>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted">{item.message}</p>
                    <p className="mt-1 text-[11px] text-muted/70">{item.id}</p>
                  </RowButton>
                )}
              </GroupedList>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-muted/70">
                {feed.data.total > feed.data.items.length
                  ? `A mostrar ${feed.data.items.length} de ${feed.data.total} registos. Refine os filtros ou exporte a auditoria.`
                  : `${feed.data.total} registo${feed.data.total === 1 ? '' : 's'} no intervalo.`}
              </p>
              <Button variant="ghost" size="sm" icon={<RotateCw className="size-3.5" />} onClick={feed.reload}>
                Actualizar
              </Button>
            </div>
          </>
        )}
      </div>

      <Sheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selectedTitle}
        description={
          selected
            ? `${selected.item.id} · ${formatUtc(selected.item.ts)}`
            : undefined
        }
        width="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSelected(null)}>
              Fechar
            </Button>
            {selected ? (
              <Button
                variant="soft"
                size="sm"
                icon={<Copy className="size-3.5" />}
                onClick={() => void copy(selected.item.correlationId)}
              >
                Copiar correlação
              </Button>
            ) : null}
          </>
        }
      >
        {selected?.kind === 'audit' ? (
          <dl className="text-sm">
            <DetailRow label="Identificador">
              <span className="mono break-all">{selected.item.id}</span>
            </DetailRow>
            <DetailRow label="Data/hora">{formatUtc(selected.item.ts)}</DetailRow>
            <DetailRow label="Actor">
              {selected.item.actorMasked}{' '}
              <span className="mono text-xs text-muted">({selected.item.actorId})</span>
            </DetailRow>
            <DetailRow label="Acção">{selected.item.action}</DetailRow>
            <DetailRow label="Alvo">{selected.item.target}</DetailRow>
            <DetailRow label="Resultado">
              <ResultChip result={selected.item.result} />
            </DetailRow>
            <DetailRow label="Antes">{selected.item.before ?? '—'}</DetailRow>
            <DetailRow label="Depois">{selected.item.after ?? '—'}</DetailRow>
            <DetailRow label="Correlação">
              <span className="mono break-all text-xs">{selected.item.correlationId}</span>
            </DetailRow>
            {selected.item.payload ? (
              <DetailRow label="Payload">
                <MonoBlock>{JSON.stringify(selected.item.payload, null, 2)}</MonoBlock>
              </DetailRow>
            ) : null}
          </dl>
        ) : selected?.kind === 'interactions' ? (
          <div className="space-y-4">
            <dl className="text-sm">
              <DetailRow label="Identificador">
                <span className="mono break-all">{selected.item.id}</span>
              </DetailRow>
              <DetailRow label="Data/hora">{formatUtc(selected.item.ts)}</DetailRow>
              <DetailRow label="Utilizador">{selected.item.actorMasked}</DetailRow>
              <DetailRow label="Módulo">{MODULE_LABELS[selected.item.module]}</DetailRow>
              <DetailRow label="Modelo">
                {selected.item.model} · versão {selected.item.modelVersion}
              </DetailRow>
              <DetailRow label="Contexto">
                <span className="flex flex-wrap gap-1.5">
                  {selected.item.contextRefs.map((ref) => (
                    <Chip key={ref} tone="muted" size="sm">
                      {ref}
                    </Chip>
                  ))}
                </span>
              </DetailRow>
              <DetailRow label="Resultado">
                <ResultChip result={selected.item.result} />
              </DetailRow>
              <DetailRow label="Correlação">
                <span className="mono break-all text-xs">{selected.item.correlationId}</span>
              </DetailRow>
            </dl>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Pergunta</h3>
              {selected.item.revealed ? (
                <p className="mt-2 rounded-ctrl border border-line bg-surface/40 p-3 text-sm leading-relaxed">
                  {selected.item.question}
                </p>
              ) : (
                <div className="mt-2 space-y-2 rounded-ctrl border border-line bg-surface/40 p-3">
                  <p className="text-sm text-muted">{selected.item.questionMasked}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Eye className="size-3.5" />}
                    loading={revealing === selected.item.id}
                    onClick={() => void revealQuestion(selected.item)}
                  >
                    Revelar pergunta
                  </Button>
                  <p className="text-[11px] leading-relaxed text-muted/80">
                    A pergunta está mascarada por defeito. A revelação é registada em auditoria; o
                    conteúdo não fica persistido no registo de auditoria.
                  </p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Resposta</h3>
              <p className="mt-2 rounded-ctrl border border-line bg-surface/40 p-3 text-sm leading-relaxed">
                {selected.item.response}
              </p>
            </div>
          </div>
        ) : selected?.kind === 'runs' ? (
          <dl className="text-sm">
            <DetailRow label="Identificador">
              <span className="mono break-all">{selected.item.id}</span>
            </DetailRow>
            <DetailRow label="Data/hora">{formatUtc(selected.item.ts)}</DetailRow>
            <DetailRow label="Módulo">{MODULE_LABELS[selected.item.module]}</DetailRow>
            <DetailRow label="Método">{selected.item.method}</DetailRow>
            <DetailRow label="Versão do método">{selected.item.version}</DetailRow>
            <DetailRow label="Estado">
              <RunStateChip state={selected.item.state} />
            </DetailRow>
            <DetailRow label="Duração">
              {selected.item.durationSeconds === null
                ? 'não disponível'
                : `${selected.item.durationSeconds}s`}
            </DetailRow>
            <DetailRow label="Resultado">
              {selected.item.resultRef ? (
                <span className="mono break-all text-xs">{selected.item.resultRef}</span>
              ) : (
                'não disponível'
              )}
            </DetailRow>
            <DetailRow label="Correlação">
              <span className="mono break-all text-xs">{selected.item.correlationId}</span>
            </DetailRow>
            <DetailRow label="Parâmetros">
              <MonoBlock>{JSON.stringify(selected.item.parameters, null, 2)}</MonoBlock>
            </DetailRow>
            <DetailRow label="Logs">
              <ul className="space-y-1.5 text-xs leading-relaxed text-muted">
                {selected.item.logs.map((log, index) => (
                  <li key={index} className="flex gap-2">
                    <span aria-hidden="true">·</span>
                    <span>{log}</span>
                  </li>
                ))}
              </ul>
            </DetailRow>
          </dl>
        ) : selected?.kind === 'errors' ? (
          <dl className="text-sm">
            <DetailRow label="Identificador">
              <span className="mono break-all">{selected.item.id}</span>
            </DetailRow>
            <DetailRow label="Data/hora">{formatUtc(selected.item.ts)}</DetailRow>
            <DetailRow label="Fonte">{selected.item.source}</DetailRow>
            <DetailRow label="Severidade">
              <ErrorSeverityChip severity={selected.item.severity} />
            </DetailRow>
            <DetailRow label="Ocorrências">{selected.item.count}</DetailRow>
            <DetailRow label="Mensagem">{selected.item.message}</DetailRow>
            <DetailRow label="Correlação">
              <span className="mono break-all text-xs">{selected.item.correlationId}</span>
            </DetailRow>
            {selected.item.stack ? (
              <DetailRow label="Detalhe técnico">
                <MonoBlock>{selected.item.stack}</MonoBlock>
              </DetailRow>
            ) : null}
          </dl>
        ) : null}
      </Sheet>
    </div>
  )
}

function GroupedList<T extends { ts: string }>({
  items,
  children,
}: {
  items: T[]
  children: (item: T) => ReactNode
}) {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = item.ts.slice(0, 10)
    const group = groups.get(key)
    if (group) {
      group.push(item)
    } else {
      groups.set(key, [item])
    }
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([key, group]) => (
        <section key={key} aria-label={formatDate(group[0].ts)} className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {formatDate(group[0].ts)}
            </h2>
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
            <span className="text-[10px] text-muted/60">{group.length}</span>
          </div>
          <div className="space-y-2">{group.map((item) => children(item))}</div>
        </section>
      ))}
    </div>
  )
}

function RowButton({
  id,
  ts,
  onOpen,
  children,
}: {
  id: string
  ts: string
  onOpen: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Abrir detalhe de ${id}`}
      className="group flex w-full items-start gap-3 rounded-card border border-line bg-card px-4 py-3.5 text-left transition duration-150 hover:border-accent/50 hover:bg-surface/30"
    >
      <span className="min-w-0 flex-1">{children}</span>
      <span className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
        <time dateTime={ts} className="text-[10px] text-muted">
          {formatUtc(ts)}
        </time>
        <ChevronRight
          className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
          aria-hidden="true"
        />
      </span>
    </button>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-2.5 last:border-b-0 sm:grid-cols-[170px_1fr] sm:gap-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink/90">{children}</dd>
    </div>
  )
}

function MonoBlock({ children }: { children: ReactNode }) {
  return (
    <pre className="scroll-area max-h-56 overflow-auto rounded-ctrl border border-line bg-bg/60 p-3 text-[11px] leading-relaxed text-muted">
      {children}
    </pre>
  )
}

function RunStateChip({ state }: { state: AnalysisRun['state'] }) {
  const tone = state === 'Concluída' ? 'success' : state === 'Falhou' ? 'danger' : 'accent'
  return (
    <Chip tone={tone} size="sm">
      {state}
    </Chip>
  )
}

function ErrorSeverityChip({ severity }: { severity: SystemError['severity'] }) {
  return (
    <Chip tone={severity === 'Crítico' ? 'danger' : 'warning'} size="sm">
      {severity}
    </Chip>
  )
}
