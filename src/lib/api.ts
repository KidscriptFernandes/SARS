import {
  AREAS,
  INDICATORS,
  INGESTION_STEPS,
  MODULES,
  PERMISSIONS,
  SOURCE_PRODUCTS,
  type AiInteraction,
  type AiLimits,
  type AiUsage,
  type AlertRule,
  type AnalysisRun,
  type AuditEntry,
  type AuditFilters,
  type AuditResult,
  type IngestionDraft,
  type IngestionJob,
  type IngestionStats,
  type IngestionStatus,
  type ModuleId,
  type OverviewAttention,
  type PermissionId,
  type Role,
  type RuleDraft,
  type RuleStats,
  type SessionUser,
  type Severity,
  type SystemError,
  type UserPatch,
  type UserRecord,
  type UserStats,
} from './types'
import {
  daysBetween,
  formatNumber,
  makeCorrelationId,
  maskEmail,
  toDateInput,
} from './utils'
import {
  seedAiLimits,
  seedAiUsage,
  seedAudit,
  seedErrors,
  seedIngestions,
  seedInteractions,
  seedRules,
  seedRuns,
  seedUsers,
} from './seed'

export class ApiError extends Error {
  status: number
  code: string
  correlationId: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.correlationId = makeCorrelationId('err')
    this.details = details
  }
}

interface Database {
  users: UserRecord[]
  rules: AlertRule[]
  aiUsage: AiUsage
  aiLimits: AiLimits
  audit: AuditEntry[]
  interactions: AiInteraction[]
  runs: AnalysisRun[]
  errors: SystemError[]
  ingestions: IngestionJob[]
}

function createDatabase(): Database {
  return {
    users: seedUsers(),
    rules: seedRules(),
    aiUsage: seedAiUsage(),
    aiLimits: seedAiLimits(),
    audit: seedAudit(),
    interactions: seedInteractions(),
    runs: seedRuns(),
    errors: seedErrors(),
    ingestions: seedIngestions(),
  }
}

const db = createDatabase()
let actor: SessionUser | null = null

function sleep(ms = 260) {
  return new Promise((resolve) => setTimeout(resolve, ms + Math.random() * 140))
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function nowIso() {
  return new Date().toISOString()
}

function requireAdmin() {
  if (!actor) {
    throw new ApiError(401, 'NO_SESSION', 'Sessão inexistente ou expirada.')
  }
  if (actor.role !== 'Administrador') {
    throw new ApiError(403, 'FORBIDDEN', 'É necessário o perfil de Administrador.')
  }
}

function actorMasked() {
  return actor ? maskEmail(actor.email) : '—'
}

function recordAudit(input: {
  action: string
  target: string
  targetId?: string | null
  before?: string | null
  after?: string | null
  result?: AuditResult
  payload?: Record<string, unknown>
}) {
  const entry: AuditEntry = {
    id: `aud_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    ts: nowIso(),
    actorId: actor?.id ?? 'sistema',
    actorMasked: actorMasked(),
    action: input.action,
    target: input.target,
    targetId: input.targetId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    result: input.result ?? 'success',
    correlationId: makeCorrelationId('corr'),
    payload: input.payload,
  }
  db.audit.unshift(entry)
  return entry
}

function findUser(id: string) {
  const user = db.users.find((item) => item.id === id)
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Utilizador não encontrado.')
  return user
}

function findRule(id: string) {
  const rule = db.rules.find((item) => item.id === id)
  if (!rule) throw new ApiError(404, 'RULE_NOT_FOUND', 'Regra não encontrada.')
  return rule
}

function findIngestion(id: string) {
  const job = db.ingestions.find((item) => item.id === id)
  if (!job) throw new ApiError(404, 'INGESTION_NOT_FOUND', 'Tarefa de ingestão não encontrada.')
  return job
}

function validateDateRange(from: string, to: string) {
  if (!from || !to) {
    throw new ApiError(422, 'DATE_REQUIRED', 'Indique o intervalo de datas.')
  }
  if (from > to) {
    throw new ApiError(422, 'DATE_ORDER', 'A data inicial tem de ser anterior à data final.')
  }
  if (daysBetween(from, to) > 31) {
    throw new ApiError(
      422,
      'RANGE_TOO_LARGE',
      'O intervalo máximo por consulta é de 31 dias. Refine os filtros.',
    )
  }
}

function toDateKey(iso: string) {
  return iso.slice(0, 10)
}

export const api = {
  setActor(user: SessionUser | null) {
    actor = user
  },

  async getUserStats(): Promise<UserStats> {
    requireAdmin()
    await sleep()
    return {
      active: db.users.filter((user) => user.status === 'Activo').length,
      suspended: db.users.filter((user) => user.status === 'Suspenso').length,
      admins: db.users.filter(
        (user) => user.role === 'Administrador' && user.status === 'Activo',
      ).length,
    }
  },

  async getRuleStats(): Promise<RuleStats> {
    requireAdmin()
    await sleep()
    return {
      draft: db.rules.filter((rule) => rule.state === 'Rascunho').length,
      validated: db.rules.filter((rule) => rule.state === 'Validada').length,
      active: db.rules.filter((rule) => rule.state === 'Activa').length,
      disabled: db.rules.filter((rule) => rule.state === 'Desactivada').length,
    }
  },

  async getAiUsage(): Promise<AiUsage> {
    requireAdmin()
    await sleep()
    return {
      ...clone(db.aiUsage),
      requestsLimit: db.aiLimits.userQuota,
      costLimit: db.aiLimits.globalCostLimit,
      currency: db.aiLimits.currency,
    }
  },

  async getLastAudit(): Promise<AuditEntry | null> {
    requireAdmin()
    await sleep()
    const sorted = [...db.audit].sort((a, b) => b.ts.localeCompare(a.ts))
    return sorted[0] ? clone(sorted[0]) : null
  },

  async getIngestionStats(): Promise<IngestionStats> {
    requireAdmin()
    advanceIngestions()
    await sleep()
    return {
      running: db.ingestions.filter((job) => job.status === 'Em execução').length,
      failed: db.ingestions.filter((job) => job.status === 'Falhou').length,
      queued: db.ingestions.filter((job) => job.status === 'Em fila').length,
      completed: db.ingestions.filter((job) => job.status === 'Concluída').length,
    }
  },

  async getAttention(): Promise<OverviewAttention[]> {
    requireAdmin()
    await sleep()
    const items: OverviewAttention[] = []
    const failed = db.ingestions.filter((job) => job.status === 'Falhou')
    if (failed.length > 0) {
      items.push({
        id: 'attention-ingestion',
        tone: 'danger',
        title: `${failed.length} ingestão${failed.length > 1 ? 'ões' : ''} falhada${failed.length > 1 ? 's' : ''}`,
        detail: 'Consultar a etapa, a causa e repetir a tarefa quando aplicável.',
        to: '/admin/ingestao',
      })
    }
    const usage = db.aiUsage
    const limit = db.aiLimits
    const costRatio = limit.globalCostLimit > 0 ? usage.costUsed / limit.globalCostLimit : 0
    if (costRatio * 100 >= limit.warningThreshold) {
      items.push({
        id: 'attention-ai',
        tone: 'warning',
        title: 'Consumo de IA perto do limite',
        detail: `${formatNumber(costRatio * 100)}% do limite global de custo foi consumido.`,
        to: '/admin/ia',
      })
    }
    const pendingValidation = db.rules.filter((rule) => rule.state === 'Rascunho')
    if (pendingValidation.length > 0) {
      items.push({
        id: 'attention-rules',
        tone: 'warning',
        title: `${pendingValidation.length} regra${pendingValidation.length > 1 ? 's' : ''} em rascunho`,
        detail: 'Concluir e validar as regras antes de poderem gerar alertas.',
        to: '/admin/alertas',
      })
    }
    return items
  },

  async listUsers(params: {
    search?: string
    role?: Role | 'all'
    status?: string
    cursor?: string | null
    limit?: number
  }): Promise<{ items: UserRecord[]; nextCursor: string | null; total: number }> {
    requireAdmin()
    await sleep()
    const limit = params.limit ?? 6
    const offset = params.cursor ? Number(params.cursor) : 0
    const search = (params.search ?? '').trim().toLowerCase()
    const filtered = db.users
      .filter((user) => {
        if (params.role && params.role !== 'all' && user.role !== params.role) return false
        if (params.status && params.status !== 'all' && user.status !== params.status) return false
        if (!search) return true
        return (
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.id.toLowerCase().includes(search)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
    const items = filtered.slice(offset, offset + limit)
    return {
      items: clone(items),
      nextCursor: offset + limit < filtered.length ? String(offset + limit) : null,
      total: filtered.length,
    }
  },

  async getUser(id: string): Promise<UserRecord> {
    requireAdmin()
    await sleep()
    return clone(findUser(id))
  },

  async patchUser(id: string, patch: UserPatch, version: number): Promise<UserRecord> {
    requireAdmin()
    await sleep(320)
    const user = findUser(id)

    if (user.version !== version) {
      throw new ApiError(
        409,
        'VERSION_CONFLICT',
        'O utilizador foi alterado entretanto por outra sessão.',
        { current: clone(user) },
      )
    }

    const nextRole = patch.role ?? user.role
    const nextStatus = patch.status ?? user.status
    const losesAdmin =
      user.role === 'Administrador' &&
      user.status === 'Activo' &&
      nextRole === 'Utilizador'
    const suspendsAdmin =
      user.role === 'Administrador' &&
      user.status === 'Activo' &&
      nextStatus === 'Suspenso'
    if (losesAdmin || suspendsAdmin) {
      const remaining = db.users.filter(
        (candidate) =>
          candidate.id !== id &&
          candidate.role === 'Administrador' &&
          candidate.status === 'Activo',
      ).length
      if (remaining === 0) {
        throw new ApiError(
          422,
          'LAST_ADMIN',
          'Não é possível remover ou suspender o último Administrador activo.',
        )
      }
    }

    const beforeParts: string[] = []
    const afterParts: string[] = []
    const actions: string[] = []

    if (nextRole !== user.role) {
      beforeParts.push(`Perfil: ${user.role}`)
      afterParts.push(`Perfil: ${nextRole}`)
      actions.push('Alterar perfil')
    }
    if (nextStatus !== user.status) {
      beforeParts.push(`Estado: ${user.status}`)
      afterParts.push(`Estado: ${nextStatus}`)
      actions.push(nextStatus === 'Suspenso' ? 'Suspender utilizador' : 'Reactivar utilizador')
    }
    if (patch.permissions) {
      for (const permission of PERMISSIONS) {
        const oldValue = user.permissions[permission.id]
        const requested = patch.permissions[permission.id]
        if (requested === undefined || requested === oldValue) continue
        beforeParts.push(`${permission.label}: ${oldValue ? 'sim' : 'não'}`)
        afterParts.push(`${permission.label}: ${requested ? 'sim' : 'não'}`)
      }
      if (beforeParts.length > 0) actions.push('Alterar permissões')
    }

    if (beforeParts.length === 0) {
      return clone(user)
    }

    user.role = nextRole
    user.status = nextStatus
    if (patch.permissions) {
      user.permissions = { ...user.permissions, ...patch.permissions }
    }
    user.version += 1

    recordAudit({
      action: [...new Set(actions)].join(' · '),
      target: `${user.id} — ${user.name}`,
      targetId: user.id,
      before: beforeParts.join(' · '),
      after: afterParts.join(' · '),
    })

    return clone(user)
  },

  async revealUserEmail(id: string): Promise<{ email: string }> {
    requireAdmin()
    await sleep()
    const user = findUser(id)
    recordAudit({
      action: 'Revelar e-mail',
      target: `${user.id} — ${user.name}`,
      targetId: user.id,
      before: maskEmail(user.email),
      after: user.email,
    })
    return { email: user.email }
  },

  async listRules(params: {
    search?: string
    module?: ModuleId | 'all'
    state?: string
    severity?: Severity | 'all'
  }): Promise<AlertRule[]> {
    requireAdmin()
    await sleep()
    const search = (params.search ?? '').trim().toLowerCase()
    return clone(
      db.rules
        .filter((rule) => {
          if (params.module && params.module !== 'all' && rule.module !== params.module) return false
          if (params.state && params.state !== 'all' && rule.state !== params.state) return false
          if (params.severity && params.severity !== 'all' && rule.severity !== params.severity)
            return false
          if (!search) return true
          return (
            rule.name.toLowerCase().includes(search) ||
            rule.area.toLowerCase().includes(search) ||
            rule.id.toLowerCase().includes(search)
          )
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    )
  },

  async getRule(id: string): Promise<AlertRule> {
    requireAdmin()
    await sleep()
    return clone(findRule(id))
  },

  async createRule(draft: RuleDraft): Promise<AlertRule> {
    requireAdmin()
    await sleep(320)
    const errors = validateRuleContent(draft, false)
    if (Object.keys(errors).length > 0) {
      throw new ApiError(422, 'VALIDATION', 'Verifique os campos da regra.', { errors })
    }
    assertUniqueRuleName(draft.name)
    const now = nowIso()
    const rule: AlertRule = {
      ...draft,
      id: `rule_${Date.now().toString(36)}`,
      state: 'Rascunho',
      lastEvaluatedAt: null,
      alertsPeriod: 0,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    db.rules.unshift(rule)
    recordAudit({
      action: 'Criar regra de alerta',
      target: `${rule.id} — ${rule.name}`,
      targetId: rule.id,
      before: null,
      after: 'Rascunho',
    })
    return clone(rule)
  },

  async updateRule(id: string, draft: RuleDraft, version: number): Promise<AlertRule> {
    requireAdmin()
    await sleep(320)
    const rule = findRule(id)
    if (rule.state !== 'Rascunho') {
      throw new ApiError(
        409,
        'RULE_LOCKED',
        'Só é possível editar os campos de uma regra em Rascunho.',
      )
    }
    if (rule.version !== version) {
      throw new ApiError(
        409,
        'VERSION_CONFLICT',
        'A regra foi alterada entretanto por outra sessão.',
        { current: clone(rule) },
      )
    }
    const errors = validateRuleContent(draft, false)
    if (Object.keys(errors).length > 0) {
      throw new ApiError(422, 'VALIDATION', 'Verifique os campos da regra.', { errors })
    }
    assertUniqueRuleName(draft.name, id)

    const changes = diffRule(rule, draft)
    if (changes.before.length === 0) return clone(rule)

    Object.assign(rule, draft)
    rule.updatedAt = nowIso()
    rule.version += 1

    recordAudit({
      action: 'Editar regra de alerta',
      target: `${rule.id} — ${rule.name}`,
      targetId: rule.id,
      before: changes.before.join(' · '),
      after: changes.after.join(' · '),
    })
    return clone(rule)
  },

  async transitionRule(
    id: string,
    target: 'validar' | 'activar' | 'desactivar',
    version: number,
  ): Promise<AlertRule> {
    requireAdmin()
    await sleep(320)
    const rule = findRule(id)
    if (rule.version !== version) {
      throw new ApiError(
        409,
        'VERSION_CONFLICT',
        'A regra foi alterada entretanto por outra sessão.',
        { current: clone(rule) },
      )
    }

    const errors = validateRuleContent(rule, true)
    if (target === 'validar' && rule.state !== 'Rascunho') {
      throw new ApiError(422, 'INVALID_TRANSITION', 'Só uma regra em Rascunho pode ser validada.')
    }
    if (target === 'activar' && !['Validada', 'Desactivada'].includes(rule.state)) {
      throw new ApiError(
        422,
        'RULE_NOT_VALIDATED',
        'Só uma regra validada pode ser activada.',
      )
    }
    if (target === 'desactivar' && rule.state !== 'Activa') {
      throw new ApiError(422, 'INVALID_TRANSITION', 'Só uma regra activa pode ser desactivada.')
    }
    if (target !== 'desactivar' && Object.keys(errors).length > 0) {
      throw new ApiError(
        422,
        'VALIDATION',
        'A regra não cumpre os requisitos para esta transição.',
        { errors },
      )
    }

    const previous = rule.state
    const nextState = target === 'validar' ? 'Validada' : target === 'activar' ? 'Activa' : 'Desactivada'
    rule.state = nextState
    rule.updatedAt = nowIso()
    rule.version += 1

    const action =
      target === 'validar'
        ? 'Validar regra de alerta'
        : target === 'activar'
          ? 'Activar regra de alerta'
          : 'Desactivar regra de alerta'
    recordAudit({
      action,
      target: `${rule.id} — ${rule.name}`,
      targetId: rule.id,
      before: previous,
      after: nextState,
    })
    return clone(rule)
  },

  async duplicateRule(id: string): Promise<AlertRule> {
    requireAdmin()
    await sleep()
    const source = findRule(id)
    const baseName = `${source.name} (cópia)`
    let name = baseName
    let counter = 2
    while (db.rules.some((rule) => rule.name.toLowerCase() === name.toLowerCase())) {
      name = `${baseName} ${counter}`
      counter += 1
    }
    const now = nowIso()
    const copy: AlertRule = {
      ...clone(source),
      id: `rule_${Date.now().toString(36)}`,
      name,
      state: 'Rascunho',
      lastEvaluatedAt: null,
      alertsPeriod: 0,
      createdAt: now,
      updatedAt: now,
      version: 1,
    }
    db.rules.unshift(copy)
    recordAudit({
      action: 'Duplicar regra de alerta',
      target: `${copy.id} — ${copy.name}`,
      targetId: copy.id,
      before: source.id,
      after: 'Rascunho',
    })
    return clone(copy)
  },

  async getAiLimits(): Promise<AiLimits> {
    requireAdmin()
    await sleep()
    return clone(db.aiLimits)
  },

  async putAiLimits(input: Omit<AiLimits, 'version' | 'updatedAt'>, version: number): Promise<AiLimits> {
    requireAdmin()
    await sleep(360)
    if (db.aiLimits.version !== version) {
      throw new ApiError(
        409,
        'VERSION_CONFLICT',
        'Os limites foram alterados entretanto por outra sessão.',
        { current: clone(db.aiLimits) },
      )
    }
    const errors: Record<string, string> = {}
    if (!Number.isInteger(input.userQuota) || input.userQuota < 0) {
      errors.userQuota = 'Indique um número inteiro maior ou igual a zero.'
    }
    if (!Number.isFinite(input.globalCostLimit) || input.globalCostLimit < 0) {
      errors.globalCostLimit = 'Indique um valor maior ou igual a zero.'
    }
    if (
      !Number.isFinite(input.warningThreshold) ||
      input.warningThreshold < 1 ||
      input.warningThreshold > 100
    ) {
      errors.warningThreshold = 'O limiar tem de estar entre 1 e 100 %.'
    }
    if (
      !Number.isFinite(input.timeoutSeconds) ||
      input.timeoutSeconds < 5 ||
      input.timeoutSeconds > 120
    ) {
      errors.timeoutSeconds = 'O timeout tem de estar entre 5 e 120 segundos.'
    }
    if (Object.keys(errors).length > 0) {
      throw new ApiError(422, 'VALIDATION', 'Verifique os limites indicados.', { errors })
    }

    const previous = db.aiLimits
    const before: string[] = []
    const after: string[] = []
    if (previous.userQuota !== input.userQuota) {
      before.push(`Quota por utilizador: ${previous.userQuota}`)
      after.push(`Quota por utilizador: ${input.userQuota}`)
    }
    if (previous.quotaPeriod !== input.quotaPeriod) {
      before.push(`Período: ${previous.quotaPeriod}`)
      after.push(`Período: ${input.quotaPeriod}`)
    }
    if (previous.globalCostLimit !== input.globalCostLimit) {
      before.push(`Limite global: ${previous.globalCostLimit} ${previous.currency}`)
      after.push(`Limite global: ${input.globalCostLimit} ${input.currency}`)
    }
    if (previous.currency !== input.currency) {
      before.push(`Moeda: ${previous.currency}`)
      after.push(`Moeda: ${input.currency}`)
    }
    if (previous.warningThreshold !== input.warningThreshold) {
      before.push(`Limiar de aviso: ${previous.warningThreshold}%`)
      after.push(`Limiar de aviso: ${input.warningThreshold}%`)
    }
    if (previous.timeoutSeconds !== input.timeoutSeconds) {
      before.push(`Timeout: ${previous.timeoutSeconds}s`)
      after.push(`Timeout: ${input.timeoutSeconds}s`)
    }
    if (previous.onLimit !== input.onLimit) {
      before.push(`Ao atingir o limite: ${previous.onLimit}`)
      after.push(`Ao atingir o limite: ${input.onLimit}`)
    }

    db.aiLimits = {
      ...input,
      exceptions: previous.exceptions,
      version: previous.version + 1,
      updatedAt: nowIso(),
    }

    if (before.length > 0) {
      recordAudit({
        action: 'Alterar limites da IA',
        target: 'Configuração de quotas e custos',
        targetId: 'ai_limits',
        before: before.join(' · '),
        after: after.join(' · '),
      })
    }

    return clone(db.aiLimits)
  },

  async upsertAiException(userId: string, quota: number): Promise<AiLimits> {
    requireAdmin()
    await sleep()
    const user = findUser(userId)
    if (!Number.isInteger(quota) || quota < 0) {
      throw new ApiError(422, 'VALIDATION', 'A quota tem de ser um inteiro maior ou igual a zero.')
    }
    const existing = db.aiLimits.exceptions.find((item) => item.userId === userId)
    const before = existing ? `${user.name}: ${existing.quota}` : null
    if (existing) {
      existing.quota = quota
    } else {
      db.aiLimits.exceptions.push({ userId, userName: user.name, quota })
    }
    db.aiLimits.version += 1
    db.aiLimits.updatedAt = nowIso()
    recordAudit({
      action: 'Alterar exceção de quota da IA',
      target: `${user.id} — ${user.name}`,
      targetId: user.id,
      before,
      after: `Quota própria: ${quota}`,
    })
    return clone(db.aiLimits)
  },

  async removeAiException(userId: string): Promise<AiLimits> {
    requireAdmin()
    await sleep()
    const existing = db.aiLimits.exceptions.find((item) => item.userId === userId)
    if (!existing) throw new ApiError(404, 'EXCEPTION_NOT_FOUND', 'Exceção não encontrada.')
    db.aiLimits.exceptions = db.aiLimits.exceptions.filter((item) => item.userId !== userId)
    db.aiLimits.version += 1
    db.aiLimits.updatedAt = nowIso()
    recordAudit({
      action: 'Remover exceção de quota da IA',
      target: `${existing.userId} — ${existing.userName}`,
      targetId: existing.userId,
      before: `Quota própria: ${existing.quota}`,
      after: null,
    })
    return clone(db.aiLimits)
  },

  async getAudit(filters: AuditFilters): Promise<{ items: AuditEntry[]; total: number }> {
    requireAdmin()
    await sleep()
    const { from, to } = normalizeRange(filters)
    const search = (filters.search ?? '').trim().toLowerCase()
    const items = db.audit
      .filter((entry) => {
        const date = toDateKey(entry.ts)
        if (date < from || date > to) return false
        if (filters.result && filters.result !== 'all' && entry.result !== filters.result) return false
        if (filters.actor && !`${entry.actorId} ${entry.actorMasked}`.toLowerCase().includes(filters.actor.toLowerCase()))
          return false
        if (!search) return true
        return [entry.id, entry.action, entry.target, entry.correlationId, entry.actorMasked]
          .join(' ')
          .toLowerCase()
          .includes(search)
      })
      .sort((a, b) => b.ts.localeCompare(a.ts))
    return { items: clone(items.slice(0, 100)), total: items.length }
  },

  async exportAuditCsv(filters: AuditFilters): Promise<{ filename: string; content: string }> {
    requireAdmin()
    await sleep()
    const { from, to } = normalizeRange(filters)
    const search = (filters.search ?? '').trim().toLowerCase()
    const rows = db.audit
      .filter((entry) => {
        const date = toDateKey(entry.ts)
        if (date < from || date > to) return false
        if (filters.result && filters.result !== 'all' && entry.result !== filters.result) return false
        if (!search) return true
        return [entry.id, entry.action, entry.target, entry.correlationId]
          .join(' ')
          .toLowerCase()
          .includes(search)
      })
      .sort((a, b) => b.ts.localeCompare(a.ts))
    const header = ['id', 'timestamp_utc', 'actor', 'action', 'target', 'result', 'correlation_id']
    const lines = [
      header.join(','),
      ...rows.map((entry) =>
        [
          entry.id,
          entry.ts,
          entry.actorMasked,
          entry.action,
          entry.target,
          entry.result,
          entry.correlationId,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(','),
      ),
    ]
    recordAudit({
      action: 'Exportar auditoria',
      target: 'Vista filtrada de auditoria',
      targetId: null,
      before: null,
      after: `${rows.length} registos exportados`,
    })
    return {
      filename: `auditoria_${from}_${to}.csv`,
      content: `\uFEFF${lines.join('\r\n')}`,
    }
  },

  async getInteractions(filters: AuditFilters): Promise<{ items: AiInteraction[]; total: number }> {
    requireAdmin()
    await sleep()
    const { from, to } = normalizeRange(filters)
    const search = (filters.search ?? '').trim().toLowerCase()
    const items = db.interactions
      .filter((entry) => {
        const date = toDateKey(entry.ts)
        if (date < from || date > to) return false
        if (filters.result && filters.result !== 'all' && entry.result !== filters.result) return false
        if (filters.module && filters.module !== 'all' && entry.module !== filters.module) return false
        if (!search) return true
        return [entry.id, entry.actorMasked, entry.contextRefs.join(' '), entry.correlationId]
          .join(' ')
          .toLowerCase()
          .includes(search)
      })
      .sort((a, b) => b.ts.localeCompare(a.ts))
    return { items: clone(items.slice(0, 100)), total: items.length }
  },

  async revealInteractionQuestion(id: string): Promise<AiInteraction> {
    requireAdmin()
    await sleep()
    const interaction = db.interactions.find((item) => item.id === id)
    if (!interaction) throw new ApiError(404, 'INTERACTION_NOT_FOUND', 'Interacção não encontrada.')
    interaction.revealed = true
    recordAudit({
      action: 'Revelar pergunta de utilizador',
      target: `${interaction.id} — ${interaction.actorMasked}`,
      targetId: interaction.id,
      before: 'Pergunta mascarada',
      after: 'Pergunta revelada (conteúdo não persistido no registo)',
    })
    return clone(interaction)
  },

  async getRuns(filters: AuditFilters): Promise<{ items: AnalysisRun[]; total: number }> {
    requireAdmin()
    await sleep()
    const { from, to } = normalizeRange(filters)
    const search = (filters.search ?? '').trim().toLowerCase()
    const items = db.runs
      .filter((run) => {
        const date = toDateKey(run.ts)
        if (date < from || date > to) return false
        if (filters.module && filters.module !== 'all' && run.module !== filters.module) return false
        if (filters.result === 'success' && run.state !== 'Concluída') return false
        if (filters.result === 'error' && run.state !== 'Falhou') return false
        if (!search) return true
        return [run.id, run.method, run.correlationId, run.resultRef ?? '']
          .join(' ')
          .toLowerCase()
          .includes(search)
      })
      .sort((a, b) => b.ts.localeCompare(a.ts))
    return { items: clone(items), total: items.length }
  },

  async getErrors(filters: AuditFilters): Promise<{ items: SystemError[]; total: number }> {
    requireAdmin()
    await sleep()
    const { from, to } = normalizeRange(filters)
    const search = (filters.search ?? '').trim().toLowerCase()
    const items = db.errors
      .filter((error) => {
        const date = toDateKey(error.ts)
        if (date < from || date > to) return false
        if (!search) return true
        return [error.id, error.source, error.message, error.correlationId]
          .join(' ')
          .toLowerCase()
          .includes(search)
      })
      .sort((a, b) => b.ts.localeCompare(a.ts))
    return { items: clone(items), total: items.length }
  },

  async listIngestions(params: {
    status?: IngestionStatus | 'all'
    source?: string
    module?: ModuleId | 'all'
    date?: string
  }): Promise<IngestionJob[]> {
    requireAdmin()
    advanceIngestions()
    await sleep()
    return clone(
      db.ingestions
        .filter((job) => {
          if (params.status && params.status !== 'all' && job.status !== params.status) return false
          if (params.source && params.source !== 'all' && job.source !== params.source) return false
          if (params.module && params.module !== 'all' && job.module !== params.module) return false
          if (params.date && toDateKey(job.createdAt) !== params.date) return false
          return true
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  },

  async getIngestion(id: string): Promise<IngestionJob> {
    requireAdmin()
    advanceIngestions()
    await sleep()
    return clone(findIngestion(id))
  },

  async createIngestion(draft: IngestionDraft): Promise<IngestionJob> {
    requireAdmin()
    await sleep(420)
    const errors: Record<string, string> = {}
    if (!draft.licenseConfirmed) {
      errors.licenseConfirmed = 'Confirme a verificação de licença e condições de acesso.'
    }
    if (!draft.source) errors.source = 'Seleccione uma fonte.'
    if (!draft.module) errors.module = 'Seleccione um módulo.'
    if (!draft.area.trim()) errors.area = 'Indique uma área ou região válida.'
    if (!draft.startDate || !draft.endDate) {
      errors.period = 'Indique o período completo.'
    } else if (draft.startDate > draft.endDate) {
      errors.period = 'A data inicial tem de ser anterior ou igual à data final.'
    }
    if (Object.keys(errors).length > 0) {
      throw new ApiError(422, 'VALIDATION', 'Verifique os dados da nova ingestão.', { errors })
    }

    const now = nowIso()
    const id = `job_${Date.now().toString(36)}`
    const demoIdentifier = `DEMO-${draft.source.split(' ')[0].toUpperCase()}-${Date.now()
      .toString(36)
      .toUpperCase()}`
    const job: IngestionJob = {
      id,
      source: draft.source,
      module: draft.module,
      product: draft.product || 'Produto do catálogo da fonte',
      area: draft.area,
      createdAt: now,
      startedAt: null,
      finishedAt: null,
      status: 'Em fila',
      currentStep: 0,
      stepStates: ['pending', 'pending', 'pending', 'pending', 'pending', 'pending'],
      metadata: {
        acquisition: 'não disponível',
        orbit: 'não disponível',
        polarization: 'não disponível',
        resolution: 'não disponível',
        geometry: 'não disponível',
        product: draft.product || 'não disponível',
        source: draft.source,
        identifier: demoIdentifier,
        license: 'Condições de acesso confirmadas na submissão (demonstração)',
        accessDate: now,
        crs: 'não disponível',
      },
      qa: null,
      storage: null,
      logs: [
        {
          ts: now,
          level: 'info',
          message: `Tarefa criada. Período solicitado: ${draft.startDate} a ${draft.endDate} (UTC).`,
        },
        {
          ts: now,
          level: 'info',
          message: 'Licença e condições de acesso confirmadas pelo administrador.',
        },
      ],
      durationSeconds: null,
      license: 'Condições de acesso confirmadas na submissão (demonstração)',
      accessDate: now,
      error: null,
      demo: true,
      lastTickedStep: 0,
    }
    db.ingestions.unshift(job)
    recordAudit({
      action: 'Iniciar ingestão',
      target: `${job.id} — ${job.source} / ${job.module}`,
      targetId: job.id,
      before: null,
      after: 'Em fila',
    })
    return clone(job)
  },

  async cancelIngestion(id: string): Promise<IngestionJob> {
    requireAdmin()
    await sleep(320)
    const job = findIngestion(id)
    if (!['Em fila', 'Em execução'].includes(job.status)) {
      throw new ApiError(422, 'INVALID_STATE', 'Só tarefas em fila ou em execução podem ser canceladas.')
    }
    const before = job.status
    job.status = 'Cancelada'
    if (before === 'Em execução' && job.currentStep < 6) {
      job.stepStates[job.currentStep] = 'failed'
    }
    job.error = 'Tarefa cancelada por um administrador.'
    job.finishedAt = nowIso()
    job.logs.push({
      ts: nowIso(),
      level: 'warn',
      message: 'Tarefa cancelada por um administrador.',
    })
    recordAudit({
      action: 'Cancelar ingestão',
      target: `${job.id} — ${job.source} / ${job.module}`,
      targetId: job.id,
      before,
      after: 'Cancelada',
    })
    return clone(job)
  },

  async retryIngestion(id: string): Promise<IngestionJob> {
    requireAdmin()
    await sleep(360)
    const source = findIngestion(id)
    if (source.status !== 'Falhou') {
      throw new ApiError(422, 'INVALID_STATE', 'Só uma tarefa falhada pode ser repetida.')
    }
    const now = nowIso()
    const copy = clone(source)
    copy.id = `job_${Date.now().toString(36)}`
    copy.status = 'Em fila'
    copy.currentStep = 0
    copy.stepStates = ['pending', 'pending', 'pending', 'pending', 'pending', 'pending']
    copy.createdAt = now
    copy.startedAt = null
    copy.finishedAt = null
    copy.qa = null
    copy.storage = null
    copy.durationSeconds = null
    copy.error = null
    copy.lastTickedStep = 0
    copy.logs = [
      {
        ts: now,
        level: 'info',
        message: `Nova tarefa criada a partir de ${source.id} (repetição). A tarefa anterior não é alterada.`,
      },
    ]
    db.ingestions.unshift(copy)
    recordAudit({
      action: 'Repetir ingestão',
      target: `${copy.id} — ${copy.source} / ${copy.module}`,
      targetId: copy.id,
      before: source.id,
      after: 'Em fila',
    })
    return clone(copy)
  },
}

function normalizeRange(filters: AuditFilters) {
  const to = filters.to || toDateInput(new Date())
  const from =
    filters.from ||
    toDateInput(new Date(Date.now() - 6 * 86_400_000))
  validateDateRange(from, to)
  return { from, to }
}

function validateRuleContent(rule: Partial<RuleDraft>, full: boolean) {
  const errors: Record<string, string> = {}
  if (!rule.name || rule.name.trim().length < 3 || rule.name.trim().length > 80) {
    errors.name = 'O nome deve ter entre 3 e 80 caracteres.'
  }
  if (!full) return errors

  if (!rule.module || !MODULES.some((module) => module.id === rule.module)) {
    errors.module = 'Seleccione um módulo.'
  }
  if (!rule.area || !AREAS.includes(rule.area)) {
    errors.area = 'Seleccione uma área existente ou uma região válida.'
  }
  const indicators = rule.module ? INDICATORS[rule.module] : []
  if (!rule.indicator || !indicators.some((indicator) => indicator.label === rule.indicator)) {
    errors.indicator = 'Seleccione um indicador compatível com o módulo.'
  }
  if (rule.threshold === null || rule.threshold === undefined || !Number.isFinite(rule.threshold)) {
    errors.threshold = 'Indique um limiar numérico.'
  } else if (rule.threshold < 0) {
    errors.threshold = 'O limiar não pode ser negativo.'
  }
  if (!rule.unit) {
    errors.unit = 'A unidade é obrigatória.'
  }
  const source = SOURCE_PRODUCTS.find((product) => product.id === rule.sourceProduct)
  if (!source) {
    errors.sourceProduct = 'Seleccione um produto de origem validado.'
  } else if (rule.module && !source.modules.includes(rule.module)) {
    errors.sourceProduct = 'O produto de origem não é compatível com o módulo.'
  } else if (rule.module === 'ground' && !source.quantitative) {
    errors.sourceProduct =
      'Regras quantitativas de Ground Movement exigem um produto InSAR validado.'
  }
  if (!rule.severity) {
    errors.severity = 'Seleccione a severidade.'
  }
  if (!rule.message || rule.message.trim().length < 40) {
    errors.message = 'O texto do alerta deve indicar origem e limitações (mínimo 40 caracteres).'
  } else if (!/(limita|não confirm|não equivale)/i.test(rule.message)) {
    errors.message = 'Inclua explicitamente as limitações da observação no texto do alerta.'
  }
  if (
    rule.module === 'wildfires' &&
    /incêndio activo confirmado/i.test(rule.message ?? '')
  ) {
    errors.message =
      'Não é permitido afirmar "incêndio activo confirmado" com base numa observação SAR isolada.'
  }
  return errors
}

function assertUniqueRuleName(name: string, currentId?: string) {
  const exists = db.rules.some(
    (rule) => rule.id !== currentId && rule.name.toLowerCase() === name.trim().toLowerCase(),
  )
  if (exists) {
    throw new ApiError(422, 'VALIDATION', 'Já existe uma regra com este nome.', {
      errors: { name: 'Já existe uma regra com este nome.' },
    })
  }
}

function diffRule(rule: AlertRule, draft: RuleDraft) {
  const before: string[] = []
  const after: string[] = []
  const push = (label: string, oldValue: string, newValue: string) => {
    if (oldValue !== newValue) {
      before.push(`${label}: ${oldValue}`)
      after.push(`${label}: ${newValue}`)
    }
  }
  push('Nome', rule.name, draft.name)
  push('Módulo', rule.module, draft.module)
  push('Área', rule.area, draft.area)
  push('Indicador', rule.indicator, draft.indicator)
  push('Operador', rule.operator, draft.operator)
  push('Limiar', `${rule.threshold ?? '—'} ${rule.unit}`, `${draft.threshold ?? '—'} ${draft.unit}`)
  push('Produto de origem', rule.sourceProduct, draft.sourceProduct)
  push('Severidade', rule.severity, draft.severity)
  push('Texto', rule.message, draft.message)
  return { before, after }
}

const STEP_THRESHOLDS = [3, 5, 8, 12, 15, 18]
const QUEUE_DELAY_SECONDS = 20

function advanceIngestions() {
  for (const job of db.ingestions) {
    if (job.status === 'Em fila') {
      const queuedFor = (Date.now() - new Date(job.createdAt).getTime()) / 1000
      if (queuedFor < QUEUE_DELAY_SECONDS) continue
      job.status = 'Em execução'
      job.startedAt = nowIso()
      job.currentStep = 0
      job.stepStates[0] = 'running'
      job.logs.push({
        ts: nowIso(),
        level: 'info',
        message: 'Tarefa retirada da fila e iniciada (demonstração).',
      })
      continue
    }
    if (job.status !== 'Em execução' || !job.startedAt) continue
    const elapsed = (Date.now() - new Date(job.startedAt).getTime()) / 1000
    let nextStep = 0
    while (nextStep < STEP_THRESHOLDS.length && elapsed >= STEP_THRESHOLDS[nextStep]) {
      nextStep += 1
    }
    if (nextStep <= job.currentStep) continue

    for (let index = job.currentStep; index < nextStep; index += 1) {
      if (index < job.stepStates.length) job.stepStates[index] = 'done'
      job.logs.push({
        ts: nowIso(),
        level: 'info',
        message: `Etapa "${INGESTION_STEPS[index]}" concluída (demonstração).`,
      })
    }
    job.currentStep = nextStep
    job.lastTickedStep = nextStep
    if (nextStep < 6) {
      job.stepStates[nextStep] = 'running'
      job.logs.push({
        ts: nowIso(),
        level: 'info',
        message: `A executar: ${INGESTION_STEPS[nextStep]} (demonstração).`,
      })
    } else {
      job.status = 'Concluída'
      job.finishedAt = nowIso()
      job.durationSeconds = Math.round(elapsed)
      job.stepStates = ['done', 'done', 'done', 'done', 'done', 'done']
      job.qa = {
        result: 'Aprovado no controlo de qualidade (demonstração).',
        limitations:
          job.module === 'ground'
            ? 'Deslocamentos quantitativos exigem produto InSAR validado, aquisições compatíveis e método documentado.'
            : job.module === 'wildfires'
              ? 'Uma observação SAR isolada não confirma um incêndio activo.'
              : 'A distinção entre água permanente, variação sazonal e possível inundação depende do método e dos dados.',
      }
      job.storage = {
        raster: `object-storage://demo-rasters/${job.module}/${job.id}.tif`,
        metadata: `postgis://demo/analysis_results/${job.id}`,
      }
      job.logs.push({
        ts: nowIso(),
        level: 'info',
        message: 'Tarefa concluída. Resultado e metadados armazenados (demonstração).',
      })
    }
  }
}

export { AREAS, INGESTION_SOURCES, INDICATORS, MODULES, SOURCE_PRODUCTS } from './types'
export type { PermissionId }
