import { AnimatePresence, motion } from 'framer-motion'
import { LogIn, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { BrandMark } from '../BrandMark'
import { ThemeToggle } from '../ThemeToggle'

const navLinks = [
  { href: '#problema', label: 'Problema' },
  { href: '#solucao', label: 'Solução' },
  { href: '#modulos', label: 'Módulos' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#limites', label: 'Limites' },
  { href: '#fontes', label: 'Fontes' },
  { href: '#ia', label: 'IA' },
  { href: '#equipa', label: 'Equipa' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <a href="#conteudo" className="skip-link">
        Saltar para o conteúdo
      </a>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-bg/85 backdrop-blur-xl">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <a href="#inicio" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
            <BrandMark className="size-8" />
            <span className="truncate font-editorial text-[14px] font-semibold tracking-[-0.01em] min-[360px]:text-[15px] sm:text-[17px]">
              Dancing with the SARs
            </span>
          </a>

          <nav aria-label="Navegação principal" className="hidden items-center gap-1 xl:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-ctrl px-2.5 py-2 text-[13px] font-medium text-muted transition duration-150 hover:bg-surface/60 hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              to="/admin"
              className="hidden min-h-10 items-center gap-2 rounded-ctrl border border-line bg-card/60 px-3.5 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent sm:inline-flex"
            >
              <LogIn className="size-3.5" aria-hidden="true" />
              Modo Admin
            </Link>
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              aria-expanded={open}
              aria-controls="site-mobile-menu"
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              className="inline-flex size-10 items-center justify-center rounded-ctrl border border-line text-muted transition hover:text-ink xl:hidden"
            >
              {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              id="site-mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-line bg-bg/95 xl:hidden"
            >
              <nav aria-label="Navegação móvel" className="shell grid gap-1 py-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-ctrl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface/60 hover:text-ink"
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-ctrl bg-accent px-4 text-sm font-semibold text-on-accent',
                  )}
                >
                  <LogIn className="size-4" aria-hidden="true" />
                  Entrar no modo Admin
                </Link>
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>
    </>
  )
}
