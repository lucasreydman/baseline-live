'use client'

import { useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatClock, periodLabel } from '@/lib/utils'
import type { PlayByPlayResponse, PlayEvent } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PlayByPlayProps {
  playByPlay: PlayByPlayResponse | undefined
  isLoading: boolean
  error?: Error
}

function EventRow({ play }: { play: PlayEvent }) {
  const isScore = play.isScoreChange
  const hasScore = play.scoreHome !== '' && play.scoreAway !== ''
  const clock = formatClock(play.clock)

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
        isScore ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
      )}
    >
      {/* Clock */}
      <div className="shrink-0 text-right w-16">
        <div className="text-xs font-mono text-slate-500">{clock}</div>
      </div>

      {/* Team badge */}
      <div className="shrink-0 w-8">
        {play.teamTricode ? (
          <span className="text-xs font-bold text-slate-400">{play.teamTricode}</span>
        ) : null}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'leading-snug',
            isScore ? 'text-white' : 'text-slate-400',
            !play.description && 'text-slate-600 italic'
          )}
        >
          {play.description || play.actionType}
        </span>
      </div>

      {/* Score */}
      {hasScore && isScore && (
        <div className="shrink-0 text-right">
          <span className="text-xs font-mono font-semibold text-slate-300">
            {play.scoreAway}–{play.scoreHome}
          </span>
        </div>
      )}
    </div>
  )
}

function PeriodDivider({ period, periodType }: { period: number; periodType: string }) {
  return (
    <div className="flex items-center gap-3 py-2 my-1">
      <div className="flex-1 h-px bg-slate-800" />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {periodLabel(period, periodType)}
      </span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  )
}

export function PlayByPlay({ playByPlay, isLoading, error }: PlayByPlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)
  const isLive = playByPlay?.gameStatus === 2

  // Auto-scroll to latest play (bottom) when new plays arrive during live game
  useEffect(() => {
    if (!playByPlay || !isLive) return
    const newCount = playByPlay.plays.length
    if (newCount > prevCountRef.current) {
      prevCountRef.current = newCount
      // Only auto-scroll if user is near bottom
      const container = containerRef.current
      if (!container) return
      const nearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 200
      if (nearBottom) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [playByPlay, isLive])

  if (error) {
    return (
      <div className="py-12 text-center text-slate-500">
        <p>Unable to load play-by-play.</p>
      </div>
    )
  }

  if (isLoading || !playByPlay) {
    return (
      <div className="space-y-2 py-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (playByPlay.plays.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500">
        <p>Play-by-play not available yet.</p>
      </div>
    )
  }

  // Group plays by period
  const byPeriod: Map<number, { plays: PlayEvent[]; periodType: string }> = new Map()
  for (const play of playByPlay.plays) {
    if (!byPeriod.has(play.period)) {
      byPeriod.set(play.period, { plays: [], periodType: play.periodType })
    }
    byPeriod.get(play.period)!.plays.push(play)
  }

  const periods = Array.from(byPeriod.entries()).sort(([a], [b]) => a - b)

  return (
    <div className="py-2">
      {isLive && (
        <div className="flex items-center gap-2 mb-3 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live — updating automatically
        </div>
      )}

      <div
        ref={containerRef}
        className="space-y-0.5 max-h-[600px] overflow-y-auto pr-1"
      >
        {periods.map(([period, { plays, periodType }]) => (
          <div key={period}>
            <PeriodDivider period={period} periodType={periodType} />
            {plays.map((play) => (
              <EventRow key={play.actionNumber} play={play} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
