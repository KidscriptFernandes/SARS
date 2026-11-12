import { ArrowUpRight, FlaskConical, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../BrandMark'

const exploreLinks = [
  { href: '#problema', label: 'O problema' },
  { href: '#solucao', label: 'A solução' },
  { href: '#modulos', label: 'Módulos' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#limites', label: 'Limites científicos' },
]

const projectLinks = [
  { href: '#fontes', label: 'Fontes de dados' },
  { href: '#glossario', label: 'Glossário' },
  { href: '#ia', label: 'Explicações com IA' },
  { href: '#api', label: 'API e arquitectura' },
  { href: '#equipa', label: 'Equipa' },
  { href: '#download', label: 'Download da app' },
  { href: '#contacto', label: 'Contacto' },
]

const sourceLinks = [
  { href: 'https://science.nasa.gov/mission/nisar/', label: 'Missão NISAR' },
  { href: 'https://www.earthdata.nasa.gov/', label: 'NASA Earthdata' },
  { href: 'https://asf.alaska.edu/', label: 'Alaska Satellite Facility' },
  { href: 'https://bhoonidhi.nrsc.gov.in/', label: 'ISRO Bhoonidhi' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-card/30">
      <div className="shell py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.8fr_0.9fr]">
          <div>
            <a href="#inicio" className="inline-flex items-center gap-2.5">
              <BrandMark className="size-9" animated={false} />
              <span className="font-editorial text-[17px] font-semibold tracking-[-0.01em]">
                Dancing with the SARs
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Um protótipo que explora como transformar observações SAR da missão NISAR em
              informação geográfica clara, com limites científicos explícitos.
            </p>
            <div className="mt-4 flex items-start gap-2 rounded-ctrl border border-line bg-surface/40 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
              <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <p>
                Demonstração com dados simulados. Nenhum valor apresentado corresponde a uma
                observação NISAR real.
              </p>
            </div>
            <Link
              to="/admin"
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-ctrl border border-line px-3 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
            >
              <LogIn className="size-3.5" aria-hidden="true" />
              Explorar o modo Admin
            </Link>
          </div>

          <FooterColumn title="Explorar" links={exploreLinks} />
          <FooterColumn title="Projecto" links={projectLinks} />

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Fontes</h2>
            <ul className="mt-3 space-y-2">
              {sourceLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[13px] text-ink/85 transition hover:text-accent"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3.5 text-muted" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 rounded-ctrl border border-line px-3 py-2 text-[11px] font-medium text-muted transition hover:border-accent hover:text-accent"
            >
              Desafio NASA Space Apps 2026
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-[11px] text-muted/70 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Dancing with the SARs. Projecto para o NASA Space Apps Challenge 2026.</p>
          <p>Protótipo informativo · Sem promessa de alerta operacional · [A DEFINIR]</p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { href: string; label: string }[]
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-[13px] text-ink/85 transition hover:text-accent"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
