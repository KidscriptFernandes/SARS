import { motion } from 'framer-motion'
import {
  BellRing,
  ChevronRight,
  Copy,
  Plus,
  RotateCw,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import {
  MODULES,
  MODULE_LABELS,
  type ModuleId,
  type Severity,
} from '../../lib/types'
import { formatDateTime } from '../../lib/utils'
import { useAsyncData } from '../../lib/useAsyncData'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  InlineNote,
  PageHeader,
  Select,
  Skeleton,
  useToast,
} from '../../components/ui'
import { RuleStateChip, SeverityChip } from '../../components/admin/StatusChips'

const ease = [0.22, 1, 0.36, 1] as const

export function Rules() {
  const { toast } = useToast()
  const [module, setModule] = useState<ModuleId | 'all'>('all')
  const [state, setState] = useState('all')
  const [severity, setSeverity] = useState<Severity | 'all'>('all')
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const rules = useAsyncData(
    () => api.listRules({ module, state, severity }),
    `${module}-${state}-${severity}`,
  )

  async function duplicate(id: string) {
    setDuplicating(id)
    try {
      const copy = await api.duplicateRule(id)
      toast({
        title: 'Regra duplicada',
        description: `Criado ${copy.id} em Rascunho com o nome "${copy.name}".`,
        variant: 'success',
      })
      rules.reload()
    } catch (cause: unknown) {
      toast({ title: 'Não foi possível duplicar', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setDuplicating(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ADM-02"
        title="Regras de alerta"
        description="Crie e mantenha as regras que determinam alertas. Apenas regras validadas e activas podem ser avaliadas."
        actions={
          <Link
            to="/admin/alertas/nova"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-ctrl bg-accent px-6 text-[15px] font-semibold text-on-accent transition hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)] active:translate-y-0 active:scale-[0.98]"
          >
            <Plus className="size-4" aria-hidden="true" />
            Nova regra
          </Link>
        }
      />

      <InlineNote tone="accent" icon={ShieldCheck}>
        Ciclo de vida: <strong className="text-ink">Rascunho → Validada → Activa ⇄ Desactivada</strong>.
        Uma regra nunca passa a activa sem estar validada. O contexto científico e as limitações são
        sempre registados no texto do alerta.
      </InlineNote>

      <section aria-label="Filtros de regras" className="grid gap-3 rounded-card border border-line bg-card p-4 sm:grid-cols-3">
        <Select
          label="Módulo"
          value={module}
          onChange={(event) => setModule(event.target.value as ModuleId | 'all')}
        >
          <option value="all">Todos os módulos</option>
          {MODULES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label} ({item.labelPt})
            </option>
          ))}
        </Select>
        <Select label="Estado" value={state} onChange={(event) => setState(event.target.value)}>
          <option value="all">Todos os estados</option>
          <option value="Rascunho">Rascunho</option>
          <option value="Validada">Validada</option>
          <option value="Activa">Activa</option>
          <option value="Desactivada">Desactivada</option>
        </Select>
        <Select
          label="Severidade"
          value={severity}
          onChange={(event) => setSeverity(event.target.value as Severity | 'all')}
        >
          <option value="all">Todas as severidades</option>
          <option value="Informativo">Informativo</option>
          <option value="Atenção">Atenção</option>
          <option value="Crítico">Crítico</option>
        </Select>
      </section>

      {rules.status === 'loading' || rules.status === 'idle' ? (
        <div className="space-y-3" aria-busy="true" aria-label="A carregar regras">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-card" />
          ))}
        </div>
      ) : rules.status === 'error' ? (
        <ErrorState
          title="Não foi possível carregar as regras"
          description={getErrorMessage(rules.error)}
          onRetry={rules.reload}
        />
      ) : !rules.data || rules.data.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="Ainda não há regras"
          description="Crie a primeira regra em rascunho. Depois de validada, poderá ser activada e avaliada."
          action={
            <Link
              to="/admin/alertas/nova"
              className="inline-flex min-h-10 items-center gap-2 rounded-ctrl bg-accent px-4 text-sm font-semibold text-on-accent"
            >
              <Plus className="size-4" aria-hidden="true" />
              Criar primeira regra
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            {rules.data.length} regra{rules.data.length === 1 ? '' : 's'} no filtro actual
          </p>
          <ul className="space-y-3">
            {rules.data.map((rule, index) => (
              <motion.li
                key={rule.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: index < 8 ? index * 0.05 : 0, ease }}
              >
                <Card className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <RuleStateChip state={rule.state} />
                        <SeverityChip severity={rule.severity} />
                        <span className="rounded-pill border border-line px-2.5 py-1 text-[11px] text-muted">
                          {MODULE_LABELS[rule.module]}
                        </span>
                      </div>
                      <h2 className="mt-3 font-display text-lg font-semibold leading-snug">
                        <Link
                          to={`/admin/alertas/${rule.id}`}
                          className="transition hover:text-accent"
                        >
                          {rule.name}
                        </Link>
                      </h2>
                      <p className="mt-1 text-xs text-muted">
                        {rule.area} · {rule.indicator} {rule.operator} {rule.threshold ?? '—'}{' '}
                        {rule.unit}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted/80">
                        <span>
                          Última avaliação:{' '}
                          <span className="text-ink/80">{formatDateTime(rule.lastEvaluatedAt)}</span>
                        </span>
                        <span>
                          Alertas no período: <span className="text-ink/80">{rule.alertsPeriod}</span>
                        </span>
                        <span className="mono">{rule.id}</span>
                      </div>
                      {rule.state === 'Rascunho' ? (
                        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-warning">
                          <TriangleAlert className="size-3.5" aria-hidden="true" />
                          Rascunho não é avaliado. Conclua e valide antes de activar.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Copy className="size-3.5" />}
                        loading={duplicating === rule.id}
                        onClick={() => void duplicate(rule.id)}
                      >
                        Duplicar
                      </Button>
                      <Link
                        to={`/admin/alertas/${rule.id}`}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-ctrl bg-accent-soft px-3 text-[13px] font-medium text-accent transition hover:bg-accent/20"
                      >
                        Abrir
                        <ChevronRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.li>
            ))}
          </ul>
          <div className="flex justify-end pt-1">
            <Button variant="ghost" size="sm" icon={<RotateCw className="size-3.5" />} onClick={rules.reload}>
              Atualizar lista
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
