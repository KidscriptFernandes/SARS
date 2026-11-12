import {
  Ban,
  CheckCircle2,
  Circle,
  Clock3,
  Info,
  Loader2,
  PauseCircle,
  PencilLine,
  Radio,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import type {
  AuditResult,
  IngestionStatus,
  RuleState,
  Severity,
  UserStatus,
} from '../../lib/types'
import { Chip } from '../ui'

export function UserStatusChip({ status }: { status: UserStatus }) {
  return status === 'Activo' ? (
    <Chip tone="success" icon={CheckCircle2} size="sm">
      Activo
    </Chip>
  ) : (
    <Chip tone="warning" icon={PauseCircle} size="sm">
      Suspenso
    </Chip>
  )
}

export function RoleChip({ role }: { role: 'Utilizador' | 'Administrador' }) {
  return role === 'Administrador' ? (
    <Chip tone="accent" icon={ShieldCheck} size="sm">
      Administrador
    </Chip>
  ) : (
    <Chip tone="muted" icon={Circle} size="sm">
      Utilizador
    </Chip>
  )
}

export function RuleStateChip({ state }: { state: RuleState }) {
  const map = {
    Rascunho: { tone: 'muted' as const, icon: PencilLine },
    Validada: { tone: 'accent' as const, icon: ShieldCheck },
    Activa: { tone: 'success' as const, icon: Radio },
    Desactivada: { tone: 'muted' as const, icon: Ban },
  }
  const entry = map[state]
  return (
    <Chip tone={entry.tone} icon={entry.icon} size="sm">
      {state}
    </Chip>
  )
}

export function SeverityChip({ severity }: { severity: Severity }) {
  const map = {
    Informativo: { tone: 'accent' as const, icon: Info },
    Atenção: { tone: 'warning' as const, icon: TriangleAlert },
    Crítico: { tone: 'danger' as const, icon: XCircle },
  }
  const entry = map[severity]
  return (
    <Chip tone={entry.tone} icon={entry.icon} size="sm">
      {severity}
    </Chip>
  )
}

export function IngestionStatusChip({ status }: { status: IngestionStatus }) {
  const map = {
    'Em fila': { tone: 'muted' as const, icon: Clock3 },
    'Em execução': { tone: 'accent' as const, icon: Loader2 },
    Concluída: { tone: 'success' as const, icon: CheckCircle2 },
    Falhou: { tone: 'danger' as const, icon: XCircle },
    Cancelada: { tone: 'muted' as const, icon: Ban },
  }
  const entry = map[status]
  return (
    <Chip tone={entry.tone} icon={entry.icon} size="sm">
      {status}
    </Chip>
  )
}

export function ResultChip({ result }: { result: AuditResult }) {
  return result === 'success' ? (
    <Chip tone="success" icon={CheckCircle2} size="sm">
      Sucesso
    </Chip>
  ) : (
    <Chip tone="danger" icon={XCircle} size="sm">
      Erro
    </Chip>
  )
}
