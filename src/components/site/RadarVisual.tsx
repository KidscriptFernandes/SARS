import { motion, useReducedMotion } from 'framer-motion'
import { Radio, Satellite } from 'lucide-react'

const signals = [
  { top: '24%', left: '31%', delay: '0s' },
  { top: '62%', left: '23%', delay: '1.1s' },
  { top: '69%', left: '68%', delay: '2.1s' },
  { top: '37%', left: '73%', delay: '3.2s' },
]

export function RadarVisual() {
  const reduced = useReducedMotion()

  return (
    <figure className="relative mx-auto w-full max-w-[560px]">
      <div className="relative aspect-square overflow-hidden rounded-[20px] border border-line bg-card/70 p-4 shadow-[var(--shadow-card)]">
        <div aria-hidden="true" className="absolute inset-0 hero-wash opacity-80" />
        <div aria-hidden="true" className="radar-grid absolute inset-0 opacity-80" />

        <div aria-hidden="true" className="absolute inset-4 rounded-full border border-line/80" />
        <div aria-hidden="true" className="absolute inset-[12%] rounded-full border border-line/70" />
        <div aria-hidden="true" className="absolute inset-[22%] rounded-full border border-line/60" />
        <div aria-hidden="true" className="absolute inset-[34%] rounded-full border border-accent/20" />
        <div aria-hidden="true" className="radar-spokes absolute inset-4 rounded-full opacity-40" />
        <div aria-hidden="true" className="absolute inset-4 rounded-full radar-sweep opacity-60" />

        <div aria-hidden="true" className="absolute inset-x-[10%] top-1/2 h-px bg-line/40" />
        <div aria-hidden="true" className="absolute inset-y-[10%] left-1/2 w-px bg-line/40" />
        <div aria-hidden="true" className="absolute inset-x-[22%] top-[20%] h-px bg-line/20" />
        <div aria-hidden="true" className="absolute inset-x-[22%] bottom-[20%] h-px bg-line/20" />

        <motion.div
          aria-hidden="true"
          className="absolute inset-[7%]"
          animate={reduced ? undefined : { rotate: 360 }}
          transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
        >
          <span className="absolute left-1/2 top-0 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent/40 bg-bg text-accent shadow-[var(--shadow-accent)]">
            <Satellite className="size-4" />
          </span>
          <span className="absolute right-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-accent/70" />
          <span className="absolute bottom-[14%] left-[14%] size-1 rounded-full bg-accent/50" />
        </motion.div>

        {signals.map((signal, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="absolute"
            style={{ top: signal.top, left: signal.left }}
          >
            <span className="relative flex size-2">
              <span
                className="absolute inline-flex size-full animate-ping-soft rounded-full bg-accent/60"
                style={{ animationDelay: signal.delay }}
              />
              <span className="relative inline-flex size-2 rounded-full border border-bg bg-accent" />
            </span>
          </span>
        ))}

        <div className="absolute left-1/2 top-1/2 w-[52%] max-w-[230px] -translate-x-1/2 -translate-y-1/2 rounded-card border border-accent/25 bg-bg/90 px-4 py-4 text-center shadow-[var(--shadow-float)] backdrop-blur">
          <Radio className="mx-auto size-5 text-accent" aria-hidden="true" />
          <p className="mt-2 font-display text-base font-semibold leading-none">NISAR</p>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-muted">
            SAR · L-band + S-band
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <span className="h-px w-6 bg-accent/50" aria-hidden="true" />
            <span className="size-1 rounded-full bg-accent" aria-hidden="true" />
            <span className="h-px w-6 bg-accent/50" aria-hidden="true" />
          </div>
        </div>

        <div className="absolute left-5 top-6 hidden rounded-pill border border-line bg-bg/75 px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted backdrop-blur sm:block">
          retroespalhamento
        </div>
        <div className="absolute bottom-7 right-5 hidden rounded-pill border border-line bg-bg/75 px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted backdrop-blur sm:block">
          fase · InSAR
        </div>
        <div className="absolute bottom-6 left-6 hidden rounded-pill border border-accent/25 bg-accent-soft px-3 py-1.5 text-[10px] uppercase tracking-wide text-accent backdrop-blur sm:block">
          observação
        </div>
      </div>
      <figcaption className="mx-auto mt-3 max-w-md text-center text-[11px] leading-relaxed text-muted/70">
        Ilustração conceptual. O radar não produz uma fotografia convencional e esta imagem não
        representa uma observação real.
      </figcaption>
    </figure>
  )
}
