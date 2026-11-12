import { motion } from 'framer-motion'
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  DatabaseZap,
  RotateCw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import { useAsyncData } from '../../lib/useAsyncData'
import { getErrorMessage } from '../../lib/errors'
import {
  Button,
  Chip,
  PageHeader,
  ProgressBar,
  Skeleton,
} from '../../components/ui'

const ease = [0.22, 1, 0.36, 1] as const

function ShortcutCard({
  to,
  title,
  icon: Icon,
  children,
  index,
}: {
  to: string
  title: string
  icon: LucideIcon
  children: React.ReactNode
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease }}
    >
      <div className="glow-hover group relative h-full rounded-card border border-line bg-card p-5 active:scale-[0.99]">
        <Link
          to={to}
          className="absolute inset-0 z-10 rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={`Abrir ${title}`}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="flex size-10 items-center justify-center rounded-ctrl border border-accent/20 bg-accent-soft text-accent">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <ChevronRight
            className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
            aria-hidden="true"
          />
        </div>
        <h2 className="mt-4 font-display text-[17px] font-semibold">{title}</h2>
        <div className="mt-2 min-h-[74px]">{children}</div>
      </div>
    </motion.div>
  )
}

function CardSkeleton() {
  return (
    <div className="space-y-2.5">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-2/3" />
    </div>
  )
}

function CardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="relative z-20 space-y-2">
      <p className="flex items-start gap-1.5 text-xs font-medium text-danger">
        <span aria-hidden="true">✖</span>
        {message}
      </p>
      <Button variant="secondary" size="sm" onClick={onRetry} icon={<RotateCw className="size-3.5" />}>
        Tentar de novo
      </Button>
    </div>
  )
}

export function Overview() {
  const users = useAsyncData(api.getUserStats, 'overview-users')
  const rules = useAsyncData(api.getRuleStats, 'overview-rules')
  const usage = useAsyncData(api.getAiUsage, 'overview-ai')
  const lastAudit = useAsyncData(api.getLastAudit, 'overview-audit')
  const ingestions = useAsyncData(api.getIngestionStats, 'overview-ingestions')
  const attention = useAsyncData(api.getAttention, 'overview-attention')

  const usageRatio = usage.data
    ? Math.min(100, Math.round((usage.data.costUsed / Math.max(usage.data.costLimit, 0.0001)) * 100))
    : 0
  const usageTone =
    usageRatio >= 100 ? 'danger' : usageRatio >= 80 ? 'warning' : 'accent'

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Painel"
        title="Administração"
        description="Visão resumida do estado operacional e atalho para os cinco casos de uso do actor Administrador."
        actions={
          <Chip tone="accent">
            <span className="relative mr-0.5 flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            Modo Administrador
          </Chip>
        }
      />

      <section aria-label="Atalhos de administração" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ShortcutCard to="/admin/utilizadores" title="Utilizadores e permissões" icon={Users} index={0}>
          {users.status === 'loading' || users.status === 'idle' ? (
            <CardSkeleton />
          ) : users.status === 'error' || !users.data ? (
            <CardError message="Não foi possível carregar" onRetry={users.reload} />
          ) : (
            <div>
              <p className="font-display text-3xl font-bold leading-none">{users.data.active}</p>
              <p className="mt-1.5 text-xs text-muted">
                activos · {users.data.suspended} suspensos · {users.data.admins} administradores
              </p>
              <p className="mt-3 text-xs text-muted/80">Gerir perfis, estados e permissões.</p>
            </div>
          )}
        </ShortcutCard>

        <ShortcutCard to="/admin/alertas" title="Regras de alerta" icon={BellRing} index={1}>
          {rules.status === 'loading' || rules.status === 'idle' ? (
            <CardSkeleton />
          ) : rules.status === 'error' || !rules.data ? (
            <CardError message="Não foi possível carregar" onRetry={rules.reload} />
          ) : (
            <div className="space-y-2">
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['Rascunho', rules.data.draft],
                  ['Validadas', rules.data.validated],
                  ['Activas', rules.data.active],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-ctrl bg-surface/60 px-1.5 py-2">
                    <dt className="text-[10px] uppercase tracking-wide text-muted">{label}</dt>
                    <dd className="font-display text-lg font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-muted/80">Só regras validadas são avaliadas.</p>
            </div>
          )}
        </ShortcutCard>

        <ShortcutCard to="/admin/ia" title="Quotas e custos da IA" icon={Sparkles} index={2}>
          {usage.status === 'loading' || usage.status === 'idle' ? (
            <CardSkeleton />
          ) : usage.status === 'error' || !usage.data ? (
            <CardError message="Não foi possível carregar" onRetry={usage.reload} />
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted">Consumo do período</span>
                <span className="font-semibold text-ink">{usageRatio}%</span>
              </div>
              <ProgressBar
                value={usage.data.costUsed}
                max={usage.data.costLimit}
                tone={usageTone}
                label={`Consumo de custo da IA: ${formatCurrency(usage.data.costUsed, usage.data.currency)} de ${formatCurrency(usage.data.costLimit, usage.data.currency)}`}
              />
              <p className="text-xs text-muted">
                {formatCurrency(usage.data.costUsed, usage.data.currency)} de{' '}
                {formatCurrency(usage.data.costLimit, usage.data.currency)}
              </p>
              {usageRatio >= 80 ? (
                <p className="flex items-center gap-1.5 text-xs text-warning">
                  <TriangleAlert className="size-3.5" aria-hidden="true" />
                  Limiar de aviso atingido
                </p>
              ) : null}
            </div>
          )}
        </ShortcutCard>

        <ShortcutCard to="/admin/auditoria" title="Auditoria e logs" icon={ScrollText} index={3}>
          {lastAudit.status === 'loading' || lastAudit.status === 'idle' ? (
            <CardSkeleton />
          ) : lastAudit.status === 'error' ? (
            <CardError message="Não foi possível carregar" onRetry={lastAudit.reload} />
          ) : (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Último registo</p>
              <p className="mt-1.5 font-display text-lg font-semibold leading-snug">
                {lastAudit.data ? formatDateTime(lastAudit.data.ts) : 'Sem registos'}
              </p>
              <p className="mt-1 text-xs text-muted">
                {lastAudit.data ? lastAudit.data.action : 'Ainda não existem acções registadas.'}
              </p>
            </div>
          )}
        </ShortcutCard>

        <ShortcutCard to="/admin/ingestao" title="Ingestão de dados" icon={DatabaseZap} index={4}>
          {ingestions.status === 'loading' || ingestions.status === 'idle' ? (
            <CardSkeleton />
          ) : ingestions.status === 'error' || !ingestions.data ? (
            <CardError message="Não foi possível carregar" onRetry={ingestions.reload} />
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display text-3xl font-bold leading-none">{ingestions.data.running}</p>
                <p className="text-xs text-muted">em execução</p>
              </div>
              <p className="mt-2 text-xs text-muted">
                {ingestions.data.failed} falhadas · {ingestions.data.queued} em fila ·{' '}
                {ingestions.data.completed} concluídas
              </p>
              <p className="mt-2 text-[11px] text-muted/80">
                Consulta/aquisição incluída no pipeline.
              </p>
            </div>
          )}
        </ShortcutCard>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 5 * 0.07, ease }}
          className="relative overflow-hidden rounded-card border border-line bg-card p-5"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Modo Administrador</h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Toda a escrita é registada em auditoria com valor anterior → novo. Os registos são só de
            leitura e a chave do fornecedor de IA não existe em nenhum ecrã.
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-muted/70">
            Interface de demonstração com dados simulados. Nenhum número representa dados reais
            NISAR.
          </p>
        </motion.div>
      </section>

      <section aria-labelledby="attention-title" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="attention-title" className="text-lg font-semibold">
              Atenção
            </h2>
            <p className="text-xs text-muted">Itens que exigem acção ou confirmação.</p>
          </div>
        </div>

        {attention.status === 'loading' || attention.status === 'idle' ? (
          <div className="space-y-2">
            {[0, 1].map((index) => (
              <Skeleton key={index} className="h-16 rounded-card" />
            ))}
          </div>
        ) : attention.status === 'error' ? (
          <CardError message={getErrorMessage(attention.error)} onRetry={attention.reload} />
        ) : !attention.data || attention.data.length === 0 ? (
          <div className="flex items-center gap-3 rounded-card border border-success/25 bg-success/5 px-5 py-4">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-ink">Nada pendente</p>
              <p className="text-xs text-muted">Não existem itens a exigir acção neste momento.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {attention.data.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 rounded-card border border-line bg-card px-4 py-3.5 transition hover:border-accent/60 hover:bg-surface/40"
                >
                  <span
                    className={
                      item.tone === 'danger'
                        ? 'flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger'
                        : 'flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning'
                    }
                  >
                    <TriangleAlert className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{item.title}</span>
                    <span className="block text-xs text-muted">{item.detail}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[11px] leading-relaxed text-muted/60">
        Indicadores lidos de endpoints simulados independentes. A falha de um indicador não bloqueia
        os restantes. Formatação local de datas; registos técnicos em ISO 8601 UTC.
      </p>
    </div>
  )
}
