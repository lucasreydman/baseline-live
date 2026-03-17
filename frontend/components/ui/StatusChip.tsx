import { cn } from '@/lib/utils'

interface StatusChipProps {
  status: 1 | 2 | 3
  text?: string
  className?: string
}

const CONFIG = {
  1: { label: 'UPCOMING', classes: 'bg-slate-700 text-slate-300' },
  2: { label: 'LIVE', classes: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' },
  3: { label: 'FINAL', classes: 'bg-slate-700/60 text-slate-400' },
}

export function StatusChip({ status, text, className }: StatusChipProps) {
  const cfg = CONFIG[status] ?? CONFIG[1]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase',
        cfg.classes,
        className
      )}
    >
      {status === 2 && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      )}
      {text ?? cfg.label}
    </span>
  )
}
