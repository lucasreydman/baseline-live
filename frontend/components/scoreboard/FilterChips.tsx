'use client'

import { cn } from '@/lib/utils'

export type GameFilter = 'all' | 'live' | 'upcoming' | 'final'

interface FilterChipsProps {
  active: GameFilter
  onChange: (f: GameFilter) => void
  counts: { all: number; live: number; upcoming: number; final: number }
}

const FILTERS: { value: GameFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'final', label: 'Final' },
]

export function FilterChips({ active, onChange, counts }: FilterChipsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {FILTERS.map(({ value, label }) => {
        const count = counts[value]
        const isActive = active === value
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              isActive
                ? value === 'live'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-700 text-white'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            )}
          >
            {value === 'live' && isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {label}
            {count > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  isActive ? 'bg-white/10' : 'bg-slate-700'
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
