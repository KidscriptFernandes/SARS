import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  History,
  KeyRound,
  Mail,
  RotateCw,
  ShieldAlert,
  Sparkles,
  Undo2,
  UserCog,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { getCurrentRecord, getErrorMessage, isConflict } from '../../lib/errors'
import {
  PERMISSIONS,
  type PermissionId,
  type Role,
  type UserRecord,
  type UserStatus,
} from '../../lib/types'
import { cn, formatCurrency, formatDateTime, maskEmail } from '../../lib/utils'
import { useAsyncData } from '../../lib/useAsyncData'
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  ErrorState,
  IconButton,
  InlineNote,
  PageHeader,
  Select,
  Skeleton,
  Switch,
  useToast,
  type ConfirmDetail,
} from '../../components/ui'
import { RoleChip, UserStatusChip } from '../../components/admin/StatusChips'

interface DraftState {
  role: Role
  status: UserStatus
  permissions: Record<PermissionId, boolean>
}

const permissionGroups: { title: string; ids: PermissionId[] }[] = [
  { title: 'Observações e IA', ids: ['consultar_observacoes', 'pedir_explicacoes_ia'] },
  { title: 'Áreas e notificações', ids: ['gerir_areas', 'receber_notificacoes'] },
]

export function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, logout } = useAuth()
  const { toast } = useToast()
  const userState = useAsyncData(() => api.getUser(id ?? ''), id ?? '')
  const user = userState.data
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [baseVersion, setBaseVersion] = useState<number | null>(null)
  const [revealedEmail, setRevealedEmail] = useState<string | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [conflict, setConflict] = useState<UserRecord | null>(null)

  useEffect(() => {
    if (!user) return
    if (!draft || baseVersion !== user.version) {
      setDraft({
        role: user.role,
        status: user.status,
        permissions: { ...user.permissions },
      })
      setBaseVersion(user.version)
      setRevealedEmail(null)
    }
  }, [user])

  const diff = useMemo<ConfirmDetail[]>(() => {
    if (!user || !draft) return []
    const details: ConfirmDetail[] = []
    if (user.role !== draft.role) {
      details.push({ label: 'Perfil', before: user.role, after: draft.role })
    }
    if (user.status !== draft.status) {
      details.push({ label: 'Estado', before: user.status, after: draft.status })
    }
    for (const permission of PERMISSIONS) {
      const before = user.permissions[permission.id]
      const after = draft.permissions[permission.id]
      if (before !== after) {
        details.push({
          label: permission.label,
          before: before ? 'sim' : 'não',
          after: after ? 'sim' : 'não',
        })
      }
    }
    return details
  }, [draft, user])

  const isDirty = diff.length > 0

  function resetDraft() {
    if (!user) return
    setDraft({
      role: user.role,
      status: user.status,
      permissions: { ...user.permissions },
    })
  }

  async function revealEmail() {
    if (!user) return
    setRevealing(true)
    try {
      const result = await api.revealUserEmail(user.id)
      setRevealedEmail(result.email)
      toast({
        title: 'E-mail revelado',
        description: 'A revelação de dados pessoais foi registada em auditoria.',
        variant: 'info',
      })
    } catch (cause: unknown) {
      toast({ title: 'Não foi possível revelar', description: getErrorMessage(cause), variant: 'error' })
    } finally {
      setRevealing(false)
    }
  }

  async function copyId() {
    if (!user) return
    try {
      await navigator.clipboard.writeText(user.id)
      toast({ title: 'Identificador copiado', variant: 'success' })
    } catch {
      toast({ title: 'Não foi possível copiar', variant: 'error' })
    }
  }

  async function saveChanges() {
    if (!user || !draft) return
    setSaving(true)
    try {
      const updated = await api.patchUser(
        user.id,
        {
          role: draft.role,
          status: draft.status,
          permissions: draft.permissions,
        },
        user.version,
      )
      userState.setData(updated)
      setDraft({
        role: updated.role,
        status: updated.status,
        permissions: { ...updated.permissions },
      })
      setBaseVersion(updated.version)
      setConfirmOpen(false)
      toast({
        title: 'Alterações guardadas',
        description: 'Persistidas no servidor e registadas em auditoria.',
        variant: 'success',
      })
      if (session?.id === updated.id && updated.role !== 'Administrador') {
        logout()
        navigate('/admin/entrar', { replace: true })
      } else if (session?.id === updated.id && updated.status === 'Suspenso') {
        logout()
        navigate('/admin/entrar', { replace: true })
      }
    } catch (cause: unknown) {
      setConfirmOpen(false)
      if (isConflict(cause)) {
        const current = getCurrentRecord<UserRecord>(cause)
        setConflict(current)
      } else {
        toast({
          title: 'Não foi possível guardar',
          description: getErrorMessage(cause),
          variant: 'error',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  if (userState.status === 'error') {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="size-4" />} onClick={() => navigate('/admin/utilizadores')}>
          Voltar aos utilizadores
        </Button>
        <ErrorState
          title="Não foi possível carregar o utilizador"
          description={getErrorMessage(userState.error)}
          onRetry={userState.reload}
        />
      </div>
    )
  }

  if (!user || !draft) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="A carregar utilizador">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-72 rounded-card" />
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-card" />
            <Skeleton className="h-40 rounded-card" />
          </div>
        </div>
      </div>
    )
  }

  const isSelf = session?.id === user.id
  const losingAdmin = user.role === 'Administrador' && draft.role === 'Utilizador'
  const selfWarning = isSelf && (losingAdmin || draft.status === 'Suspenso')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/utilizadores"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Utilizadores e permissões
        </Link>
        <div className="flex items-center gap-2">
          {isDirty ? (
            <Chip tone="warning">Alterações por guardar</Chip>
          ) : (
            <Chip tone="muted">Sem alterações</Chip>
          )}
          <Button variant="ghost" size="sm" icon={<Undo2 className="size-4" />} onClick={resetDraft} disabled={!isDirty}>
            Descartar
          </Button>
          <Button
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={!isDirty}
          >
            Guardar alterações
          </Button>
        </div>
      </div>

      <PageHeader
        eyebrow="ADM-01 · Detalhe do utilizador"
        title={user.name}
        description="Perfil, estado, permissões e utilização. As credenciais protegidas não são apresentadas."
      />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={user.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{user.name}</h2>
                  {isSelf ? <Chip tone="outline" size="sm">A sua conta</Chip> : null}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <RoleChip role={user.role} />
                  <UserStatusChip status={user.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted" aria-hidden="true" />
                  <span className="text-ink">
                    {revealedEmail ?? maskEmail(user.email)}
                  </span>
                  {revealedEmail ? (
                    <>
                      <Chip tone="warning" size="sm">Revelação auditada</Chip>
                      <IconButton
                        label="Ocultar e-mail novamente"
                        icon={EyeOff}
                        size="sm"
                        onClick={() => setRevealedEmail(null)}
                      />
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye className="size-3.5" />}
                      loading={revealing}
                      onClick={() => void revealEmail()}
                    >
                      Revelar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3">
                <dt className="text-[10px] uppercase tracking-wide text-muted">Identificador</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className="mono truncate text-sm text-ink">{user.id}</span>
                  <IconButton label="Copiar identificador" icon={Copy} size="sm" onClick={() => void copyId()} />
                </dd>
              </div>
              <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3">
                <dt className="text-[10px] uppercase tracking-wide text-muted">Versão do registo</dt>
                <dd className="mono mt-1 text-sm text-ink">v{user.version}</dd>
              </div>
              <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3">
                <dt className="text-[10px] uppercase tracking-wide text-muted">Criado em</dt>
                <dd className="mt-1 text-sm text-ink">{formatDateTime(user.createdAt)}</dd>
              </div>
              <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3">
                <dt className="text-[10px] uppercase tracking-wide text-muted">Último acesso</dt>
                <dd className="mt-1 text-sm text-ink">{formatDateTime(user.lastAccessAt)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/admin/auditoria?actor=${user.id}`}
                className="inline-flex min-h-10 items-center gap-2 rounded-ctrl border border-line px-3 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
              >
                <History className="size-3.5" aria-hidden="true" />
                Ver auditoria deste utilizador
              </Link>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <UserCog className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Perfil e estado</h2>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Select
                label="Perfil"
                value={draft.role}
                onChange={(event) => {
                  const role = event.target.value as Role
                  setDraft((current) => (current ? { ...current, role } : current))
                }}
                hint="Alterar para Utilizador remove o acesso ao modo Admin."
              >
                <option value="Utilizador">Utilizador</option>
                <option value="Administrador">Administrador</option>
              </Select>
              <div className="rounded-ctrl border border-line bg-surface/40 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium text-ink">Conta activa</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {draft.status === 'Activo' ? 'O utilizador pode iniciar sessão.' : 'Acesso suspenso.'}
                    </p>
                  </div>
                  <Switch
                    label="Conta activa"
                    checked={draft.status === 'Activo'}
                    onChange={(checked) =>
                      setDraft((current) =>
                        current ? { ...current, status: checked ? 'Activo' : 'Suspenso' } : current,
                      )
                    }
                  />
                </div>
              </div>
            </div>
            {user.role === 'Administrador' ? (
              <InlineNote tone="warning" className="mt-4">
                Não é possível retirar o perfil ou suspender o último Administrador activo. O
                servidor bloqueia a operação com uma mensagem explicativa.
              </InlineNote>
            ) : null}
            {selfWarning ? (
              <InlineNote tone="danger" className="mt-3" icon={ShieldAlert}>
                Está a alterar a sua própria conta. Se perder o perfil de Administrador ou ficar
                suspenso, a sessão do modo Admin será terminada.
              </InlineNote>
            ) : null}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Permissões</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              Permissões individuais propostas. As credenciais e preferências são apenas de leitura
              e nunca são editáveis aqui.
            </p>
            <div className="mt-5 space-y-5">
              {permissionGroups.map((group) => (
                <fieldset key={group.title} className="space-y-2">
                  <legend className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {group.title}
                  </legend>
                  {group.ids.map((permissionId) => {
                    const permission = PERMISSIONS.find((item) => item.id === permissionId)
                    if (!permission) return null
                    return (
                      <div
                        key={permission.id}
                        className="flex items-start justify-between gap-4 rounded-ctrl border border-line bg-surface/35 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">{permission.label}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted">
                            {permission.description}
                          </p>
                        </div>
                        <Switch
                          label={permission.label}
                          checked={draft.permissions[permission.id]}
                          onChange={(checked) =>
                            setDraft((current) =>
                              current
                                ? {
                                    ...current,
                                    permissions: { ...current.permissions, [permission.id]: checked },
                                  }
                                : current,
                            )
                          }
                        />
                      </div>
                    )
                  })}
                </fieldset>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold">Utilização da IA no período</h2>
            </div>
            <p className="mt-1 text-xs text-muted">Resumo lido da configuração de quotas (ADM-03).</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3">
                <p className="font-display text-2xl font-semibold">{user.aiRequestsPeriod}</p>
                <p className="text-xs text-muted">pedidos</p>
              </div>
              <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3">
                <p className="font-display text-2xl font-semibold">
                  {formatCurrency(user.aiCostPeriod, 'EUR')}
                </p>
                <p className="text-xs text-muted">custo estimado</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/admin/ia"
                className="inline-flex min-h-10 items-center gap-2 rounded-ctrl border border-line px-3 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                Abrir quotas e custos
              </Link>
              <button
                type="button"
                onClick={userState.reload}
                className="inline-flex min-h-10 items-center gap-2 rounded-ctrl border border-line px-3 text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
              >
                <RotateCw className="size-3.5" aria-hidden="true" />
                Atualizar dados
              </button>
            </div>
          </Card>

          <InlineNote tone="muted" icon={History}>
            Toda a alteração exige confirmação com diferenças e só é considerada concluída após
            persistência e registo de auditoria no servidor.
          </InlineNote>
        </div>
      </div>

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-card/95 p-3 backdrop-blur lg:bottom-4">
        <p className={cn('text-xs', isDirty ? 'text-warning' : 'text-muted')}>
          {isDirty
            ? `${diff.length} alteração${diff.length === 1 ? '' : 'ões'} por guardar`
            : 'Nenhuma alteração por guardar.'}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetDraft} disabled={!isDirty}>
            Descartar
          </Button>
          <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={!isDirty}>
            Guardar alterações
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void saveChanges()}
        title="Confirmar alterações ao utilizador"
        description={`Aplica as alterações a ${user.name}. A resposta de sucesso só é apresentada após persistência e registo de auditoria.`}
        confirmLabel="Aplicar alterações"
        tone={draft.status === 'Suspenso' && user.status !== 'Suspenso' ? 'danger' : 'primary'}
        busy={saving}
        details={diff}
      >
        {selfWarning ? (
          <InlineNote tone="danger" icon={ShieldAlert}>
            Aviso reforçado: está a alterar a sua própria conta e pode perder acesso ao modo Admin.
          </InlineNote>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={conflict !== null}
        onClose={() => setConflict(null)}
        onConfirm={() => {
          if (!conflict) return
          userState.setData(conflict)
          setDraft({
            role: conflict.role,
            status: conflict.status,
            permissions: { ...conflict.permissions },
          })
          setBaseVersion(conflict.version)
          setConflict(null)
          toast({
            title: 'Valores actuais carregados',
            description: 'Reveja as alterações e confirme novamente.',
            variant: 'info',
          })
        }}
        title="Conflito de edição"
        description="Outra sessão alterou este utilizador entretanto. A UI mostra os valores actuais e pede reconfirmação antes de voltar a guardar."
        confirmLabel="Carregar valores actuais"
        tone="primary"
        details={
          conflict
            ? [
                { label: 'Perfil actual', before: null, after: conflict.role },
                { label: 'Estado actual', before: null, after: conflict.status },
                { label: 'Versão actual', before: null, after: `v${conflict.version}` },
              ]
            : []
        }
      />
    </div>
  )
}
