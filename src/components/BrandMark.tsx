import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

export function BrandMark({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={cn('size-9', className)}
      initial={animated ? 'hidden' : false}
      animate="visible"
    >
      <motion.circle
        cx="20"
        cy="20"
        r="16"
        stroke="var(--color-line)"
        strokeWidth="1.5"
        variants={{ hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        cx="20"
        cy="20"
        r="9.5"
        stroke="var(--color-line)"
        strokeWidth="1.5"
        variants={{ hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }}
        transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M5.5 23.5C10 15.5 15.5 27.5 20 21C24.5 14.5 29 20 34.5 13"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        variants={{ hidden: { pathLength: 0, opacity: 0 }, visible: { pathLength: 1, opacity: 1 } }}
        transition={{ duration: 0.7, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        cx="29.5"
        cy="16.5"
        r="2"
        fill="var(--color-accent)"
        variants={{ hidden: { scale: 0, opacity: 0 }, visible: { scale: 1, opacity: 1 } }}
        transition={{ duration: 0.3, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.svg>
  )
}
