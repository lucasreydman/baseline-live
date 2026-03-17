'use client'

import { format, addDays, subDays, parseISO } from 'date-fns'

interface DateNavProps {
  date: string  // YYYY-MM-DD
  onChange: (date: string) => void
}

export function DateNav({ date, onChange }: DateNavProps) {
  const parsed = parseISO(date)
  const today = format(new Date(), 'yyyy-MM-dd')
  const isToday = date === today

  const prev = () => onChange(format(subDays(parsed, 1), 'yyyy-MM-dd'))
  const next = () => onChange(format(addDays(parsed, 1), 'yyyy-MM-dd'))
  const goToday = () => onChange(today)

  const displayDate = isToday ? 'Today' : format(parsed, 'EEE, MMM d')

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={prev}
        className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-sm"
        aria-label="Previous day"
      >
        ‹
      </button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white min-w-[100px] text-center">
          {displayDate}
        </span>
        {!isToday && (
          <button
            onClick={goToday}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={next}
        className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-sm"
        aria-label="Next day"
      >
        ›
      </button>

      <input
        type="date"
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs px-2 focus:outline-none focus:border-emerald-500 [color-scheme:dark]"
        aria-label="Pick a date"
      />
    </div>
  )
}
