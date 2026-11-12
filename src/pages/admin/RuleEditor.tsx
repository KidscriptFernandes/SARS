import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Circle,
  Copy,
  Eye,
  Save,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { getErrorMessage, getFieldErrors, isConflict } from '../../lib/errors'
import {
  AREAS,
  INDICATORS,
  MODULES,
  MODULE_LABELS,
  SOURCE_PRODUCTS,
  type AlertRule,
  type ModuleId,
  type RuleDraft,
  type Severity,
} from '../../lib/types'
import { useAsyncData } from '../../lib/useAsyncData'
import {
  Button,
  Card,
  Chip,
  ConfirmDialog,
  InlineNote,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  TextArea,
  useToast,
} from '../../components/ui'
import { RuleStateChip, SeverityChip } from '../../components/admin/StatusChips'

interface RuleForm {
  name: string
  module: ModuleId
  area: string
  indicator: string
  operator: string
  threshold: string
  sourceProduct: string
  severity: Severity
  message: string
}

const defaultForm: RuleForm = {
  name: '',
  module: 'wildfires',
  area: AREAS[0],
  indicator: INDICATORS.wildfires[0].label,
  operator: '>',
  threshold: '',
  sourceProduct: '',
  severity: 'Informativo',
  message: '',
}

function fromRule(rule: AlertRule): RuleForm {
  return {
    name: rule.name,
    module: rule.module,
    area: rule.area,
    indicator: rule.indicator,
    operator: rule.operator,
    threshold: rule.threshold === null ? '' : String(rule.threshold),
    sourceProduct: rule.sourceProduct,
    severity: rule.severity,
    message: rule.message,
  }
}

function sourceLabel(id: string) {
  return SOURCE_PRODUCTS.find((product) => product.id === id)?.label ?? 'Não definido'
}

export function RuleEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isNew = !id
  const ruleState = useAsyncData<AlertRule | null>(
    () => (id ? api.getRule(id) : Promise.resolve(null)),
    id ?? 'new',
  )
  const rule = ruleState.data
  const readOnly = Boolean(rule && rule.state !== 'Rascunho')
  const [form, setForm] = useState<RuleForm>(defaultForm)
  const [initialForm, setInitialForm] = useState<RuleForm>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<'validar' | 'activar' | 'desactivar' | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    if (!rule) return
    const next = fromRule(rule)
    setForm(next)
    setInitialForm(next)
  }, [rule])

  const unit = useMemo(
    () => INDICATORS[form.module].find((indicator) => indicator.label === form.indicator)?.unit ?? '',
    [form.indicator, form.module],
  )
  const conditionLocked = form.module === 'ground' && form.sourceProduct !== 'src_insar'
  const isDirty = isNew ? true : JSON.stringify(form) !== JSON.stringify(initialForm)

  const checks = [
    { label: 'Nome com 3 a 80 caracteres', done: form.name.trim().length >= 3 && form.name.trim().length <= 80 },
    { label: 'Módulo e área definidos', done: Boolean(form.module && form.area) },
    {
      label: 'Produto de origem compatível e validado',
      done: Boolean(
        SOURCE_PRODUCTS.find(
          (product) => product.id === form.sourceProduct && product.modules.includes(form.module),
        ),
      ),
    },
    {
      label: 'Indicador com unidade coerente',
      done: Boolean(form.indicator && unit),
    },
    {
      label: 'Limitações explícitas no texto do alerta',
      done:
        form.message.trim().length >= 40 &&
        /(limita|não confirm|não equivale)/i.test(form.message) &&
        !(form.module === 'wildfires' && /incêndio activo confirmado/i.test(form.message)),
    },
    {
      label: 'Ground Movement apenas com InSAR validado',
      done: form.module !== 'ground' || form.sourceProduct === 'src_insar',
    },
  ]

  function patchForm(patch: Partial<RuleForm>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  function changeModule(module: ModuleId) {
    const firstProduct = SOURCE_PRODUCTS.find((product) => product.modules.includes(module))
    patchForm({
      module,
      indicator: INDICATORS[module][0].label,
      sourceProduct: module === 'ground' ? '' : firstProduct?.id ?? '',
    })
  }

  function buildDraft(): RuleDraft {
    return {
      name: form.name,
      module: form.module,
      area: form.area,
      indicator: form.indicator,
      operator: form.operator,
      threshold: form.threshold.trim() === '' ? null : Number(form.threshold),
      unit,
      sourceProduct: form.sourceProduct,
      severity: form.severity,
      message: form.message,
    }
  }

  async function persistDraft(showToast = true): Promise<AlertRule | null> {
    try {
      const draft = buildDraft()
      const saved = rule
        ? await api.updateRule(rule.id, draft, rule.version)
        : await api.createRule(draft)
      ruleState.setData(saved)
      const next = fromRule(saved)
      setForm(next)
      setInitialForm(next)
      setErrors({})
      if (showToast) {
        toast({
          title: rule ? 'Rascunho guardado' : 'Regra criada em Rascunho',
          description: 'Persistida no servidor e registada em auditoria.',
          variant: 'success',
        })
      }
      return saved
    } catch (cause: unknown) {
      const fieldErrors = getFieldErrors(cause)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
        toast({
          title: 'Verifique os campos assinalados',
          description: getErrorMessage(cause),
          variant: 'error',
        })
      } else if (isConflict(cause)) {
        toast({
          title: 'A regra foi alterada entretanto',
          description: 'Recarregue os valores actuais antes de voltar a guardar.',
          variant: 'error',
        })
        ruleState.reload()
      } else {
        toast({ title: 'Não foi possível guardar', description: getErrorMessage(cause), variant: 'error' })
      }
      return null
    }
  }

  async function handleSaveDraft() {
    setBusy('save')
    const saved = await persistDraft()
    setBusy(null)
    if (saved && isNew) {
      navigate(`/admin/alertas/${saved.id}`, { replace: true })
    }
  }

  async function runTransition(action: 'validar' | 'activar' | 'desactivar') {
    setPendingAction(null)
    setBusy(action)
    try {
      let working = rule
      if (action === 'validar' && (!working || isDirty)) {
        working = await persistDraft(false)
      }
      if (!working) return
      const updated = await api.transitionRule(working.id, action, working.version)
      ruleState.setData(updated)
      const next = fromRule(updated)
      setForm(next)
      setInitialForm(next)
      setErrors({})
      toast({
        title:
          action === 'validar'
            ? 'Regra validada'
            : action === 'activar'
              ? 'Regra activada'
              : 'Regra desactivada',
        description: 'Transição persistida e registada em auditoria.',
        variant: 'success',
      })
      navigate(`/admin/alertas/${updated.id}`, { replace: true })
    } catch (cause: unknown) {
      const fieldErrors = getFieldErrors(cause)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      }
      if (isConflict(cause)) ruleState.reload()
      toast({ title: 'Transição não aplicada', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setBusy(null)
    }
  }

  async function duplicateRule() {
    if (!rule) return
    setBusy('duplicate')
    try {
      const copy = await api.duplicateRule(rule.id)
      toast({
        title: 'Regra duplicada',
        description: `Criado ${copy.id} em Rascunho.`,
        variant: 'success',
      })
      navigate(`/admin/alertas/${copy.id}`)
    } catch (cause: unknown) {
      toast({ title: 'Não foi possível duplicar', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setBusy(null)
    }
  }

  if (ruleState.status === 'loading' && !rule) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="A carregar regra">
        <Skeleton className="h-9 w-72" />
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-card" />
            <Skeleton className="h-56 rounded-card" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-card" />
            <Skeleton className="h-56 rounded-card" />
          </div>
        </div>
      </div>
    )
  }

  if (ruleState.status === 'error') {
    return (
      <div className="space-y-4">
        <Link to="/admin/alertas" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Regras de alerta
        </Link>
        <InlineNote tone="danger">
          {getErrorMessage(ruleState.error)}
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={ruleState.reload}>
              Tentar de novo
            </Button>
          </div>
        </InlineNote>
      </div>
    )
  }

  const nextTransition =
    !rule || rule.state === 'Rascunho'
      ? 'Guardar → Validar → Activar'
      : rule.state === 'Validada'
        ? 'Próximo passo: Activar'
        : rule.state === 'Activa'
          ? 'Regra activa: pode ser desactivada'
          : 'Regra desactivada: pode ser reactivada'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/alertas"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Regras de alerta
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {rule ? <RuleStateChip state={rule.state} /> : <Chip tone="muted" size="sm">Rascunho</Chip>}
          <Chip tone={isDirty ? 'warning' : 'success'} size="sm">
            {isDirty ? 'Não guardado' : 'Guardado'}
          </Chip>
          <Button
            variant="secondary"
            size="sm"
            icon={<Eye className="size-3.5" />}
            onClick={() => setPreviewOpen(true)}
          >
            Pré-visualizar
          </Button>
        </div>
      </div>

      <PageHeader
        eyebrow="ADM-02 · Editor de regra"
        title={isNew ? 'Nova regra de alerta' : form.name || 'Regra sem nome'}
        description="A regra nasce em Rascunho. Só depois de validada pode ser activada e avaliada; o texto deve indicar origem, método e limitações."
      />

      {readOnly ? (
        <InlineNote tone="accent" icon={ShieldCheck}>
          Esta regra está em <strong className="text-ink">{rule?.state}</strong>. Os campos científicos
          são apenas de leitura; use as acções de transição no fim da página ou duplique para criar um
          novo rascunho.
        </InlineNote>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                1
              </span>
              <h2 className="text-sm font-semibold">Identificação</h2>
            </div>
            <div className="mt-4 grid gap-4">
              <Input
                label="Nome"
                required
                placeholder="Ex.: Anomalia de retroespalhamento — área"
                value={form.name}
                onChange={(event) => patchForm({ name: event.target.value })}
                error={errors.name}
                disabled={readOnly}
                maxLength={80}
                hint="Obrigatório, único, entre 3 e 80 caracteres."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Módulo"
                  required
                  value={form.module}
                  onChange={(event) => changeModule(event.target.value as ModuleId)}
                  error={errors.module}
                  disabled={readOnly}
                >
                  {MODULES.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.label} ({module.labelPt})
                    </option>
                  ))}
                </Select>
                <Select
                  label="Âmbito / área"
                  required
                  value={form.area}
                  onChange={(event) => patchForm({ area: event.target.value })}
                  error={errors.area}
                  disabled={readOnly}
                >
                  {AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                2
              </span>
              <h2 className="text-sm font-semibold">Condição e origem</h2>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label="Indicador"
                required
                value={form.indicator}
                onChange={(event) => patchForm({ indicator: event.target.value })}
                error={errors.indicator}
                disabled={readOnly || conditionLocked}
              >
                {INDICATORS[form.module].map((indicator) => (
                  <option key={indicator.label} value={indicator.label}>
                    {indicator.label}
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Select
                  label="Operador"
                  value={form.operator}
                  onChange={(event) => patchForm({ operator: event.target.value })}
                  disabled={readOnly || conditionLocked}
                >
                  <option value=">">&gt;</option>
                  <option value="≥">≥</option>
                  <option value="<">&lt;</option>
                  <option value="≤">≤</option>
                </Select>
                <div className="min-w-[88px]">
                  <p className="mb-1.5 text-[13px] font-medium text-ink">Unidade</p>
                  <div className="flex min-h-12 items-center justify-center rounded-ctrl border border-line bg-surface/60 px-3 text-sm text-muted">
                    {unit || '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input
                label={`Limiar${unit ? ` (${unit})` : ''}`}
                required
                inputMode="decimal"
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={form.threshold}
                onChange={(event) => patchForm({ threshold: event.target.value })}
                error={errors.threshold ?? errors.unit}
                disabled={readOnly || conditionLocked}
              />
              <Select
                label="Produto / método de origem"
                required
                value={form.sourceProduct}
                onChange={(event) => patchForm({ sourceProduct: event.target.value })}
                error={errors.sourceProduct}
                disabled={readOnly}
                hint="Sem fonte validada, a regra não pode ser validada."
              >
                <option value="">Seleccionar produto…</option>
                {SOURCE_PRODUCTS.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={!product.modules.includes(form.module)}
                  >
                    {product.label}
                    {!product.modules.includes(form.module) ? ' (incompatível com o módulo)' : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label="Severidade"
                required
                value={form.severity}
                onChange={(event) => patchForm({ severity: event.target.value as Severity })}
                error={errors.severity}
                disabled={readOnly}
              >
                <option value="Informativo">Informativo</option>
                <option value="Atenção">Atenção</option>
                <option value="Crítico">Crítico</option>
              </Select>
              <div className="flex items-end">
                <p className="text-[11px] leading-relaxed text-muted">
                  Valores de severidade propostos pela equipa — ponto em aberto a confirmar antes da
                  entrega final.
                </p>
              </div>
            </div>

            {conditionLocked ? (
              <InlineNote tone="warning" className="mt-4">
                Ground Movement: os campos quantitativos estão bloqueados. Seleccione um produto
                InSAR validado para os desbloquear. Deslocamentos quantitativos exigem aquisições
                compatíveis e método documentado.
              </InlineNote>
            ) : null}

            {form.module === 'ground' ? (
              <InlineNote tone="warning" className="mt-3">
                Não é possível apresentar deslocamentos quantitativos sem produto InSAR validado,
                aquisições compatíveis e método documentado.
              </InlineNote>
            ) : form.module === 'wildfires' ? (
              <InlineNote tone="warning" className="mt-3">
                Uma observação SAR isolada não equivale necessariamente à detecção confirmada de um
                incêndio activo. O texto do alerta tem de reflectir esta limitação.
              </InlineNote>
            ) : (
              <InlineNote tone="accent" className="mt-3">
                Só distinguimos água permanente, variação sazonal e possível inundação quando os
                dados e o método o permitem. O texto deve explicitar essa condição.
              </InlineNote>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                3
              </span>
              <h2 className="text-sm font-semibold">Texto do alerta</h2>
            </div>
            <TextArea
              label="Mensagem apresentada ao utilizador"
              required
              className="mt-4"
              value={form.message}
              onChange={(event) => patchForm({ message: event.target.value })}
              error={errors.message}
              disabled={readOnly}
              maxLength={800}
              placeholder="Indique a origem, o resultado observado e as limitações. Não afirme certeza não suportada."
              hint={`${form.message.length}/800 caracteres. Deve incluir explicitamente as limitações (ex.: "não confirma", "limitações do método").`}
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Requisitos científicos</h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {checks.map((check) => (
                <li key={check.label} className="flex items-start gap-2 text-xs leading-relaxed">
                  {check.done ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted/60" aria-hidden="true" />
                  )}
                  <span className={check.done ? 'text-ink/90' : 'text-muted'}>{check.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-ctrl border border-line bg-surface/50 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
              {nextTransition}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-accent" aria-hidden="true" />
                <h2 className="text-sm font-semibold">Pré-visualização</h2>
              </div>
              <Button variant="ghost" size="sm" icon={<ChevronRight className="size-3.5" />} onClick={() => setPreviewOpen(true)}>
                Abrir
              </Button>
            </div>
            <div className="mt-4 rounded-card border border-line bg-surface/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityChip severity={form.severity} />
                <Chip tone="outline" size="sm">{MODULE_LABELS[form.module]}</Chip>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold leading-snug">
                {form.name || 'Regra sem nome'}
              </h3>
              <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted">
                {form.message || 'O texto do alerta aparece aqui.'}
              </p>
              <p className="mt-3 text-[10px] text-muted/70">
                {form.area} · {sourceLabel(form.sourceProduct)}
              </p>
            </div>
          </Card>

          <InlineNote tone="muted" icon={TriangleAlert}>
            A pré-visualização usa apenas o texto real da regra. Não são gerados valores, datas ou
            fontes. Só regras validadas e activas são avaliadas para alertas.
          </InlineNote>
        </div>
      </div>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-card/95 p-3 backdrop-blur lg:bottom-4">
        <p className="text-xs text-muted">
          {readOnly
            ? 'Campos bloqueados: a regra já não está em Rascunho.'
            : isDirty
              ? 'Alterações por guardar. Valide e active segundo o ciclo de vida.'
              : 'Rascunho guardado.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {(!rule || rule.state === 'Rascunho') && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<Save className="size-3.5" />}
                loading={busy === 'save'}
                disabled={readOnly || busy !== null}
                onClick={() => void handleSaveDraft()}
              >
                {rule ? 'Guardar rascunho' : 'Criar rascunho'}
              </Button>
              <Button
                size="sm"
                icon={<ShieldCheck className="size-3.5" />}
                loading={busy === 'validar'}
                disabled={readOnly || busy !== null}
                onClick={() => setPendingAction('validar')}
              >
                Submeter a validação
              </Button>
            </>
          )}
          {rule?.state === 'Validada' ? (
            <Button
              size="sm"
              icon={<ShieldCheck className="size-3.5" />}
              loading={busy === 'activar'}
              disabled={busy !== null}
              onClick={() => setPendingAction('activar')}
            >
              Activar regra
            </Button>
          ) : null}
          {rule?.state === 'Activa' ? (
            <Button
              variant="danger"
              size="sm"
              loading={busy === 'desactivar'}
              disabled={busy !== null}
              onClick={() => setPendingAction('desactivar')}
            >
              Desactivar regra
            </Button>
          ) : null}
          {rule?.state === 'Desactivada' ? (
            <Button
              size="sm"
              icon={<ShieldCheck className="size-3.5" />}
              loading={busy === 'activar'}
              disabled={busy !== null}
              onClick={() => setPendingAction('activar')}
            >
              Reactivar regra
            </Button>
          ) : null}
          {rule ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<Copy className="size-3.5" />}
              loading={busy === 'duplicate'}
              disabled={busy !== null}
              onClick={() => void duplicateRule()}
            >
              Duplicar
            </Button>
          ) : null}
        </div>
      </div>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Como o utilizador verá o alerta"
        description="Pré-visualização estática com o texto real da regra. Nenhum valor é estimado."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityChip severity={form.severity} />
            <Chip tone="outline" size="sm">{MODULE_LABELS[form.module]}</Chip>
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold">{form.name || 'Regra sem nome'}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
              {form.message || 'O texto do alerta aparece aqui.'}
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3">
              <dt className="text-[10px] uppercase tracking-wide text-muted">Área</dt>
              <dd className="mt-1 text-sm text-ink">{form.area}</dd>
            </div>
            <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3">
              <dt className="text-[10px] uppercase tracking-wide text-muted">Produto / método</dt>
              <dd className="mt-1 text-sm text-ink">{sourceLabel(form.sourceProduct)}</dd>
            </div>
            <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3">
              <dt className="text-[10px] uppercase tracking-wide text-muted">Condição</dt>
              <dd className="mt-1 text-sm text-ink">
                {form.indicator} {form.operator} {form.threshold || '—'} {unit}
              </dd>
            </div>
            <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3">
              <dt className="text-[10px] uppercase tracking-wide text-muted">Estado</dt>
              <dd className="mt-1 text-sm text-ink">{rule?.state ?? 'Rascunho'}</dd>
            </div>
          </dl>
          <InlineNote tone="muted">
            O alerta real inclui sempre origem e limitações e é identificado como resultado sujeito a
            validação científica.
          </InlineNote>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction) void runTransition(pendingAction)
        }}
        title={
          pendingAction === 'validar'
            ? 'Submeter a validação'
            : pendingAction === 'activar'
              ? 'Activar regra'
              : 'Desactivar regra'
        }
        description={
          pendingAction === 'validar'
            ? 'A regra passa a Validada. Só depois poderá ser activada; se existirem alterações por guardar, serão persistidas primeiro.'
            : pendingAction === 'activar'
              ? 'A regra passa a Activa e será avaliada para alertas. Confirme que a fonte, o método e as limitações estão completos.'
              : 'A regra deixa de ser avaliada. Pode ser reactivada mais tarde; a alteração fica registada em auditoria.'
        }
        confirmLabel={
          pendingAction === 'validar'
            ? 'Validar regra'
            : pendingAction === 'activar'
              ? 'Activar'
              : 'Desactivar'
        }
        tone={pendingAction === 'desactivar' ? 'danger' : 'primary'}
        busy={busy !== null}
        details={
          pendingAction
            ? [
                {
                  label: 'Estado',
                  before: rule?.state ?? 'Rascunho',
                  after:
                    pendingAction === 'validar'
                      ? 'Validada'
                      : pendingAction === 'activar'
                        ? 'Activa'
                        : 'Desactivada',
                },
              ]
            : []
        }
      >
        {pendingAction === 'activar' && (!rule || rule.state === 'Rascunho') ? (
          <InlineNote tone="warning">
            Se existirem alterações por guardar, o rascunho é persistido e validado antes da
            activação.
          </InlineNote>
        ) : null}
      </ConfirmDialog>
    </div>
  )
}
