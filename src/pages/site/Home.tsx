import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BellRing,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronDown,
  CircleAlert,
  Compass,
  Cpu,
  Database,
  DatabaseZap,
  Download,
  Droplets,
  Eye,
  EyeOff,
  FileCheck2,
  Fingerprint,
  Flame,
  FlaskConical,
  Globe2,
  HardDrive,
  KeyRound,
  Layers3,
  Lightbulb,
  LockKeyhole,
  LogIn,
  Map,
  Mountain,
  Quote,
  Satellite,
  Scale,
  ScrollText,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Avatar } from '../../components/ui'
import { RadarVisual } from '../../components/site/RadarVisual'
import { SiteFooter } from '../../components/site/SiteFooter'
import { SiteHeader } from '../../components/site/SiteHeader'

const ease = [0.22, 1, 0.36, 1] as const

const primaryLink =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-ctrl bg-accent px-6 text-[15px] font-semibold text-on-accent transition duration-150 hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)] active:translate-y-0 active:scale-[0.98]'

const secondaryLink =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-ctrl border border-line bg-transparent px-6 text-[15px] font-semibold text-ink transition duration-150 hover:border-accent hover:bg-accent-soft active:scale-[0.98]'

const moduleCards: {
  title: string
  technical: string
  icon: LucideIcon
  description: string
  caveat: string
  tone: string
}[] = [
  {
    title: 'Incêndios',
    technical: 'Wildfires',
    icon: Flame,
    description:
      'Alterações de superfície e variações de retroespalhamento podem indicar vegetação afectada ou solo exposto. A comparação exige aquisições compatíveis e contexto.',
    caveat: 'Uma observação SAR isolada não confirma um incêndio activo.',
    tone: 'border-warning/30 bg-warning/10 text-warning',
  },
  {
    title: 'Zonas húmidas e inundações',
    technical: 'Wetlands / Flooding',
    icon: Droplets,
    description:
      'A extensão de água e a sua variação ao longo do tempo podem ser observadas com radar. A interpretação depende do método e de observações comparáveis.',
    caveat:
      'Água permanente, variação sazonal e possível inundação não são a mesma coisa.',
    tone: 'border-accent/30 bg-accent-soft text-accent',
  },
  {
    title: 'Movimento do terreno',
    technical: 'Ground Movement',
    icon: Mountain,
    description:
      'Produtos InSAR validados permitem estudar deslocamentos com requisitos específicos de aquisição, processamento e documentação do método.',
    caveat:
      'Sem produto validado, aquisições compatíveis e método documentado, não apresentamos valores quantitativos.',
    tone: 'border-success/30 bg-success/10 text-success',
  },
]

const pipeline = [
  {
    icon: DatabaseZap,
    title: 'Consulta / aquisição',
    description:
      'Obter dados da fonte escolhida com licença e condições de acesso verificadas. A ingestão começa aqui, não apenas no upload de ficheiros.',
  },
  {
    icon: FileCheck2,
    title: 'Validação de metadados',
    description:
      'Confirmar órbita, polarização, resolução, geometria e sistema de referência. O que falta fica registado como «não disponível».',
  },
  {
    icon: Map,
    title: 'Preparação geoespacial',
    description:
      'Garantir coerência de grelha, projecção e referências espaciais antes de qualquer processamento.',
  },
  {
    icon: Cpu,
    title: 'Processamento do módulo',
    description:
      'Aplicar o método adequado ao tipo de alteração e ao produto disponível, sem inferir o que os dados não suportam.',
  },
  {
    icon: ShieldCheck,
    title: 'Controlo de qualidade',
    description:
      'Avaliar limitações, qualidade e condições de utilização antes de apresentar resultados a quem decide.',
  },
  {
    icon: HardDrive,
    title: 'Armazenamento e apresentação',
    description:
      'Guardar resultados e metadados com rasto técnico. A interface mostra o que se sabe e o que ainda não se sabe.',
  },
]

const limits = [
  {
    title: 'Incêndios',
    technical: 'Wildfires',
    icon: Flame,
    tone: 'text-warning',
    cannot: 'Não afirmamos «incêndio activo confirmado» a partir de uma observação SAR isolada.',
    does: 'Descrevemos a alteração observada, a origem do produto, o método e a necessidade de confirmação complementar.',
    principle: 'Observação não é confirmação de causa.',
  },
  {
    title: 'Água',
    technical: 'Wetlands / Flooding',
    icon: Droplets,
    tone: 'text-accent',
    cannot:
      'Não atribuímos uma causa definitiva a toda a água detectada, nem tratamos variação sazonal como inundação.',
    does: 'Apresentamos extensão e variação com comparações e método documentado; quando não é possível distinguir, dizemo-lo.',
    principle: 'O contexto temporal é parte da resposta.',
  },
  {
    title: 'Terreno',
    technical: 'Ground Movement',
    icon: Mountain,
    tone: 'text-success',
    cannot:
      'Não mostramos deslocamentos quantitativos sem produto InSAR validado, aquisições compatíveis e método documentado.',
    does: 'Indicamos os requisitos em falta e não estimamos valores para preencher lacunas.',
    principle: 'Sem requisitos, a resposta é «não disponível».',
  },
]

const sources = [
  {
    icon: Satellite,
    title: 'NISAR',
    description:
      'Missão conjunta NASA/ISRO com radares de banda L e S, dedicada à observação de mudanças na terra, gelo, água e vegetação.',
    href: 'https://science.nasa.gov/mission/nisar/',
    label: 'science.nasa.gov',
  },
  {
    icon: Globe2,
    title: 'NASA Earthdata',
    description:
      'Portal da NASA para descoberta e acesso a dados de observação da Terra, incluindo produtos e documentação da missão.',
    href: 'https://www.earthdata.nasa.gov/',
    label: 'earthdata.nasa.gov',
  },
  {
    icon: HardDrive,
    title: 'Alaska Satellite Facility',
    description:
      'Arquivo e distribuição de dados SAR. A ASF é a DAAC responsável pelo arquivo dos dados NISAR.',
    href: 'https://asf.alaska.edu/',
    label: 'asf.alaska.edu',
  },
  {
    icon: DatabaseZap,
    title: 'ISRO Bhoonidhi',
    description:
      'Portal da ISRO para acesso a dados de observação da Terra, incluindo produtos NISAR em banda S.',
    href: 'https://bhoonidhi.nrsc.gov.in/',
    label: 'bhoonidhi.nrsc.gov.in',
  },
]

const glossary = [
  {
    id: 'sar',
    term: 'SAR — Radar de Abertura Sintética',
    definition:
      'Técnica de radar que combina muitos ecos ao longo de um percurso para produzir imagens de alta resolução. Observa de dia e de noite e atravessa nuvens, mas não produz uma fotografia convencional.',
  },
  {
    id: 'nisar',
    term: 'NISAR',
    definition:
      'Missão conjunta da NASA e da ISRO com dois instrumentos de radar, banda L e banda S, para observar mudanças na superfície da Terra.',
  },
  {
    id: 'bandas',
    term: 'Banda L e banda S',
    definition:
      'Duas frequências de radar usadas pela NISAR. A banda L tem comprimento de onda de cerca de 24 cm; a banda S, cerca de 9,4 cm. Frequências diferentes respondem de forma diferente à superfície e à vegetação.',
  },
  {
    id: 'retroespalhamento',
    term: 'Retroespalhamento',
    definition:
      'Parte do sinal de radar que regressa ao sensor. Depende das propriedades da superfície, da geometria de observação e da frequência; por isso, um valor isolado não revela a causa da alteração.',
  },
  {
    id: 'insar',
    term: 'InSAR',
    definition:
      'Interferometria por radar de abertura sintética. Compara a fase de aquisições para estudar deslocamentos, desde que existam produtos, aquisições e método compatíveis.',
  },
  {
    id: 'gcov',
    term: 'GCOV',
    definition:
      'Produto de retroespalhamento calibrado e geocodificado. É útil para comparar a resposta da superfície, mas continua a exigir contexto e interpretação.',
  },
  {
    id: 'polarizacao',
    term: 'Polarização',
    definition:
      'Orientação do campo eléctrico da onda de radar. Combinações como VV, HH ou HV respondem de forma diferente ao tipo de superfície e ajudam a interpretar o sinal.',
  },
  {
    id: 'nao-disponivel',
    term: '«Não disponível»',
    definition:
      'Forma explícita de mostrar que um dado não existe ou não foi validado. Não é zero, não é uma estimativa e não deve ser preenchido por inferência.',
  },
  {
    id: 'ia-explicativa',
    term: 'IA explicativa',
    definition:
      'Camada opcional que traduz contexto técnico para linguagem simples. Apoia a leitura, mas não valida observações, não cria dados e não substitui o método científico.',
  },
]

const privacyCards = [
  {
    icon: Fingerprint,
    title: 'Minimização de dados',
    description:
      'Só é apresentado o necessário. Emails aparecem mascarados por defeito e a revelação é uma acção explícita.',
  },
  {
    icon: ScrollText,
    title: 'Rasto de auditoria',
    description:
      'As escritas administrativas registam o valor anterior e o novo. Exportações e revelações também deixam registo.',
  },
  {
    icon: ShieldCheck,
    title: 'Separação de modos',
    description:
      'O modo Admin é reservado. A permissão é verificada no servidor em cada pedido, não apenas escondida na interface.',
  },
  {
    icon: KeyRound,
    title: 'Segredos protegidos',
    description:
      'A chave do fornecedor de IA existe apenas no servidor. Não há campo de chave no cliente nem na API de administração.',
  },
]

const adminCapabilities = [
  'Utilizadores e permissões',
  'Regras de alerta',
  'Quotas e custos da IA',
  'Auditoria e logs',
  'Ingestão de dados',
]

const teamMembers = [
  { name: 'Orlando Saiombo', role: 'Backend' },
  { name: 'Serbonio', role: 'Backend' },
  { name: 'Filipe Fernandes', role: 'Backend' },
  { name: 'Tomás Rita', role: 'Frontend Lead' },
  { name: 'Dumilde', role: 'Tech Lead' },
]

const downloadStores = [
  { store: 'App Store', platform: 'iOS', devices: 'iPhone · iPad' },
  { store: 'Google Play', platform: 'Android', devices: 'Telefone · Tablet' },
]

export function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-ink">
      <SiteHeader />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <Problem />
        <Solution />
        <Modules />
        <HowItWorks />
        <Limits />
        <Sources />
        <AiLayer />
        <Privacy />
        <ApiArchitecture />
        <Team />
        <DownloadApp />
        <Contact />
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  )
}

function Hero() {
  return (
    <section
      id="inicio"
      aria-labelledby="inicio-title"
      className="relative overflow-hidden pb-16 pt-28 sm:pt-32 md:pb-24"
    >
      <div aria-hidden="true" className="hero-wash pointer-events-none" />

      <div className="shell relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <a
            href="https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border-b border-clay/40 pb-1 text-xs font-medium text-clay transition hover:border-clay hover:text-ink"
          >
            NASA Space Apps Challenge 2026
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>

          <h1
            id="inicio-title"
            className="mt-6 max-w-[12ch] font-editorial text-[44px] font-medium leading-[0.98] tracking-[-0.025em] sm:text-[62px] lg:text-[76px]"
          >
            A Terra muda.
            <span className="block italic text-accent">O radar ajuda a ver.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
            Incêndios, zonas húmidas, inundações e movimento do solo. Traduzimos observações SAR do
            NISAR em leituras claras — com o contexto e a incerteza à vista, sem prometer mais do
            que os dados permitem.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#modulos" className={primaryLink}>
              Explorar os módulos
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
            <a href="#como-funciona" className={secondaryLink}>
              Como funciona
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Satellite className="size-3.5 text-accent" aria-hidden="true" />
              SAR · NISAR
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-accent" aria-hidden="true" />
              Explicações com IA
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
              Limites explícitos
            </span>
          </div>

          <p className="mt-6 flex max-w-lg items-start gap-2 text-[11px] leading-relaxed text-muted/70">
            <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Protótipo de demonstração. Os exemplos são conceptuais e não representam observações
            reais nem prometem alertas operacionais.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12, ease }}
        >
          <RadarVisual />
        </motion.div>
      </div>
    </section>
  )
}

function Problem() {
  const cards = [
    {
      icon: Eye,
      title: 'O sinal não é uma fotografia',
      description:
        'O SAR mede a resposta do radar à superfície. Um pixel brilhante pode significar muita coisa; sem polarização, geometria e método, não é uma conclusão.',
    },
    {
      icon: Layers3,
      title: 'O contexto dispersa-se',
      description:
        'Órbita, resolução, data de aquisição, produto e limitações vivem nos metadados. Quando faltam, a resposta honesta é «não disponível».',
    },
    {
      icon: Scale,
      title: 'A confiança constrói-se',
      description:
        'Alertas e explicações só ajudam se disserem o que foi observado, o que é incerto e o que precisa de validação independente.',
    },
  ]

  return (
    <Section id="problema" className="border-y border-line/60 bg-card/20">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <SectionHeading
            id="problema"
            eyebrow="O problema"
            title="Ver uma alteração não é o mesmo que compreender a sua causa."
            description="A superfície terrestre está sempre a mudar. O radar observa de dia e de noite, através de nuvens, mas os dados exigem contexto técnico e disciplina na interpretação."
          />
          <div className="relative rounded-card border border-line bg-surface/35 p-5 sm:p-6">
            <Quote className="size-6 text-accent" aria-hidden="true" />
            <p className="mt-3 font-display text-lg font-medium leading-snug text-ink">
              Uma observação isolada não confirma um incêndio activo, uma inundação ou a causa de um
              deslocamento.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              O desafio não é apenas mostrar dados. É mostrar o que eles suportam — e o que não
              suportam.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="surface-card glow-hover p-5 sm:p-6">
              <IconTile icon={card.icon} />
              <h3 className="mt-4 text-base font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{card.description}</p>
            </article>
          ))}
        </div>
      </div>
    </Section>
  )
}

function Solution() {
  const cards = [
    {
      icon: Map,
      title: 'Observar com contexto',
      description:
        'Áreas de interesse, aquisições comparáveis e metadados da observação reunidos num percurso legível.',
    },
    {
      icon: Sparkles,
      title: 'Compreender sem exagerar',
      description:
        'Explicações em linguagem simples, apoiadas apenas no contexto validado e nas limitações conhecidas.',
    },
    {
      icon: BellRing,
      title: 'Acompanhar com regras',
      description:
        'Alertas apenas a partir de regras validadas. Cada alteração administrativa fica registada em auditoria.',
    },
  ]

  const journey = [
    { icon: Compass, label: 'Descobrir' },
    { icon: Search, label: 'Consultar' },
    { icon: Lightbulb, label: 'Compreender' },
    { icon: BellRing, label: 'Acompanhar' },
  ]

  return (
    <Section id="solucao">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeading
            id="solucao"
            eyebrow="A solução"
            title="Do pixel a uma leitura responsável."
            description="A aplicação aproxima especialistas e não especialistas do mesmo vocabulário: localização, contexto, incerteza e próximo passo."
          />

          <div className="grid gap-3 sm:grid-cols-3">
            {journey.map((step, index) => (
              <div
                key={step.label}
                className="relative rounded-ctrl border border-line bg-card/60 px-4 py-4"
              >
                <span className="flex size-9 items-center justify-center rounded-ctrl bg-accent-soft text-accent">
                  <step.icon className="size-4" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-semibold">{step.label}</p>
                <p className="mt-1 text-[11px] text-muted/70">Passo {index + 1}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article key={card.title} className="surface-card glow-hover p-5 sm:p-6">
              <IconTile icon={card.icon} />
              <h3 className="mt-4 text-base font-semibold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{card.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-card border border-line bg-surface/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Dois modos, um contrato de confiança: o utilizador explora observações; o administrador
            governa acessos, regras, quotas, auditoria e ingestão.
          </p>
          <Link
            to="/admin"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-accent transition hover:text-accent-hover"
          >
            Explorar o modo Admin
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Section>
  )
}

function Modules() {
  return (
    <Section id="modulos" className="border-y border-line/60 bg-card/20">
      <div className="shell">
        <SectionHeading
          id="modulos"
          eyebrow="Módulos"
          title="Três tipos de mudança. Um mesmo rigor."
          description="Cada módulo tem perguntas próprias e limites próprios. A interface não usa o mesmo argumento para todos."
          align="center"
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {moduleCards.map((module) => (
            <article key={module.title} className="surface-card glow-hover flex flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    'flex size-12 items-center justify-center rounded-ctrl border',
                    module.tone,
                  )}
                >
                  <module.icon className="size-6" aria-hidden="true" />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {module.technical}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{module.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{module.description}</p>
              <div className="mt-4 flex items-start gap-2 rounded-ctrl border border-line bg-surface/40 px-3 py-2.5">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
                <p className="text-[11px] leading-relaxed text-muted">{module.caveat}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-[11px] leading-relaxed text-muted/70">
          Os módulos partilham o mesmo princípio: a observação não fala sozinha. Método, metadados e
          limitações fazem parte do resultado.
        </p>
      </div>
    </Section>
  )
}

function HowItWorks() {
  return (
    <Section id="como-funciona">
      <div className="shell">
        <SectionHeading
          id="como-funciona"
          eyebrow="Como funciona"
          title="Um pipeline explícito, do início ao fim."
          description="A ingestão inclui consulta/aquisição na fonte — não é apenas carregar ficheiros. Cada etapa deixa rasto e pode falhar sem apagar o histórico."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <ol className="space-y-2">
            {pipeline.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-card border border-line bg-card/70 p-4 sm:p-5"
              >
                <div className="flex flex-col items-center">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-ctrl border border-accent/30 bg-accent-soft text-accent">
                    <step.icon className="size-4" aria-hidden="true" />
                  </span>
                  {index < pipeline.length - 1 ? (
                    <span className="mt-2 h-full w-px bg-line" aria-hidden="true" />
                  ) : null}
                </div>
                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono text-[10px] text-muted/60">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-sm font-semibold">{step.title}</h3>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-[13px]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="space-y-4">
            <div className="surface-card p-5 sm:p-6">
              <h3 className="text-sm font-semibold">Princípios do pipeline</h3>
              <ul className="mt-4 space-y-3">
                {[
                  'Fonte e método identificáveis',
                  'Metadados em falta não são estimados',
                  'Controlo de qualidade antes da apresentação',
                  'Progresso, falhas e repetições registados',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-card border border-warning/30 bg-warning/5 p-5">
              <p className="flex items-center gap-2 text-xs font-semibold text-warning">
                <TriangleAlert className="size-4" aria-hidden="true" />
                Quando falta um dado
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                O campo fica como «não disponível». Não preenchemos órbitas, resoluções ou
                deslocamentos por estimativa.
              </p>
            </div>

            <div className="surface-card p-5">
              <p className="text-[11px] leading-relaxed text-muted">
                No modo Admin, o progresso é acompanhado por etapas. Uma tarefa falhada pode ser
                repetida numa nova execução sem alterar a original.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

function Limits() {
  return (
    <Section id="limites" className="border-y border-line/60 bg-card/20">
      <div className="shell">
        <SectionHeading
          id="limites"
          eyebrow="Limites científicos"
          title="O que os dados não nos permitem dizer."
          description="A responsabilidade não está só no que mostramos. Está também no que recusamos afirmar quando a evidência não chega."
          align="center"
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {limits.map((limit) => (
            <article key={limit.title} className="surface-card flex flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className={cn('flex size-10 items-center justify-center rounded-ctrl bg-surface', limit.tone)}>
                    <limit.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{limit.title}</span>
                    <span className="block text-[10px] uppercase tracking-[0.12em] text-muted">
                      {limit.technical}
                    </span>
                  </span>
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-ctrl border border-danger/25 bg-danger/5 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
                    <TriangleAlert className="size-3" aria-hidden="true" />
                    Não afirmamos
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/85">{limit.cannot}</p>
                </div>
                <div className="rounded-ctrl border border-success/25 bg-success/5 px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                    <Check className="size-3" aria-hidden="true" />
                    Fazemos
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/85">{limit.does}</p>
                </div>
              </div>

              <p className="mt-auto pt-4 text-[11px] leading-relaxed text-muted/80">
                {limit.principle}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-card border border-accent/25 bg-accent-soft/50 p-5 sm:p-7">
          <Quote className="size-5 text-accent" aria-hidden="true" />
          <p className="mt-2 max-w-3xl font-display text-xl font-medium leading-snug sm:text-2xl">
            A ausência de dados não é zero. O desconhecido mostra-se como desconhecido.
          </p>
          <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted">
            A IA pode ajudar a explicar uma limitação. Não pode transformá-la em certeza, inventar
            valores em falta ou substituir a validação científica.
          </p>
        </div>
      </div>
    </Section>
  )
}

function Sources() {
  return (
    <Section id="fontes">
      <div className="shell">
        <SectionHeading
          id="fontes"
          eyebrow="Fontes e contexto"
          title="Dados abertos exigem leitura informada."
          description="A aplicação parte de fontes identificáveis. A disponibilidade, a versão do produto e as condições de acesso variam e devem ser verificadas em cada utilização."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {sources.map((source) => (
            <a
              key={source.title}
              href={source.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group surface-card glow-hover flex gap-4 p-5 sm:p-6"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-ctrl border border-accent/25 bg-accent-soft text-accent">
                <source.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold">{source.title}</span>
                  <ArrowUpRight
                    className="size-4 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed text-muted">
                  {source.description}
                </span>
                <span className="mono mt-2 block text-[10px] text-muted/60">{source.label}</span>
              </span>
            </a>
          ))}
        </div>

        <div className="mt-6 rounded-card border border-line bg-surface/30 p-5 text-xs leading-relaxed text-muted">
          A NISAR é uma missão conjunta da NASA e da ISRO. Os dados NISAR são arquivados e
          distribuídos pela ASF DAAC; a ISRO disponibiliza produtos em banda S através do portal
          Bhoonidhi. Verifique sempre a licença, a versão do produto e as limitações antes de
          reutilizar os dados.
        </div>

        <Glossary />
      </div>
    </Section>
  )
}

function Glossary() {
  const [open, setOpen] = useState<string | null>('sar')

  return (
    <div id="glossario" className="mt-14 scroll-mt-24">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-accent" aria-hidden="true" />
        <h3 className="text-lg font-semibold">Glossário essencial</h3>
      </div>
      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
        Termos para ler os dados sem os sobre-interpretar. Abra cada entrada para ver a definição.
      </p>

      <div className="mt-5 divide-y divide-line overflow-hidden rounded-card border border-line bg-card/70">
        {glossary.map((item) => {
          const expanded = open === item.id
          const panelId = `glossary-panel-${item.id}`
          return (
            <div key={item.id}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-surface/40 sm:px-5"
              >
                <span className="text-sm font-medium text-ink">{item.term}</span>
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-muted transition-transform duration-200',
                    expanded && 'rotate-180 text-accent',
                  )}
                  aria-hidden="true"
                />
              </button>
              <div id={panelId} className="grid-rows-collapse" data-open={expanded}>
                <div>
                  <p className="px-4 pb-4 text-sm leading-relaxed text-muted sm:px-5">
                    {item.definition}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AiLayer() {
  const guardrails = [
    {
      icon: Database,
      title: 'Só contexto validado',
      description: 'A resposta é limitada ao que está disponível na observação e nos seus metadados.',
    },
    {
      icon: EyeOff,
      title: 'Sem valores inventados',
      description: 'Se falta um dado, a resposta diz «não disponível». Não preenche lacunas por plausibilidade.',
    },
    {
      icon: KeyRound,
      title: 'Sem chave no cliente',
      description: 'A chave fica no servidor. Fornecedor e modelo permanecem como decisão em aberto.',
    },
  ]

  return (
    <Section id="ia" className="border-y border-line/60 bg-card/20">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div>
            <SectionHeading
              id="ia"
              eyebrow="Explicações com IA"
              title="Uma explicação clara não acrescenta certeza."
              description="A camada de IA é opcional. Ajuda a traduzir contexto técnico, mas não valida observações, não cria dados e não substitui o método científico."
            />

            <div className="mt-7 space-y-3">
              {guardrails.map((guardrail) => (
                <div key={guardrail.title} className="surface-card flex gap-3 p-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-ctrl bg-accent-soft text-accent">
                    <guardrail.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{guardrail.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{guardrail.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted">
              <Link
                to="/admin/ia"
                className="inline-flex items-center gap-1.5 font-semibold text-accent transition hover:text-accent-hover"
              >
                Ver quotas e limites no modo Admin
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
              <span aria-hidden="true">·</span>
              <span>Explicações sujeitas a auditoria.</span>
            </div>
          </div>

          <div className="surface-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Sparkles className="size-4 text-accent" aria-hidden="true" />
                Exemplo conceptual
              </span>
              <span className="rounded-pill border border-line px-2.5 py-1 text-[10px] text-muted">
                Não é uma interação real
              </span>
            </div>

            <div className="mt-5 space-y-3">
              <div className="ml-auto max-w-[92%] rounded-card rounded-br-md border border-accent/25 bg-accent-soft px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                  Pergunta
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink">
                  A variação de água nesta área é sazonal ou pode indicar inundação?
                </p>
              </div>
              <div className="max-w-[94%] rounded-card rounded-bl-md border border-line bg-surface/60 px-4 py-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  <BrainCircuit className="size-3" aria-hidden="true" />
                  Resposta explicativa
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink/90">
                  Os dados disponíveis não permitem distinguir com segurança entre variação sazonal
                  e possível inundação. É necessária uma comparação temporal validada e o método
                  documentado.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-ctrl border border-warning/30 bg-warning/5 px-3 py-2.5">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-muted">
                Fornecedor e modelo de IA: <strong className="text-ink">[A DEFINIR]</strong>. A
                especificação mantém esta escolha em aberto; a chave nunca é exposta ao cliente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

function Privacy() {
  return (
    <Section id="privacidade">
      <div className="shell">
        <SectionHeading
          id="privacidade"
          eyebrow="Confiança e privacidade"
          title="Transparência também é segurança."
          description="A informação sobre pessoas e observações exige limites claros. O modo Admin foi desenhado para deixar rasto, não para esconder acções."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {privacyCards.map((card) => (
            <article key={card.title} className="surface-card glow-hover flex gap-4 p-5 sm:p-6">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-ctrl border border-accent/25 bg-accent-soft text-accent">
                <card.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{card.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-[13px]">
                  {card.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-card border border-line bg-surface/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
            Neste protótipo, os dados são simulados e nenhuma chave real é utilizada. O modelo de
            permissões e auditoria está documentado na especificação.
          </p>
          <Link
            to="/admin"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-accent transition hover:text-accent-hover"
          >
            Ver o modo Admin
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </Section>
  )
}

function ApiArchitecture() {
  return (
    <Section id="api" className="border-y border-line/60 bg-card/20">
      <div className="shell">
        <SectionHeading
          id="api"
          eyebrow="API e arquitectura"
          title="Uma base preparada para evoluir."
          description="O protótipo usa dados simulados, mas separa responsabilidades para permitir trocar a fonte de dados e o fornecedor de IA sem reescrever a experiência."
        />

        <div className="mt-10 grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
          <ArchitectureNode
            icon={Globe2}
            title="Fontes"
            detail="NISAR · Earthdata · ASF · Bhoonidhi"
          />
          <ArchitectureArrow />
          <ArchitectureNode
            icon={Workflow}
            title="Ingestão"
            detail="Aquisição, metadados, QA e armazenamento"
          />
          <ArchitectureArrow />
          <ArchitectureNode icon={Server} title="API" detail="/api/v1 · contrato OpenAPI" />
          <ArchitectureArrow />
          <ArchitectureNode
            icon={Layers3}
            title="Cliente"
            detail="Experiência web e móvel"
          />
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="surface-card p-5 sm:p-6">
            <h3 className="text-sm font-semibold">Modo Utilizador</h3>
            <ul className="mt-3 space-y-2">
              {[
                'Explorar áreas de interesse e observações',
                'Consultar metadados, qualidade e limitações',
                'Pedir explicações sobre contexto validado',
                'Receber alertas gerados por regras validadas',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-muted">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Check className="size-3" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card p-5 sm:p-6">
            <h3 className="text-sm font-semibold">Modo Administrador</h3>
            <p className="mt-1 text-[11px] text-muted">Cinco áreas de governação.</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {adminCapabilities.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 rounded-ctrl border border-line bg-surface/30 px-3 py-2 text-xs leading-relaxed text-ink/85"
                >
                  <Check className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-card border border-line bg-surface/30 p-5 text-xs leading-relaxed text-muted">
          <p className="font-medium text-ink">Contrato da API</p>
          <p className="mt-1">
            O contrato público está previsto em <code className="mono text-accent">/api/v1</code> e
            será documentado com OpenAPI. Esta página não inventa endpoints, parâmetros ou
            respostas; a lista completa de operações faz parte da especificação a publicar.
          </p>
        </div>
      </div>
    </Section>
  )
}

function Team() {
  return (
    <Section id="equipa">
      <div className="shell">
        <SectionHeading
          id="equipa"
          eyebrow="Equipa"
          title="Quem está por trás disto."
          description="Cinco pessoas, três camadas de trabalho: back-end, front-end e liderança técnica. O objectivo é simples — tornar a leitura SAR mais honesta e mais fácil de acompanhar."
        />

        <div className="mt-10 grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
          {teamMembers.map((member, index) => (
            <article
              key={member.name}
              className="flex items-center gap-4 border-b border-line py-5"
            >
              <Avatar name={member.name} size="md" />
              <div className="min-w-0">
                <h3 className="font-editorial text-xl font-semibold leading-tight">
                  {member.name}
                </h3>
                <p className="mt-0.5 text-xs text-muted">{member.role}</p>
              </div>
              <span className="mono ml-auto text-[10px] text-muted/60">
                {String(index + 1).padStart(2, '0')}
              </span>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-card border border-line bg-surface/25 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Desafio «Dancing with the SARs»</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Projecto desenvolvido no contexto do NASA Space Apps Challenge 2026, categoria de
              Ciências da Terra.
            </p>
          </div>
          <a
            href="https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-accent transition hover:text-accent-hover"
          >
            Abrir página do desafio
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-muted/70">
          Nomes confirmados para esta entrega. Contactos individuais e fotografias serão publicados
          apenas com autorização da equipa.
        </p>
      </div>
    </Section>
  )
}

function DownloadApp() {
  return (
    <Section id="download" className="border-y border-line/60 bg-surface/20">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeading
              id="download"
              eyebrow="Aplicação móvel"
              title="A app ainda não está nas lojas."
              description="A primeira versão está a ser preparada com calma. Quando houver links oficiais para a App Store e a Google Play, ficam nesta secção."
            />

            <p className="mt-6 flex max-w-md items-start gap-2 text-xs leading-relaxed text-muted">
              <Download className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              Sem beta fechado, sem APK solto e sem links inventados. Só publicamos quando estiver
              pronto.
            </p>
          </div>

          <div className="rounded-card border border-line bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-editorial text-2xl leading-tight">Quando estiver pronta, fica aqui.</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Estamos a fechar o âmbito e a testar a leitura no terreno antes de abrir os canais
                  de distribuição.
                </p>
              </div>
              <span className="w-fit shrink-0 rounded-pill border border-warning/30 bg-warning/5 px-2.5 py-1 text-[10px] font-medium text-warning">
                Em preparação
              </span>
            </div>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Disponibilidade nas lojas">
              {downloadStores.map((store) => (
                <li
                  key={store.store}
                  className="flex items-center justify-between gap-3 rounded-ctrl border border-line bg-surface/30 px-4 py-3"
                  aria-disabled="true"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{store.store}</span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {store.platform} · {store.devices}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.1em] text-muted/70">
                    Em breve
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
              <p>
                Links oficiais: <span className="mono text-ink">[A DEFINIR]</span>.
              </p>
              <p className="mt-1">Não publicamos instaladores provisórios nem URLs de teste.</p>
            </div>

            <div className="mt-6">
              <a href="#contacto" className={secondaryLink}>
                Falar com a equipa
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

function Contact() {
  return (
    <Section id="contacto" className="pb-24 md:pb-28">
      <div className="shell">
        <div className="relative overflow-hidden rounded-card border border-line bg-card p-6 sm:p-10">
          <div aria-hidden="true" className="panel-wash pointer-events-none" />
          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 font-editorial text-[15px] italic text-accent">
                <span className="h-px w-6 bg-accent/50" aria-hidden="true" />
                Próximo passo
              </p>
              <h2
                id="contacto-title"
                className="mt-4 font-editorial text-[36px] font-medium leading-[1.06] tracking-[-0.015em] sm:text-[46px]"
              >
                Explorar o protótipo.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-[15px]">
                O modo Admin demonstra gestão de utilizadores, regras de alerta, quotas de IA,
                auditoria e ingestão de dados — sempre com dados simulados e limites explícitos.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/admin" className={primaryLink}>
                  <LogIn className="size-4" aria-hidden="true" />
                  Abrir o modo Admin
                </Link>
                <a href="#limites" className={secondaryLink}>
                  Rever os limites
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="rounded-card border border-line bg-bg/55 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Contactos e ligações
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <dt className="text-muted">Equipa</dt>
                  <dd className="text-xs font-medium text-ink">5 elementos</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <dt className="text-muted">Email de contacto</dt>
                  <dd className="mono text-xs text-ink">[A DEFINIR]</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
                  <dt className="text-muted">Aplicação móvel</dt>
                  <dd>
                    <a href="#download" className="text-xs font-medium text-accent transition hover:text-accent-hover">
                      Em preparação
                    </a>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Documentação da API</dt>
                  <dd className="mono text-xs text-ink">[A DEFINIR]</dd>
                </div>
              </dl>
              <p className="mt-4 text-[11px] leading-relaxed text-muted/70">
                As ligações serão publicadas após confirmação. Nenhuma promessa de serviço
                operacional é feita por este protótipo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

function Section({
  id,
  className,
  children,
}: {
  id: string
  className?: string
  children: ReactNode
}) {
  return (
    <motion.section
      id={id}
      aria-labelledby={`${id}-title`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.55, ease }}
      className={cn('section-pad scroll-mt-20', className)}
    >
      {children}
    </motion.section>
  )
}

function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  id: string
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      <p
        className={cn(
          'flex items-center gap-2 font-editorial text-[15px] italic text-accent',
          align === 'center' && 'justify-center',
        )}
      >
        <span className="h-px w-6 bg-accent/50" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2
        id={`${id}-title`}
        className="mt-4 font-editorial text-[34px] font-medium leading-[1.06] tracking-[-0.015em] sm:text-[44px]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  )
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-11 items-center justify-center rounded-ctrl border border-accent/25 bg-accent-soft text-accent">
      <Icon className="size-5" aria-hidden="true" />
    </span>
  )
}

function ArchitectureNode({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon
  title: string
  detail: string
}) {
  return (
    <div className="rounded-card border border-line bg-card p-4 text-center">
      <span className="mx-auto flex size-9 items-center justify-center rounded-ctrl bg-accent-soft text-accent">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-muted">{detail}</p>
    </div>
  )
}

function ArchitectureArrow() {
  return (
    <div className="hidden items-center justify-center md:flex" aria-hidden="true">
      <ArrowRight className="size-4 text-muted/60" />
    </div>
  )
}

function BackToTop() {
  const [visible, setVisible] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 700)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease }}
          onClick={() => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })}
          aria-label="Voltar ao início"
          title="Voltar ao início"
          className="fixed bottom-5 right-5 z-40 flex size-11 items-center justify-center rounded-full border border-accent/30 bg-card/90 text-accent shadow-[var(--shadow-float)] backdrop-blur transition hover:border-accent hover:bg-accent-soft sm:bottom-7 sm:right-7"
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}
