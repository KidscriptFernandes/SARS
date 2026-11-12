import { motion } from 'framer-motion'
import {
  BellRing,
  DatabaseZap,
  FlaskConical,
  Globe2,
  LayoutDashboard,
  LogOut,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { cn } from '../../lib/utils'
import { BrandMark } from '../BrandMark'
import { ThemeToggle } from '../ThemeToggle'
import { Avatar, Chip, IconButton } from '../ui'

const navItems = [
  { to: '/admin', label: 'Painel', icon: LayoutDashboard, end: true, mobile: true },
  { to: '/admin/utilizadores', label: 'Utilizadores', icon: Users, end: false, mobile: true },
  { to: '/admin/alertas', label: 'Alertas', icon: BellRing, end: false, mobile: true },
  { to: '/admin/ia', label: 'IA', icon: Sparkles, end: false, mobile: true },
  { to: '/admin/auditoria', label: 'Auditoria', icon: ScrollText, end: false, mobile: false },
  { to: '/admin/ingestao', label: 'Dados', icon: DatabaseZap, end: false, mobile: true },
]

export function AdminLayout() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function signOut() {
    logout()
    navigate('/admin/entrar', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <a href="#admin-content" className="skip-link">
        Saltar para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-line bg-card/70 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
          <BrandMark className="size-8" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold leading-tight">
              Dancing with the SARs
            </p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Administração</p>
          </div>
        </div>

        <div className="px-3 pt-5">
          <Chip tone="accent" icon={ShieldCheck} className="w-full justify-center">
            Modo Administrador
          </Chip>
        </div>

        <nav aria-label="Navegação principal de administração" className="mt-4 flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-11 items-center gap-3 rounded-ctrl px-3 text-sm font-medium transition duration-150',
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-surface/70 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="size-[18px]" aria-hidden="true" />
                  <span>{item.label}</span>
                  {isActive ? (
                    <motion.span
                      layoutId="admin-nav-active"
                      className="absolute inset-y-1.5 left-0 w-1 rounded-pill bg-accent"
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-ctrl bg-surface/50 px-3 py-2.5">
            <Avatar name={session?.name ?? '—'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{session?.name}</p>
              <p className="truncate text-[11px] text-muted">Administrador</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-ctrl border border-line text-xs font-medium text-muted transition hover:border-accent hover:text-accent"
            >
              <Globe2 className="size-3.5" aria-hidden="true" />
              Ver site
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-ctrl border border-line text-xs font-medium text-muted transition hover:border-danger/60 hover:text-danger"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sair
            </button>
          </div>
          <p className="flex items-center gap-1.5 px-1 text-[10px] leading-relaxed text-muted/80">
            <FlaskConical className="size-3 shrink-0" aria-hidden="true" />
            Dados simulados para demonstração. Nenhuma chave de IA é exposta.
          </p>
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link to="/admin" className="flex items-center gap-2 lg:hidden">
              <BrandMark className="size-7" animated={false} />
              <span className="font-display text-sm font-semibold">Administração</span>
            </Link>
            <div className="hidden items-center gap-2 text-xs text-muted lg:flex">
              <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
              Sessão de demonstração
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Chip tone="outline" icon={FlaskConical} size="sm" className="hidden sm:inline-flex">
                Dados de demonstração
              </Chip>
              <ThemeToggle />
              <IconButton
                label="Abrir auditoria"
                icon={ScrollText}
                size="sm"
                className="lg:hidden"
                onClick={() => navigate('/admin/auditoria')}
              />
              <button
                type="button"
                onClick={signOut}
                className="inline-flex min-h-10 items-center gap-2 rounded-ctrl border border-line px-3 text-xs font-medium text-muted transition hover:border-danger/60 hover:text-danger"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sair do modo Admin</span>
                <span className="sm:hidden">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <main id="admin-content" className="mx-auto max-w-[1280px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      <nav
        aria-label="Navegação de administração"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 pb-[max(env(safe-area-inset-bottom),8px)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 px-1">
          {navItems
            .filter((item) => item.mobile)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-ctrl px-1 text-[10px] font-medium transition',
                    isActive ? 'text-accent' : 'text-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <motion.span
                        layoutId="admin-bottom-active"
                        className="absolute inset-x-2 inset-y-1 rounded-ctrl bg-accent-soft"
                        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ) : null}
                    <item.icon className="relative size-5" aria-hidden="true" />
                    <span className="relative">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
        </div>
      </nav>
    </div>
  )
}

