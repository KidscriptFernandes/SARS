import { useEffect, useRef, useState } from 'react'
import { useReducedMotionLocal } from '../lib/useAsyncData'

export function CountUp({
  value,
  format = (current) => String(Math.round(current)),
  duration = 700,
  className,
}: {
  value: number
  format?: (value: number) => string
  duration?: number
  className?: string
}) {
  const reduced = useReducedMotionLocal()
  const [display, setDisplay] = useState(reduced ? value : 0)
  const previous = useRef(reduced ? value : 0)

  useEffect(() => {
    if (reduced) {
      previous.current = value
      setDisplay(value)
      return
    }
    const from = previous.current
    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (value - from) * eased
      setDisplay(current)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        previous.current = value
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, reduced, value])

  return <span className={className}>{format(display)}</span>
}
