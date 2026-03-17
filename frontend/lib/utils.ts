import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** Parse NBA clock string "PT04M32.00S" → "4:32" */
export function formatClock(clock: string): string {
  if (!clock) return ''
  const match = clock.match(/PT(\d+)M([\d.]+)S/)
  if (!match) return clock
  const mins = parseInt(match[1], 10)
  const secs = Math.floor(parseFloat(match[2]))
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/** "PT04M32.00S" → total seconds */
export function clockToSeconds(clock: string): number {
  if (!clock) return 0
  const match = clock.match(/PT(\d+)M([\d.]+)S/)
  if (!match) return 0
  return parseInt(match[1], 10) * 60 + parseFloat(match[2])
}

/** Parse "PT00M26.00S" → "0:26" */
export function formatGameClock(clock: string): string {
  return formatClock(clock)
}

/** Format percentage to e.g. ".478" */
export function formatPct(pct: number): string {
  if (pct === 0) return '.000'
  return pct.toFixed(3).replace(/^0/, '')
}

/** Format mins from "PT12M30.00S" to "12" */
export function formatMinutes(minutes: string): string {
  if (!minutes) return '0'
  const match = minutes.match(/PT(\d+)M/)
  if (match) return match[1]
  // Already a plain number string
  const n = parseInt(minutes, 10)
  return isNaN(n) ? '0' : String(n)
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function periodLabel(period: number, periodType?: string): string {
  if (periodType === 'OVERTIME' || period > 4) {
    const otNum = period - 4
    return otNum === 1 ? 'OT' : `${otNum}OT`
  }
  return `Q${period}`
}
