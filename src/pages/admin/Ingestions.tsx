import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DatabaseZap,
  Loader2,
  Plus,
  RotateCw,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { getErrorMessage, getFieldErrors } from '../../lib/errors'
import {
  AREAS,
  INGESTION_SOURCES,
  INGESTION_STEPS,
  MODULES,
  MODULE_LABELS,
  type IngestionDraft,
  type IngestionJob,
  type IngestionStatus,
  type ModuleId,
} from '../../lib/types'
import { cn, formatUtc, toDateInput } from '../../lib/utils'
import { useAsyncData, useInterval } from '../../lib/useAsyncData'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineNote,
  Input,
  PageHeader,
  ProgressBar,
  Select,
  Sheet,
  Skeleton,
  useToast,
} from '../../components/ui'
import { IngestionStatusChip } from '../../components/admin/StatusChips'

type StatusFilter = IngestionStatus | 'all'

interface IngestionForm {
  source: string
  module: ModuleId
  area: string
  startDate: string
  endDate: string
  product: string
  licenseConfirmed: boolean
}

function defaultForm(): IngestionForm {
  return {
    source: INGESTION_SOURCES[0],
    module: 'wildfires',
    area: '',
    startDate: toDateInput(new Date(Date.now() - 6 * 86_400_000)),
    endDate: toDateInput(new Date()),
    product: '',
    licenseConfirmed: false,
  }
}

function stepLabel(job: IngestionJob) {
  if (job.status === 'Concluída') return '6 de 6 etapas concluídas'
  if (job.status === 'Falhou') return `Falhou na etapa ${job.currentStep + 1} de 6`
  if (job.status === 'Cancelada') return 'Tarefa cancelada'
  if (job.status === 'Em fila') return 'Em fila — ainda não iniciada'
  return `Etapa ${Math.min(job.currentStep + 1, 6)} de 6: ${INGESTION_STEPS[Math.min(job.currentStep, 5)]}`
}

function durationLabel(seconds: number | null) {
  if (seconds === null) return 'não disponível'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}m ${rest}s`
}

export function Ingestions() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [status, setStatus] = useState<StatusFilter>('all')
  const [source, setSource] = useState('all')
  const [module, setModule] = useState<ModuleId | 'all'>('all')
  const [date, setDate] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const pollBusy = useRef(false)

  const jobs = useAsyncData(
    () => api.listIngestions({ status, source, module, date: date || undefined }),
    `${status}|${source}|${module}|${date}`,
  )
  const stats = useAsyncData(api.getIngestionStats, 'ingestion-stats')

  async function silentRefresh() {
    if (document.visibilityState !== 'visible' || pollBusy.current) return
    pollBusy.current = true
    try {
      const [nextJobs, nextStats] = await Promise.all([
        api.listIngestions({ status, source, module, date: date || undefined }),
        api.getIngestionStats(),
      ])
      jobs.setData(nextJobs)
      stats.setData(nextStats)
      setLastUpdated(new Date())
    } catch {
      return
    } finally {
      pollBusy.current = false
    }
  }

  useInterval(() => {
    void silentRefresh()
  }, 5000)

  useEffect(() => {
    if (jobs.status === 'success' && !lastUpdated) setLastUpdated(new Date())
  }, [jobs.status, lastUpdated])

  async function refreshNow() {
    setRefreshing(true)
    try {
      const [nextJobs, nextStats] = await Promise.all([
        api.listIngestions({ status, source, module, date: date || undefined }),
        api.getIngestionStats(),
      ])
      jobs.setData(nextJobs)
      stats.setData(nextStats)
      setLastUpdated(new Date())
    } catch (cause: unknown) {
      toast({ title: 'Não foi possível actualizar', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setRefreshing(false)
    }
  }

  const counters: {
    key: StatusFilter
    label: string
    value: number
    icon: typeof Loader2
    tone: string
  }[] = [
    {
      key: 'Em execução',
      label: 'Em execução',
      value: stats.data?.running ?? 0,
      icon: Loader2,
      tone: 'text-accent border-accent/25 bg-accent-soft',
    },
    {
      key: 'Falhou',
      label: 'Falhadas',
      value: stats.data?.failed ?? 0,
      icon: XCircle,
      tone: 'text-danger border-danger/25 bg-danger/10',
    },
    {
      key: 'Em fila',
      label: 'Em fila',
      value: stats.data?.queued ?? 0,
      icon: Clock3,
      tone: 'text-warning border-warning/25 bg-warning/10',
    },
    {
      key: 'Concluída',
      label: 'Concluídas',
      value: stats.data?.completed ?? 0,
      icon: CheckCircle2,
      tone: 'text-success border-success/25 bg-success/10',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ADM-05"
        title="Ingestão de dados"
        description="Submeta consultas/aquisições, acompanhe a preparação geoespacial, o processamento por módulo, o controlo de qualidade e o armazenamento. Os metadados em falta não são estimados."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setSheetOpen(true)}>
            Nova ingestão
          </Button>
        }
      />

      <InlineNote tone="accent" icon={DatabaseZap}>
        O pipeline inclui consulta/aquisição na fonte, validação de metadados, preparação geoespacial,
        processamento do módulo, controlo de qualidade e armazenamento. Os dados apresentados são
        simulados; nenhum valor representa uma observação NISAR real.
      </InlineNote>

      <section aria-label="Resumo das ingestões" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {counters.map((counter) => {
          const active = status === counter.key
          return (
            <button
              key={counter.key}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(active ? 'all' : counter.key)}
              className={cn(
                'flex items-center gap-3 rounded-card border p-4 text-left transition duration-150',
                active
                  ? 'border-accent bg-accent-soft/60'
                  : 'border-line bg-card hover:border-accent/40 hover:bg-surface/30',
              )}
            >
              <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-ctrl border', counter.tone)}>
                <counter.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                {stats.status === 'loading' ? (
                  <Skeleton className="h-6 w-10" />
                ) : (
                  <span className="block font-display text-2xl font-bold leading-none">
                    {counter.value}
                  </span>
                )}
                <span className="mt-1 block text-[11px] text-muted">{counter.label}</span>
              </span>
            </button>
          )
        })}
      </section>

      <Card className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <Select
          label="Estado"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
        >
          <option value="all">Todos os estados</option>
          <option value="Em fila">Em fila</option>
          <option value="Em execução">Em execução</option>
          <option value="Concluída">Concluída</option>
          <option value="Falhou">Falhou</option>
          <option value="Cancelada">Cancelada</option>
        </Select>
        <Select label="Fonte" value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="all">Todas as fontes</option>
          {INGESTION_SOURCES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select
          label="Módulo"
          value={module}
          onChange={(event) => setModule(event.target.value as ModuleId | 'all')}
        >
          <option value="all">Todos os módulos</option>
          {MODULES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
        <Input
          label="Data de criação"
          type="date"
          value={date}
          max={toDateInput(new Date())}
          onChange={(event) => setDate(event.target.value)}
          hint="Filtro opcional pela data UTC de criação."
        />
      </Card>

      {jobs.status === 'error' ? (
        <ErrorState
          title="Não foi possível carregar as ingestões"
          description={getErrorMessage(jobs.error)}
          onRetry={jobs.reload}
        />
      ) : jobs.status === 'loading' || !jobs.data ? (
        <div className="space-y-3" aria-busy="true" aria-label="A carregar ingestões">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-card" />
          ))}
        </div>
      ) : jobs.data.length === 0 ? (
        <EmptyState
          icon={DatabaseZap}
          title="Sem tarefas de ingestão"
          description="Não existe nenhuma tarefa para os filtros actuais. Submeta uma nova ingestão ou remova os filtros."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {status !== 'all' || source !== 'all' || module !== 'all' || date ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStatus('all')
                    setSource('all')
                    setModule('all')
                    setDate('')
                  }}
                >
                  Limpar filtros
                </Button>
              ) : null}
              <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => setSheetOpen(true)}>
                Nova ingestão
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted">
              {jobs.data.length} tarefa{jobs.data.length === 1 ? '' : 's'} no filtro actual
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted/70">
              <span className="relative flex size-1.5" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
              </span>
              Actualização automática a cada 5 s
              {lastUpdated ? ` · ${lastUpdated.toLocaleTimeString('pt-PT')}` : ''}
            </p>
          </div>

          <ul className="space-y-3">
            {jobs.data.map((job) => (
              <li key={job.id}>
                <Link
                  to={`/admin/ingestao/${job.id}`}
                  className="group block rounded-card border border-line bg-card p-4 transition duration-200 hover:border-accent/50 hover:bg-surface/20 sm:p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <IngestionStatusChip status={job.status} />
                        <span className="rounded-pill border border-line px-2.5 py-1 text-[11px] text-muted">
                          {MODULE_LABELS[job.module]}
                        </span>
                        <span className="text-[11px] text-muted">{job.source}</span>
                        {job.demo ? (
                          <span className="text-[10px] uppercase tracking-wide text-muted/60">
                            demonstração
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-2.5 font-display text-lg font-semibold leading-snug">
                        {job.source} · {MODULE_LABELS[job.module]}
                      </h2>
                      <p className="mt-1 text-xs text-muted">
                        {job.area} · {job.product}
                      </p>
                      <div className="mt-3 grid gap-x-6 gap-y-1 text-[11px] text-muted/80 sm:grid-cols-2 lg:grid-cols-4">
                        <span>
                          Criada: <span className="text-ink/80">{formatUtc(job.createdAt)}</span>
                        </span>
                        <span>
                          Duração: <span className="text-ink/80">{durationLabel(job.durationSeconds)}</span>
                        </span>
                        <span>
                          Identificador: <span className="mono text-ink/80">{job.id}</span>
                        </span>
                        <span>
                          Licença:{' '}
                          <span className="text-ink/80">
                            {job.license.includes('pendente') ? 'verificação pendente' : 'verificada'}
                          </span>
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className="hidden size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent lg:block"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <ProgressBar
                        value={job.currentStep}
                        max={6}
                        tone={
                          job.status === 'Falhou'
                            ? 'danger'
                            : job.status === 'Em execução'
                              ? 'accent'
                              : job.status === 'Cancelada'
                                ? 'warning'
                                : 'accent'
                        }
                        label={`Progresso da ingestão ${job.id}: ${stepLabel(job)}`}
                      />
                    </div>
                    <p
                      className={cn(
                        'text-[11px] sm:text-right',
                        job.status === 'Falhou' || job.status === 'Cancelada'
                          ? 'text-danger'
                          : 'text-muted',
                      )}
                    >
                      {stepLabel(job)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-muted/70">
              Abra o detalhe para cancelar, repetir ou consultar metadados e logs.
            </p>
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCw className="size-3.5" />}
              loading={refreshing}
              onClick={() => void refreshNow()}
            >
              Actualizar agora
            </Button>
          </div>
        </div>
      )}

      <NewIngestionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={(job) => {
          setSheetOpen(false)
          toast({
            title: 'Ingestão submetida',
            description: `${job.id} criada em fila e registada em auditoria.`,
            variant: 'success',
          })
          navigate(`/admin/ingestao/${job.id}`)
        }}
      />
    </div>
  )
}

function NewIngestionSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (job: IngestionJob) => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState<IngestionForm>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(defaultForm())
    setErrors({})
  }, [open])

  function patch(patchValue: Partial<IngestionForm>) {
    setForm((current) => ({ ...current, ...patchValue }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    const draft: IngestionDraft = {
      source: form.source,
      module: form.module,
      area: form.area,
      startDate: form.startDate,
      endDate: form.endDate,
      product: form.product,
      licenseConfirmed: form.licenseConfirmed,
    }
    try {
      const job = await api.createIngestion(draft)
      setErrors({})
      onCreated(job)
    } catch (cause: unknown) {
      const fieldErrors = getFieldErrors(cause)
      setErrors(fieldErrors)
      toast({
        title: 'Ingestão não submetida',
        description: getErrorMessage(cause),
        variant: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        if (!busy) onClose()
      }}
      title="Nova ingestão"
      description="Submeta uma consulta/aquisição. A tarefa nasce em fila e o progresso é acompanhado no detalhe."
      width="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" form="new-ingestion-form" size="sm" loading={busy}>
            Submeter ingestão
          </Button>
        </>
      }
    >
      <form id="new-ingestion-form" className="space-y-5" onSubmit={(event) => void submit(event)}>
        <InlineNote tone="muted" icon={AlertCircle}>
          A fonte escolhida tem requisitos próprios de autenticação, licença e cobertura. O sistema não
          contorna limitações de acesso. Metadados não fornecidos ficam como “não disponível” e nunca
          são estimados.
        </InlineNote>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Fonte"
            required
            value={form.source}
            onChange={(event) => patch({ source: event.target.value })}
            error={errors.source}
          >
            {INGESTION_SOURCES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select
            label="Módulo"
            required
            value={form.module}
            onChange={(event) => patch({ module: event.target.value as ModuleId })}
            error={errors.module}
          >
            {MODULES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({item.labelPt})
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Área ou região"
          required
          list="ingestion-areas"
          placeholder="Ex.: Serra da Estrela"
          value={form.area}
          onChange={(event) => patch({ area: event.target.value })}
          error={errors.area}
          hint="Indique a área existente ou a designação geográfica a consultar."
        />
        <datalist id="ingestion-areas">
          {AREAS.map((area) => (
            <option key={area} value={area} />
          ))}
        </datalist>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Início do período"
            type="date"
            required
            value={form.startDate}
            max={form.endDate || undefined}
            onChange={(event) => patch({ startDate: event.target.value })}
            error={errors.period}
          />
          <Input
            label="Fim do período"
            type="date"
            required
            value={form.endDate}
            min={form.startDate || undefined}
            onChange={(event) => patch({ endDate: event.target.value })}
          />
        </div>

        <Input
          label="Produto (opcional)"
          placeholder="Ex.: NISAR GCOV (banda L)"
          value={form.product}
          onChange={(event) => patch({ product: event.target.value })}
          hint="Se ficar vazio, o produto é apresentado como “não disponível”; não é inferido."
        />

        {form.module === 'ground' ? (
          <InlineNote tone="warning">
            Ground Movement: resultados quantitativos exigem um produto InSAR validado, aquisições
            compatíveis e método documentado. Sem estes requisitos, não serão apresentados
            deslocamentos quantitativos.
          </InlineNote>
        ) : null}

        <div className="rounded-ctrl border border-line bg-surface/35 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.licenseConfirmed}
              onChange={(event) => patch({ licenseConfirmed: event.target.checked })}
              className="mt-0.5 size-4 shrink-0 accent-accent"
              aria-invalid={errors.licenseConfirmed ? true : undefined}
            />
            <span className="text-sm leading-relaxed text-ink">
              Confirmo que verifiquei a licença e as condições de acesso da fonte, incluindo a
              utilização dos dados neste sistema.
            </span>
          </label>
          {errors.licenseConfirmed ? (
            <p className="mt-2 text-xs text-danger">{errors.licenseConfirmed}</p>
          ) : (
            <p className="mt-2 pl-7 text-[11px] leading-relaxed text-muted">
              A confirmação fica registada na tarefa e em auditoria. A licença não é inferida nem
              verificada automaticamente.
            </p>
          )}
        </div>

        <div className="rounded-ctrl border border-line bg-surface/35 p-4 text-xs leading-relaxed text-muted">
          <p className="font-medium text-ink">O que acontece a seguir</p>
          <ol className="mt-2 space-y-1.5">
            {INGESTION_STEPS.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="mono text-muted/60">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </form>
    </Sheet>
  )
}
