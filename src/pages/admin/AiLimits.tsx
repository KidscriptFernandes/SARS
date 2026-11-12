import {
  AlertCircle,
  KeyRound,
  LockKeyhole,
  Plus,
  Save,
  Sparkles,
  Trash2,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import { getErrorMessage, getFieldErrors, isConflict } from '../../lib/errors'
import type { AiLimits as AiLimitsType, UserRecord } from '../../lib/types'
import { formatCurrency } from '../../lib/utils'
import { useAsyncData } from '../../lib/useAsyncData'
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  InlineNote,
  Input,
  PageHeader,
  ProgressBar,
  ProgressRing,
  Select,
  Skeleton,
  useToast,
} from '../../components/ui'
import { CountUp } from '../../components/CountUp'

interface LimitsForm {
  userQuota: string
  quotaPeriod: 'dia' | 'mês'
  globalCostLimit: string
  currency: 'EUR' | 'USD'
  warningThreshold: string
  timeoutSeconds: string
  onLimit: 'bloquear' | 'avisar'
}

function formFromLimits(limits: AiLimitsType): LimitsForm {
  return {
    userQuota: String(limits.userQuota),
    quotaPeriod: limits.quotaPeriod,
    globalCostLimit: String(limits.globalCostLimit),
    currency: limits.currency,
    warningThreshold: String(limits.warningThreshold),
    timeoutSeconds: String(limits.timeoutSeconds),
    onLimit: limits.onLimit,
  }
}

export function AiLimits() {
  const { toast } = useToast()
  const usage = useAsyncData(api.getAiUsage, 'ai-usage')
  const limitsState = useAsyncData(api.getAiLimits, 'ai-limits')
  const users = useAsyncData(() => api.listUsers({ limit: 100 }), 'ai-users')
  const [form, setForm] = useState<LimitsForm | null>(null)
  const [initialForm, setInitialForm] = useState<LimitsForm | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [exceptionUser, setExceptionUser] = useState('')
  const [exceptionQuota, setExceptionQuota] = useState('')
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; userName: string; quota: number } | null>(null)

  const limits = limitsState.data

  useEffect(() => {
    if (!limits || initialForm) return
    const next = formFromLimits(limits)
    setForm(next)
    setInitialForm(next)
  }, [initialForm, limits])

  useEffect(() => {
    if (!users.data || exceptionUser) return
    const first = users.data.items[0]
    if (first) setExceptionUser(first.id)
  }, [exceptionUser, users.data])

  const payload = useMemo(() => {
    if (!form) return null
    return {
      userQuota: Number(form.userQuota),
      quotaPeriod: form.quotaPeriod,
      globalCostLimit: Number(form.globalCostLimit),
      currency: form.currency,
      warningThreshold: Number(form.warningThreshold),
      timeoutSeconds: Number(form.timeoutSeconds),
      onLimit: form.onLimit,
    }
  }, [form])

  const dirty = Boolean(form && initialForm && JSON.stringify(form) !== JSON.stringify(initialForm))

  const details = useMemo(() => {
    if (!limits || !payload) return []
    const rows: { label: string; before: string | null; after: string }[] = []
    if (limits.userQuota !== payload.userQuota) {
      rows.push({ label: 'Quota por utilizador', before: String(limits.userQuota), after: String(payload.userQuota) })
    }
    if (limits.quotaPeriod !== payload.quotaPeriod) {
      rows.push({ label: 'Período da quota', before: limits.quotaPeriod, after: payload.quotaPeriod })
    }
    if (limits.globalCostLimit !== payload.globalCostLimit) {
      rows.push({
        label: 'Limite global de custo',
        before: `${limits.globalCostLimit} ${limits.currency}`,
        after: `${payload.globalCostLimit} ${payload.currency}`,
      })
    }
    if (limits.currency !== payload.currency) {
      rows.push({ label: 'Moeda', before: limits.currency, after: payload.currency })
    }
    if (limits.warningThreshold !== payload.warningThreshold) {
      rows.push({
        label: 'Limiar de aviso',
        before: `${limits.warningThreshold}%`,
        after: `${payload.warningThreshold}%`,
      })
    }
    if (limits.timeoutSeconds !== payload.timeoutSeconds) {
      rows.push({
        label: 'Timeout do pedido',
        before: `${limits.timeoutSeconds}s`,
        after: `${payload.timeoutSeconds}s`,
      })
    }
    if (limits.onLimit !== payload.onLimit) {
      rows.push({ label: 'Comportamento ao atingir', before: limits.onLimit, after: payload.onLimit })
    }
    return rows
  }, [limits, payload])

  const usageRatio = usage.data
    ? Math.min(100, Math.round((usage.data.costUsed / Math.max(usage.data.costLimit, 0.0001)) * 100))
    : 0
  const requestRatio = usage.data
    ? Math.min(100, Math.round((usage.data.requestsUsed / Math.max(usage.data.requestsLimit, 1)) * 100))
    : 0
  const tone = usageRatio >= 100 ? 'danger' : usageRatio >= 80 ? 'warning' : 'accent'
  const loweringQuota = Boolean(
    usage.data &&
      payload &&
      (payload.userQuota < usage.data.requestsUsed || payload.globalCostLimit < usage.data.costUsed),
  )

  async function saveLimits() {
    if (!limits || !payload) return
    setBusy('save')
    try {
      const updated = await api.putAiLimits(
        { ...payload, exceptions: limits.exceptions },
        limits.version,
      )
      limitsState.setData(updated)
      const next = formFromLimits(updated)
      setForm(next)
      setInitialForm(next)
      setErrors({})
      setConfirmOpen(false)
      usage.reload()
      toast({
        title: 'Limites guardados',
        description: 'As alterações são aplicadas pelo servidor no endpoint de IA e ficam auditadas.',
        variant: 'success',
      })
    } catch (cause: unknown) {
      setConfirmOpen(false)
      const fieldErrors = getFieldErrors(cause)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else if (isConflict(cause)) {
        limitsState.reload()
      }
      toast({ title: 'Não foi possível guardar', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setBusy(null)
    }
  }

  async function saveException() {
    const quota = Number(exceptionQuota)
    if (!exceptionUser) {
      toast({ title: 'Seleccione um utilizador', variant: 'error' })
      return
    }
    setBusy('exception')
    try {
      const updated = await api.upsertAiException(exceptionUser, quota)
      limitsState.setData(updated)
      setExceptionQuota('')
      setErrors({})
      toast({ title: 'Exceção guardada', description: 'Quota própria registada em auditoria.', variant: 'success' })
    } catch (cause: unknown) {
      toast({ title: 'Não foi possível guardar a exceção', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setBusy(null)
    }
  }

  async function removeException() {
    if (!removeTarget) return
    setBusy('remove')
    try {
      const updated = await api.removeAiException(removeTarget.userId)
      limitsState.setData(updated)
      setRemoveTarget(null)
      toast({ title: 'Exceção removida', description: 'A quota global volta a aplicar-se.', variant: 'success' })
    } catch (cause: unknown) {
      toast({ title: 'Não foi possível remover', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setBusy(null)
    }
  }

  if (limitsState.status === 'error') {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="ADM-03" title="Quotas e custos da IA" />
        <InlineNote tone="danger">
          {getErrorMessage(limitsState.error)}
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={limitsState.reload}>
              Tentar de novo
            </Button>
          </div>
        </InlineNote>
      </div>
    )
  }

  if (!limits || !form) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="A carregar quotas">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
        <Skeleton className="h-80 rounded-card" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ADM-03"
        title="Quotas e custos da IA"
        description="Configure quotas, limites de custo, timeout e comportamento ao atingir o limite. A chave do fornecedor existe apenas no servidor e nunca é apresentada nem editável."
        actions={
          <Chip tone={dirty ? 'warning' : 'success'} size="sm">
            {dirty ? 'Alterações por guardar' : 'Configuração guardada'}
          </Chip>
        }
      />

      <InlineNote tone="warning" icon={AlertCircle}>
        O fornecedor e o modelo de IA ainda não estão definidos — ponto em aberto da documentação. Os
        pedidos de IA devolvem um erro controlado enquanto essa decisão não for tomada. Os dados
        apresentados são de demonstração.
      </InlineNote>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5 sm:p-6">
          {usage.status === 'loading' || !usage.data ? (
            <div className="space-y-4" aria-busy="true">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-36 rounded-card" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : usage.status === 'error' ? (
            <InlineNote tone="danger">
              Não foi possível carregar o consumo.
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={usage.reload}>
                  Tentar de novo
                </Button>
              </div>
            </InlineNote>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-accent" aria-hidden="true" />
                    <h2 className="text-sm font-semibold">Consumo actual</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted">{usage.data.periodLabel}</p>
                </div>
                <Chip
                  tone={usageRatio >= 100 ? 'danger' : usageRatio >= 80 ? 'warning' : 'success'}
                  icon={usageRatio >= 100 ? TriangleAlert : usageRatio >= 80 ? TriangleAlert : Sparkles}
                  size="sm"
                >
                  {usageRatio >= 100 ? 'Limite atingido' : usageRatio >= 80 ? 'Atenção' : 'Dentro do limite'}
                </Chip>
              </div>

              <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
                <ProgressRing
                  value={usage.data.costUsed}
                  max={usage.data.costLimit}
                  tone={tone as 'accent' | 'warning' | 'danger'}
                  label={`Custo da IA: ${formatCurrency(usage.data.costUsed, usage.data.currency)} de ${formatCurrency(usage.data.costLimit, usage.data.currency)}, ${usageRatio}%`}
                >
                  <span className="text-[10px] uppercase tracking-wide text-muted">Custo</span>
                  <CountUp
                    value={usageRatio}
                    format={(current) => `${Math.round(current)}%`}
                    className="font-display text-2xl font-bold"
                  />
                  <span className="max-w-[96px] text-center text-[10px] leading-tight text-muted">
                    de {formatCurrency(usage.data.costLimit, usage.data.currency)}
                  </span>
                </ProgressRing>

                <div className="w-full flex-1 space-y-3">
                  <div className="rounded-ctrl border border-line bg-surface/40 px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-muted">Pedidos</span>
                      <span className="text-xs text-ink">
                        <CountUp value={usage.data.requestsUsed} /> de {usage.data.requestsLimit}
                      </span>
                    </div>
                    <ProgressBar
                      value={usage.data.requestsUsed}
                      max={usage.data.requestsLimit}
                      tone={requestRatio >= 100 ? 'danger' : requestRatio >= 80 ? 'warning' : 'accent'}
                      label={`Pedidos de IA: ${usage.data.requestsUsed} de ${usage.data.requestsLimit}`}
                    />
                  </div>
                  <div className="rounded-ctrl border border-line bg-surface/40 px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-muted">Custo consumido</span>
                      <span className="text-xs text-ink">
                        {formatCurrency(usage.data.costUsed, usage.data.currency)} de{' '}
                        {formatCurrency(usage.data.costLimit, usage.data.currency)}
                      </span>
                    </div>
                    <ProgressBar
                      value={usage.data.costUsed}
                      max={usage.data.costLimit}
                      tone={tone as 'accent' | 'warning' | 'danger'}
                      label={`Custo da IA: ${formatCurrency(usage.data.costUsed, usage.data.currency)} de ${formatCurrency(usage.data.costLimit, usage.data.currency)}`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span>Erros do fornecedor: <strong className="text-ink">{usage.data.providerErrors}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Actualizado {new Date(usage.data.updatedAt).toLocaleTimeString('pt-PT')}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <LockKeyhole className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Fornecedor de IA</h2>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5">
              <dt className="text-muted">Fornecedor</dt>
              <dd>Não definido</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5">
              <dt className="text-muted">Versão do modelo</dt>
              <dd>Não definido</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5">
              <dt className="text-muted">Estado</dt>
              <dd>
                <Chip tone="warning" size="sm">Por definir</Chip>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Chave de API</dt>
              <dd className="flex items-center gap-1.5 text-xs text-muted">
                <KeyRound className="size-3.5" aria-hidden="true" />
                Só no servidor
              </dd>
            </div>
          </dl>
          <InlineNote tone="muted" className="mt-4">
            Não existe campo de chave neste ecrã. Nenhuma resposta da API admin contém a chave ou
            credenciais. A integração está encapsulada para permitir trocar de modelo.
          </InlineNote>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Limites configuráveis</h2>
              <p className="mt-1 text-xs text-muted">
                Alterações exigem confirmação com diferenças e são registadas em auditoria.
              </p>
            </div>
            {dirty ? <Chip tone="warning" size="sm">Não guardado</Chip> : <Chip tone="success" size="sm">Guardado</Chip>}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              label="Quota por utilizador (pedidos)"
              type="number"
              min="0"
              step="1"
              required
              value={form.userQuota}
              onChange={(event) => setForm({ ...form, userQuota: event.target.value })}
              error={errors.userQuota}
              hint="Inteiro ≥ 0, por período selecionado."
            />
            <Select
              label="Período da quota"
              value={form.quotaPeriod}
              onChange={(event) => setForm({ ...form, quotaPeriod: event.target.value as 'dia' | 'mês' })}
            >
              <option value="dia">Dia</option>
              <option value="mês">Mês</option>
            </Select>
            <Input
              label="Limite de custo global do período"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.globalCostLimit}
              onChange={(event) => setForm({ ...form, globalCostLimit: event.target.value })}
              error={errors.globalCostLimit}
              hint={`Valor na moeda selecionada. Moeda e período são pontos em aberto [A DEFINIR].`}
            />
            <Select
              label="Moeda"
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value as 'EUR' | 'USD' })}
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </Select>
            <Input
              label="Limiar de aviso (%)"
              type="number"
              min="1"
              max="100"
              step="1"
              required
              value={form.warningThreshold}
              onChange={(event) => setForm({ ...form, warningThreshold: event.target.value })}
              error={errors.warningThreshold}
              hint="Entre 1 e 100 % do limite."
            />
            <Input
              label="Timeout do pedido ao fornecedor (s)"
              type="number"
              min="5"
              max="120"
              step="1"
              required
              value={form.timeoutSeconds}
              onChange={(event) => setForm({ ...form, timeoutSeconds: event.target.value })}
              error={errors.timeoutSeconds}
              hint="Intervalo definido no backend: 5 a 120 segundos."
            />
            <div className="sm:col-span-2">
              <Select
                label="Comportamento ao atingir o limite"
                value={form.onLimit}
                onChange={(event) => setForm({ ...form, onLimit: event.target.value as 'bloquear' | 'avisar' })}
              >
                <option value="bloquear">Bloquear com mensagem controlada</option>
                <option value="avisar">Apenas avisar</option>
              </Select>
            </div>
          </div>

          {loweringQuota ? (
            <InlineNote tone="warning" className="mt-4">
              Está a reduzir um limite abaixo do consumo já realizado. O comportamento ao atingir o
              limite passa a aplicar-se de imediato; confirme o efeito antes de guardar.
            </InlineNote>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-[11px] text-muted">
              Os valores são validados no servidor. Erros de gravação preservam o formulário.
            </p>
            <Button
              icon={<Save className="size-4" />}
              disabled={!dirty || busy !== null}
              loading={busy === 'save'}
              onClick={() => setConfirmOpen(true)}
            >
              Guardar limites
            </Button>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <UsersRound className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Exceções por utilizador</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Lista opcional de utilizadores com quota própria. Proposta de granularidade a confirmar
            pela equipa.
          </p>

          <ul className="mt-4 space-y-2">
            {limits.exceptions.length === 0 ? (
              <li className="rounded-ctrl border border-dashed border-line px-4 py-6 text-center text-xs text-muted">
                Sem exceções. A quota global aplica-se a todos os utilizadores.
              </li>
            ) : (
              limits.exceptions.map((exception) => (
                <li
                  key={exception.userId}
                  className="flex items-center gap-3 rounded-ctrl border border-line bg-surface/40 px-3 py-2.5"
                >
                  <Avatar name={exception.userName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{exception.userName}</p>
                    <p className="mono text-[10px] text-muted">{exception.userId}</p>
                  </div>
                  <Chip tone="accent" size="sm">{exception.quota} pedidos</Chip>
                  <button
                    type="button"
                    onClick={() =>
                      setRemoveTarget({
                        userId: exception.userId,
                        userName: exception.userName,
                        quota: exception.quota,
                      })
                    }
                    className="flex size-8 items-center justify-center rounded text-muted transition hover:bg-danger/10 hover:text-danger"
                    aria-label={`Remover exceção de ${exception.userName}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="mt-5 rounded-ctrl border border-line bg-surface/30 p-4">
            <p className="text-xs font-medium text-ink">Adicionar ou atualizar exceção</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_0.8fr]">
              <Select
                label="Utilizador"
                value={exceptionUser}
                onChange={(event) => setExceptionUser(event.target.value)}
              >
                {(users.data?.items ?? []).map((user: UserRecord) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Quota"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={exceptionQuota}
                onChange={(event) => setExceptionQuota(event.target.value)}
              />
            </div>
            <Button
              variant="soft"
              size="sm"
              className="mt-3"
              icon={<Plus className="size-3.5" />}
              loading={busy === 'exception'}
              disabled={busy !== null || !exceptionQuota || !exceptionUser}
              onClick={() => void saveException()}
            >
              Guardar exceção
            </Button>
          </div>

          <InlineNote tone="muted" className="mt-4">
            As exceções são auditadas individualmente. A chave do fornecedor continua inacessível a
            partir do cliente.
          </InlineNote>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void saveLimits()}
        title="Confirmar alteração de limites"
        description="As alterações são aplicadas no servidor e passam a influenciar o comportamento do endpoint de IA. A redução de quotas pode bloquear pedidos."
        confirmLabel="Guardar limites"
        tone={loweringQuota ? 'danger' : 'primary'}
        busy={busy === 'save'}
        details={details}
      >
        {loweringQuota ? (
          <InlineNote tone="warning" icon={TriangleAlert}>
            O novo limite está abaixo do consumo já realizado. O efeito é imediato no comportamento
            da IA.
          </InlineNote>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void removeException()}
        title="Remover exceção de quota"
        description="O utilizador passa a estar sujeito à quota global por utilizador. A remoção é registada em auditoria."
        confirmLabel="Remover exceção"
        tone="danger"
        busy={busy === 'remove'}
        details={
          removeTarget
            ? [
                {
                  label: 'Quota própria',
                  before: `${removeTarget.quota} pedidos`,
                  after: `Quota global (${form.userQuota} pedidos)`,
                },
              ]
            : []
        }
      />
    </div>
  )
}
