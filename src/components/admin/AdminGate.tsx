import { ArrowLeft, LockKeyhole, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { BrandMark } from '../BrandMark'
import { Button, Chip } from '../ui'

export function AdminGate({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!session) {
    return <Navigate to="/admin/entrar" replace state={{ from: location.pathname }} />
  }

  if (session.role !== 'Administrador') {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-5 py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_20%,rgba(242,103,122,0.07),transparent_70%)]"
        />
        <div className="relative w-full max-w-lg space-y-6 rounded-card border border-line bg-card p-6 text-center shadow-[var(--shadow-card)] sm:p-10">
          <div className="flex justify-center">
            <span className="flex size-16 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">
              <LockKeyhole className="size-7" aria-hidden="true" />
            </span>
          </div>
          <div className="space-y-2">
            <Chip tone="danger">403 · Acesso negado</Chip>
            <h1 className="text-[28px] font-semibold">Esta área é reservada a administradores</h1>
            <p className="text-sm leading-relaxed text-muted">
              A sessão actual pertence ao perfil <strong className="text-ink">Utilizador</strong>. A
              permissão é verificada no servidor em cada pedido; esconder a navegação não substitui
              essa verificação.
            </p>
          </div>
          <div className="rounded-ctrl border border-line bg-surface/50 px-4 py-3 text-left text-xs leading-relaxed text-muted">
            <p>
              Sessão: <span className="text-ink">{session.name}</span>
            </p>
            <p className="mono mt-1">{session.email}</p>
          </div>
          <div className="flex flex-col justify-center gap-2 sm:flex-row">
            <Button
              variant="primary"
              icon={<LogOut className="size-4" aria-hidden="true" />}
              onClick={() => {
                logout()
                navigate('/admin/entrar', { replace: true })
              }}
            >
              Terminar sessão
            </Button>
            <Button
              variant="secondary"
              icon={<ArrowLeft className="size-4" aria-hidden="true" />}
              onClick={() => navigate('/')}
            >
              Voltar ao site
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted">
            <BrandMark className="size-5" animated={false} />
            Dancing with the SARs
          </div>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
