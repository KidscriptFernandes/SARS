import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Circle,
  Copy,
  DatabaseZap,
  FileCheck2,
  FileText,
  HardDrive,
  Loader2,
  RotateCw,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import {
  INGESTION_STEPS,
  MODULE_LABELS,
  type IngestionJob,
  type StepState,
} from '../../lib/types'
import { cn, formatUtc } from '../../lib/utils'
import { useAsyncData, useInterval } from '../../lib/useAsyncData'
import {
  Button,
  Card,
  Chip,
  ConfirmDialog,
  ErrorState,
  IconButton,
  InlineNote,
  PageHeader,
  ProgressBar,
  Skeleton,
  useToast,
} from '../../components/ui'
import { IngestionStatusChip } from '../../components/admin/StatusChips'

type PendingAction = 'cancelar' | 'repetir' | null

function durationLabel(seconds: number | null) {
  if (seconds === null) return 'não disponível'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}m ${rest}s`
}

function displayMetaDate(value: string) {
  return value === 'não disponível' ? value : formatUtc(value)
}

function stepCopy(job: IngestionJob) {
  if (job.status === 'Concluída') return '6 de 6 etapas concluídas'
  if (job.status === 'Falhou') return `Interrompida na etapa ${job.currentStep + 1} de 6`
  if (job.status === 'Cancelada') return 'Tarefa cancelada'
  if (job.status === 'Em fila') return 'Em fila — ainda não iniciada'
  return `Etapa ${Math.min(job.currentStep + 1, 6)} de 6: ${INGESTION_STEPS[Math.min(job.currentStep, 5)]}`
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') return <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
  if (state === 'running') return <Loader2 className="size-4 animate-spin text-accent" aria-hidden="true" />
  if (state === 'failed') return <XCircle className="size-4 text-danger" aria-hidden="true" />
  return <Circle className="size-4 text-muted/50" aria-hidden="true" />
}

export function IngestionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const jobState = useAsyncData(() => api.getIngestion(id ?? ''), id ?? '')
  const job = jobState.data
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const pollBusy = useRef(false)

  const active = Boolean(job && (job.status === 'Em fila' || job.status === 'Em execução'))

  async function silentRefresh() {
    if (!jobState.data || document.visibilityState !== 'visible' || pollBusy.current) return
    pollBusy.current = true
    try {
      const next = await api.getIngestion(jobState.data.id)
      jobState.setData(next)
    } catch {
      return
    } finally {
      pollBusy.current = false
    }
  }

  useInterval(() => {
    void silentRefresh()
  }, 5000, active)

  useEffect(() => {
    if (jobState.data) setLastUpdated(new Date())
  }, [jobState.data])

  async function refreshNow() {
    if (!job) return
    setRefreshing(true)
    try {
      const next = await api.getIngestion(job.id)
      jobState.setData(next)
    } catch (cause: unknown) {
      toast({ title: 'Não foi possível actualizar', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setRefreshing(false)
    }
  }

  async function copyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast({ title: `${label} copiado`, description: value, variant: 'success' })
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'error' })
    }
  }

  async function applyAction() {
    if (!job || !pendingAction) return
    setBusy(pendingAction)
    try {
      if (pendingAction === 'cancelar') {
        const updated = await api.cancelIngestion(job.id)
        jobState.setData(updated)
        setPendingAction(null)
        toast({
          title: 'Ingestão cancelada',
          description: 'A tarefa foi interrompida e a acção foi registada em auditoria.',
          variant: 'success',
        })
      } else {
        const copy = await api.retryIngestion(job.id)
        setPendingAction(null)
        toast({
          title: 'Nova tarefa criada',
          description: `${copy.id} foi colocada em fila. A tarefa original mantém-se inalterada.`,
          variant: 'success',
        })
        navigate(`/admin/ingestao/${copy.id}`)
      }
    } catch (cause: unknown) {
      setPendingAction(null)
      toast({ title: 'Acção não aplicada', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setBusy(null)
    }
  }

  if (jobState.status === 'error') {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="size-4" />}
          onClick={() => navigate('/admin/ingestao')}
        >
          Voltar à ingestão
        </Button>
        <ErrorState
          title="Não foi possível carregar a tarefa"
          description={getErrorMessage(jobState.error)}
          onRetry={jobState.reload}
        />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="A carregar tarefa de ingestão">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-44 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    )
  }

  const metadataItems = [
    { label: 'Aquisição (UTC)', value: displayMetaDate(job.metadata.acquisition) },
    { label: 'Órbita / direcção', value: job.metadata.orbit },
    { label: 'Polarização', value: job.metadata.polarization },
    { label: 'Resolução', value: job.metadata.resolution },
    { label: 'Geometria', value: job.metadata.geometry },
    { label: 'Produto', value: job.metadata.product },
    { label: 'Fonte', value: job.metadata.source },
    { label: 'Identificador do produto', value: job.metadata.identifier },
    { label: 'Sistema de referência (CRS)', value: job.metadata.crs },
    { label: 'Data de acesso (UTC)', value: displayMetaDate(job.metadata.accessDate) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/ingestao"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Ingestão de dados
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <IngestionStatusChip status={job.status} />
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCw className="size-3.5" />}
            loading={refreshing}
            onClick={() => void refreshNow()}
          >
            Actualizar
          </Button>
        </div>
      </div>

      <PageHeader
        eyebrow={`ADM-05 · ${job.id}`}
        title={`${job.source} · ${MODULE_LABELS[job.module]}`}
        description={`${job.area} · ${job.product}. Acompanhe a consulta/aquisição, preparação, processamento, controlo de qualidade e armazenamento.`}
        actions={<Chip tone="outline" size="sm">Dados de demonstração</Chip>}
      />

      {active ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted/70">
          <span className="relative flex size-1.5" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-50" />
            <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
          </span>
          Actualização automática a cada 5 s
          {lastUpdated ? ` · ${lastUpdated.toLocaleTimeString('pt-PT')}` : ''}
        </p>
      ) : null}

      {job.status === 'Falhou' && job.error ? (
        <InlineNote tone="danger" icon={XCircle}>
          <span className="font-semibold">Tarefa falhada.</span> {job.error} Consulte os logs e as
          etapas abaixo. A repetição cria uma nova tarefa; a original mantém-se.
        </InlineNote>
      ) : job.status === 'Cancelada' ? (
        <InlineNote tone="warning" icon={Ban}>
          <span className="font-semibold">Tarefa cancelada.</span> {job.error ?? 'Não é retomada.'}
        </InlineNote>
      ) : null}

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <DatabaseZap className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Resumo da tarefa</h2>
          </div>
          <span className="mono text-[10px] text-muted/70">{job.id}</span>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryItem label="Fonte" value={job.source} />
          <SummaryItem label="Módulo" value={MODULE_LABELS[job.module]} />
          <SummaryItem label="Área" value={job.area} />
          <SummaryItem label="Produto" value={job.product} />
          <SummaryItem label="Criada" value={formatUtc(job.createdAt)} />
          <SummaryItem label="Iniciada" value={formatUtc(job.startedAt)} />
          <SummaryItem label="Concluída" value={formatUtc(job.finishedAt)} />
          <SummaryItem label="Duração" value={durationLabel(job.durationSeconds)} />
        </dl>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Loader2
              className={cn('size-4 text-accent', job.status === 'Em execução' && 'animate-spin')}
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold">Progresso do pipeline</h2>
          </div>
          <span className="text-xs text-muted">
            {Math.min(job.currentStep, 6)} de 6 etapas
          </span>
        </div>

        <div className="mt-4">
          <ProgressBar
            value={job.currentStep}
            max={6}
            tone={
              job.status === 'Falhou'
                ? 'danger'
                : job.status === 'Cancelada'
                  ? 'warning'
                  : 'accent'
            }
            label={`Progresso da ingestão: ${stepCopy(job)}`}
          />
          <p className="mt-2 text-xs text-muted">{stepCopy(job)}</p>
        </div>

        <ol className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {INGESTION_STEPS.map((step, index) => {
            const state = job.stepStates[index] ?? 'pending'
            const current = job.status === 'Em execução' && index === job.currentStep
            return (
              <li
                key={step}
                className={cn(
                  'flex items-start gap-2.5 rounded-ctrl border px-3 py-2.5',
                  state === 'failed'
                    ? 'border-danger/40 bg-danger/5'
                    : state === 'done'
                      ? 'border-success/25 bg-success/5'
                      : current
                        ? 'border-accent/40 bg-accent-soft'
                        : 'border-line bg-surface/30',
                  state === 'pending' && 'opacity-70',
                )}
              >
                <span className="mt-0.5 shrink-0">
                  <StepIcon state={state} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wide text-muted">
                    Etapa {index + 1}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium leading-snug text-ink">
                    {step}
                  </span>
                  <span
                    className={cn(
                      'mt-1 block text-[10px]',
                      state === 'failed'
                        ? 'text-danger'
                        : state === 'done'
                          ? 'text-success'
                          : state === 'running'
                            ? 'text-accent'
                            : 'text-muted/70',
                    )}
                  >
                    {state === 'done'
                      ? 'Concluída'
                      : state === 'running'
                        ? 'Em execução'
                        : state === 'failed'
                          ? 'Falhou'
                          : 'Pendente'}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <DatabaseZap className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Metadados da observação</h2>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Campos em falta são apresentados como “não disponível” e não são estimados nem
              inferidos.
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {metadataItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-ctrl border border-line bg-surface/40 px-3.5 py-2.5"
                >
                  <dt className="text-[10px] uppercase tracking-wide text-muted">{item.label}</dt>
                  <dd
                    className={cn(
                      'mt-1 break-words text-sm',
                      item.value === 'não disponível' ? 'italic text-muted' : 'text-ink',
                    )}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <FileCheck2 className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Controlo de qualidade e limitações</h2>
            </div>
            {job.qa ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-ctrl border border-success/25 bg-success/5 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-success">Resultado</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink">{job.qa.result}</p>
                </div>
                <div className="rounded-ctrl border border-warning/30 bg-warning/5 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-warning">
                    <TriangleAlert className="size-3" aria-hidden="true" />
                    Limitações
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink">{job.qa.limitations}</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-ctrl border border-dashed border-line bg-surface/30 px-4 py-6 text-center">
                <p className="text-sm text-muted">Ainda não disponível</p>
                <p className="mt-1 text-[11px] text-muted/70">
                  O controlo de qualidade e as limitações só são apresentados depois de concluída a
                  etapa correspondente.
                </p>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Licença e condições de acesso</h2>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex flex-col gap-1 border-b border-line pb-2">
                <dt className="text-[10px] uppercase tracking-wide text-muted">Licença</dt>
                <dd className="text-ink">{job.license}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-[10px] uppercase tracking-wide text-muted">Data de acesso</dt>
                <dd className="text-ink">{displayMetaDate(job.accessDate)}</dd>
              </div>
            </dl>
            <InlineNote tone="muted" className="mt-3">
              A licença e as condições de acesso são verificadas antes da submissão. O sistema não
              contorna autenticação nem limitações de utilização da fonte.
            </InlineNote>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <h2 className="text-sm font-semibold">Acções</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {job.status === 'Em fila' || job.status === 'Em execução'
                ? 'A tarefa pode ser cancelada. O cancelamento interrompe o pipeline e fica registado em auditoria.'
                : job.status === 'Falhou'
                  ? 'A repetição cria uma nova tarefa em fila com os mesmos parâmetros. A tarefa falhada e os seus logs mantêm-se.'
                  : 'Não existem acções disponíveis para o estado actual.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.status === 'Em fila' || job.status === 'Em execução' ? (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Ban className="size-3.5" />}
                  onClick={() => setPendingAction('cancelar')}
                >
                  Cancelar ingestão
                </Button>
              ) : null}
              {job.status === 'Falhou' ? (
                <Button
                  size="sm"
                  icon={<RotateCw className="size-3.5" />}
                  onClick={() => setPendingAction('repetir')}
                >
                  Repetir ingestão
                </Button>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCw className="size-3.5" />}
                onClick={() => void refreshNow()}
                loading={refreshing}
              >
                Actualizar estado
              </Button>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <HardDrive className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Armazenamento</h2>
            </div>
            {job.storage ? (
              <div className="mt-4 space-y-3">
                <StorageRef
                  label="Raster processado"
                  value={job.storage.raster}
                  onCopy={() => void copyValue(job.storage?.raster ?? '', 'Caminho do raster')}
                />
                <StorageRef
                  label="Metadados / resultados"
                  value={job.storage.metadata}
                  onCopy={() => void copyValue(job.storage?.metadata ?? '', 'Caminho dos metadados')}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Ainda não disponível. Os resultados só são armazenados após o processamento e o
                controlo de qualidade.
              </p>
            )}
            <InlineNote tone="muted" className="mt-3">
              Referências simuladas de demonstração. Não indicam localizações reais de dados NISAR.
            </InlineNote>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Logs técnicos</h2>
            </div>
            {job.logs.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Sem logs registados.</p>
            ) : (
              <ol className="scroll-area mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {job.logs.map((log, index) => (
                  <li
                    key={`${log.ts}-${index}`}
                    className="rounded-ctrl border border-line bg-surface/35 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={cn(
                          'rounded-pill px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                          log.level === 'error'
                            ? 'bg-danger/10 text-danger'
                            : log.level === 'warn'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-accent-soft text-accent',
                        )}
                      >
                        {log.level}
                      </span>
                      <span className="mono text-[9px] text-muted/70">{formatUtc(log.ts)}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink/85">{log.message}</p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={() => void applyAction()}
        title={pendingAction === 'cancelar' ? 'Cancelar ingestão' : 'Repetir ingestão'}
        description={
          pendingAction === 'cancelar'
            ? 'O pipeline é interrompido e a tarefa passa a Cancelada. Esta acção fica registada em auditoria e não pode ser revertida.'
            : 'É criada uma nova tarefa em fila com os mesmos parâmetros. A tarefa falhada original mantém-se inalterada para consulta.'
        }
        confirmLabel={pendingAction === 'cancelar' ? 'Cancelar tarefa' : 'Criar nova tarefa'}
        tone={pendingAction === 'cancelar' ? 'danger' : 'primary'}
        busy={busy !== null}
        details={
          pendingAction === 'cancelar'
            ? [
                { label: 'Estado', before: job.status, after: 'Cancelada' },
                { label: 'Etapa actual', before: stepCopy(job), after: 'Interrompida' },
              ]
            : [
                { label: 'Tarefa original', before: job.id, after: 'Mantém-se Falhou' },
                { label: 'Nova tarefa', before: null, after: 'Em fila' },
              ]
        }
      >
        {pendingAction === 'repetir' ? (
          <InlineNote tone="muted">
            A nova tarefa recebe um identificador próprio e volta a percorrer todas as etapas.
          </InlineNote>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-ctrl border border-line bg-surface/40 px-3.5 py-2.5">
      <dt className="text-[10px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm text-ink">{value}</dd>
    </div>
  )
}

function StorageRef({
  label,
  value,
  onCopy,
}: {
  label: string
  value: string
  onCopy: () => void
}) {
  return (
    <div className="rounded-ctrl border border-line bg-surface/40 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1 flex items-start gap-2">
        <code className="mono min-w-0 flex-1 break-all text-[11px] leading-relaxed text-ink/85">
          {value}
        </code>
        <IconButton label={`Copiar ${label.toLowerCase()}`} icon={Copy} size="sm" onClick={onCopy} />
      </div>
    </div>
  )
}
