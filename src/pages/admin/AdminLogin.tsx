import {
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { BrandMark } from '../../components/BrandMark'
import { ThemeToggle } from '../../components/ThemeToggle'
import { Button, Card, Chip } from '../../components/ui'

export function AdminLogin() {
  const { session, login } = useAuth()
  const navigate = useNavigate()

  if (session?.role === 'Administrador') {
    return <Navigate to="/admin" replace />
  }

  function enter(role: 'Administrador' | 'Utilizador') {
    login(role)
    navigate('/admin', { replace: true })
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg px-5 py-8 text-ink sm:py-12">
      <div aria-hidden="true" className="hero-wash pointer-events-none" />
      <div aria-hidden="true" className="graph-grid pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <BrandMark className="size-8" />
            <span className="hidden truncate font-display text-sm font-semibold sm:inline">
              Dancing with the SARs
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              aria-label="Voltar ao site"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-accent"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Voltar ao site</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="relative overflow-hidden p-6 sm:p-9">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/5 blur-3xl"
            />
            <div className="relative space-y-5">
              <Chip tone="accent" icon={ShieldCheck}>
                Modo Administrador
              </Chip>
              <div className="space-y-3">
                <h1 className="text-[32px] font-semibold leading-[1.08] sm:text-[42px]">
                  Administração
                </h1>
                <p className="max-w-md text-sm leading-relaxed text-muted sm:text-[15px]">
                  Gestão de utilizadores, regras de alerta, quotas da IA, auditoria e ingestão de
                  dados SAR. Apenas o actor Administrador tem acesso a estas cinco áreas.
                </p>
              </div>
              <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
                {[
                  'Utilizadores e permissões',
                  'Regras de alerta',
                  'Quotas e custos da IA',
                  'Auditoria e logs',
                  'Ingestão de dados',
                ].map((item) => (
                  <p key={item} className="flex items-start gap-2 text-sm text-ink/90">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    {item}
                  </p>
                ))}
              </div>
              <div className="flex items-start gap-2.5 rounded-ctrl border border-line bg-surface/50 px-4 py-3 text-xs leading-relaxed text-muted">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                <p>
                  A permissão é verificada no servidor em cada pedido. A chave do fornecedor de IA
                  nunca é apresentada, editável ou devolvida pela API.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                Sessão de demonstração
              </p>
              <h2 className="text-xl font-semibold">Escolha um perfil</h2>
              <p className="text-sm leading-relaxed text-muted">
                A autenticação real está fora do âmbito desta especificação. Use uma sessão de
                demonstração para explorar o modo Admin e o bloqueio de acesso.
              </p>
            </div>

            {session ? (
              <div className="mt-4 rounded-ctrl border border-line bg-surface/50 px-4 py-3 text-xs text-muted">
                Sessão actual: <span className="text-ink">{session.name}</span> · {session.role}
              </div>
            ) : null}

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => enter('Administrador')}
                className="group flex w-full items-start gap-4 rounded-card border border-accent/40 bg-accent-soft p-4 text-left transition duration-150 hover:border-accent hover:bg-accent/15"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">Entrar como Administrador</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    Acede ao Painel e aos cinco casos de uso de administração.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => enter('Utilizador')}
                className="group flex w-full items-start gap-4 rounded-card border border-line bg-surface/40 p-4 text-left transition duration-150 hover:border-line hover:bg-surface/70"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">Entrar como Utilizador</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    Demonstra o ecrã 403: a navegação Admin não é apresentada.
                  </span>
                </span>
              </button>
            </div>

            <div className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-muted/80">
              <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <p>
                Sessões, dados e métricas são simulados. Nenhum valor apresentado representa dados
                reais da missão NISAR.
              </p>
            </div>

            <Button
              variant="secondary"
              className="mt-6 w-full"
              icon={<ArrowLeft className="size-4" aria-hidden="true" />}
              onClick={() => navigate('/')}
            >
              Voltar à página informativa
            </Button>
          </Card>
        </div>
      </div>
    </main>
  )
}
