export type Role = 'Utilizador' | 'Administrador'
export type UserStatus = 'Activo' | 'Suspenso'

export type ModuleId = 'wildfires' | 'wetlands' | 'ground'

export const MODULES: { id: ModuleId; label: string; labelPt: string }[] = [
  { id: 'wildfires', label: 'Wildfires', labelPt: 'Incêndios' },
  { id: 'wetlands', label: 'Wetlands/Flooding', labelPt: 'Zonas húmidas e inundações' },
  { id: 'ground', label: 'Ground Movement', labelPt: 'Movimento do terreno' },
]

export const MODULE_LABELS: Record<ModuleId, string> = {
  wildfires: 'Wildfires',
  wetlands: 'Wetlands/Flooding',
  ground: 'Ground Movement',
}

export const MODULE_LABELS_PT: Record<ModuleId, string> = {
  wildfires: 'Incêndios',
  wetlands: 'Zonas húmidas e inundações',
  ground: 'Movimento do terreno',
}

export type PermissionId =
  | 'consultar_observacoes'
  | 'pedir_explicacoes_ia'
  | 'gerir_areas'
  | 'receber_notificacoes'

export interface PermissionDef {
  id: PermissionId
  label: string
  description: string
}

export const PERMISSIONS: PermissionDef[] = [
  {
    id: 'consultar_observacoes',
    label: 'Consultar observações',
    description: 'Ver observações SAR e resultados de análise no modo Utilizador.',
  },
  {
    id: 'pedir_explicacoes_ia',
    label: 'Pedir explicações à IA',
    description: 'Solicitar explicações assistidas por IA sobre observações validadas.',
  },
  {
    id: 'gerir_areas',
    label: 'Gerir áreas de interesse',
    description: 'Criar, editar e remover áreas de interesse próprias.',
  },
  {
    id: 'receber_notificacoes',
    label: 'Receber notificações',
    description: 'Receber alertas gerados por regras validadas.',
  },
]

export interface UserRecord {
  id: string
  name: string
  email: string
  role: Role
  status: UserStatus
  permissions: Record<PermissionId, boolean>
  createdAt: string
  lastAccessAt: string
  aiRequestsPeriod: number
  aiCostPeriod: number
  version: number
}

export interface UserPatch {
  role?: Role
  status?: UserStatus
  permissions?: Partial<Record<PermissionId, boolean>>
}

export interface UserStats {
  active: number
  suspended: number
  admins: number
}

export type RuleState = 'Rascunho' | 'Validada' | 'Activa' | 'Desactivada'
export type Severity = 'Informativo' | 'Atenção' | 'Crítico'

export interface AlertRule {
  id: string
  name: string
  module: ModuleId
  area: string
  indicator: string
  operator: string
  threshold: number | null
  unit: string
  sourceProduct: string
  severity: Severity
  message: string
  state: RuleState
  lastEvaluatedAt: string | null
  alertsPeriod: number
  createdAt: string
  updatedAt: string
  version: number
}

export type RuleDraft = Omit<
  AlertRule,
  'id' | 'state' | 'lastEvaluatedAt' | 'alertsPeriod' | 'createdAt' | 'updatedAt' | 'version'
>

export interface RuleStats {
  draft: number
  validated: number
  active: number
  disabled: number
}

export interface AiUsage {
  periodLabel: string
  requestsUsed: number
  requestsLimit: number
  costUsed: number
  costLimit: number
  currency: string
  providerErrors: number
  providerStatus: 'por-definir' | 'operacional' | 'erro'
  providerModel: string
  updatedAt: string
}

export interface AiLimitException {
  userId: string
  userName: string
  quota: number
}

export interface AiLimits {
  userQuota: number
  quotaPeriod: 'dia' | 'mês'
  globalCostLimit: number
  currency: 'EUR' | 'USD'
  warningThreshold: number
  timeoutSeconds: number
  onLimit: 'bloquear' | 'avisar'
  exceptions: AiLimitException[]
  version: number
  updatedAt: string
}

export type AuditResult = 'success' | 'error'

export interface AuditEntry {
  id: string
  ts: string
  actorId: string
  actorMasked: string
  action: string
  target: string
  targetId: string | null
  before: string | null
  after: string | null
  result: AuditResult
  correlationId: string
  payload?: Record<string, unknown>
}

export interface AiInteraction {
  id: string
  ts: string
  actorId: string
  actorMasked: string
  module: ModuleId
  questionMasked: string
  question: string
  revealed: boolean
  contextRefs: string[]
  model: string
  modelVersion: string
  response: string
  result: AuditResult
  correlationId: string
}

export interface AnalysisRun {
  id: string
  ts: string
  module: ModuleId
  method: string
  version: string
  parameters: Record<string, string | number>
  state: 'Concluída' | 'Falhou' | 'Em execução'
  durationSeconds: number | null
  resultRef: string | null
  logs: string[]
  correlationId: string
}

export interface SystemError {
  id: string
  ts: string
  source: string
  message: string
  severity: 'Atenção' | 'Crítico'
  count: number
  correlationId: string
  stack?: string
}

export type IngestionStatus = 'Em fila' | 'Em execução' | 'Concluída' | 'Falhou' | 'Cancelada'
export type StepState = 'pending' | 'running' | 'done' | 'failed'

export const INGESTION_STEPS = [
  'Consulta/aquisição',
  'Validação de metadados',
  'Preparação geoespacial',
  'Processamento do módulo',
  'Controlo de qualidade',
  'Armazenamento',
] as const

export interface IngestionLog {
  ts: string
  level: 'info' | 'warn' | 'error'
  message: string
}

export interface IngestionMetadata {
  acquisition: string
  orbit: string
  polarization: string
  resolution: string
  geometry: string
  product: string
  source: string
  identifier: string
  license: string
  accessDate: string
  crs: string
}

export interface IngestionJob {
  id: string
  source: string
  module: ModuleId
  product: string
  area: string
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  status: IngestionStatus
  currentStep: number
  stepStates: StepState[]
  metadata: IngestionMetadata
  qa: { result: string; limitations: string } | null
  storage: { raster: string; metadata: string } | null
  logs: IngestionLog[]
  durationSeconds: number | null
  license: string
  accessDate: string
  error: string | null
  demo: boolean
  lastTickedStep: number
}

export interface IngestionStats {
  running: number
  failed: number
  queued: number
  completed: number
}

export interface IngestionDraft {
  source: string
  module: ModuleId
  area: string
  startDate: string
  endDate: string
  product: string
  licenseConfirmed: boolean
}

export interface OverviewAttention {
  id: string
  tone: 'warning' | 'danger'
  title: string
  detail: string
  to: string
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
  total: number
}

export interface AuditFilters {
  from: string
  to: string
  actor?: string
  result?: AuditResult | 'all'
  search?: string
  module?: ModuleId | 'all'
}

export const SOURCE_PRODUCTS = [
  {
    id: 'src_gcov',
    label: 'NISAR GCOV (banda L) — produto validado',
    modules: ['wildfires', 'wetlands'] as ModuleId[],
    quantitative: false,
  },
  {
    id: 'src_insar',
    label: 'NISAR InSAR — produto de deformação validado',
    modules: ['ground'] as ModuleId[],
    quantitative: true,
  },
  {
    id: 'src_backscatter',
    label: 'Produto derivado de retroespalhamento — validação parcial',
    modules: ['wildfires', 'wetlands'] as ModuleId[],
    quantitative: false,
  },
]

export const INDICATORS: Record<ModuleId, { label: string; unit: string }[]> = {
  wildfires: [
    { label: 'Variação de retroespalhamento (VV)', unit: 'dB' },
    { label: 'Área com alteração de superfície', unit: 'ha' },
  ],
  wetlands: [
    { label: 'Área de água detectada', unit: 'km²' },
    { label: 'Variação da extensão de água', unit: '%' },
  ],
  ground: [
    { label: 'Deslocamento vertical', unit: 'mm/ano' },
    { label: 'Deslocamento na linha de vista', unit: 'mm/ano' },
  ],
}

export const AREAS = [
  'Serra da Estrela',
  'Baixo Mondego',
  'Ria Formosa',
  'Vale do Tejo',
  'Costa Algarvia',
]

export const INGESTION_SOURCES = [
  'NASA Earthdata',
  'Alaska Satellite Facility (ASF)',
  'ISRO Bhoonidhi',
]

export interface SessionUser {
  id: string
  name: string
  email: string
  role: Role
}
