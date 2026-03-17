'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { useScoreboard } from '@/hooks/useScoreboard'
import { DateNav } from '@/components/scoreboard/DateNav'
import { FilterChips, type GameFilter } from '@/components/scoreboard/FilterChips'
import { ScoreboardGrid } from '@/components/scoreboard/ScoreboardGrid'
import type { GameSummary } from '@/lib/types'

export default function HomePage() {
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [filter, setFilter] = useState<GameFilter>('all')

  const { scoreboard, isLoading, error, refresh } = useScoreboard(date)

  const counts = useMemo(() => {
    const games = scoreboard?.games ?? []
    return {
      all: games.length,
      live: games.filter((g) => g.isLive).length,
      upcoming: games.filter((g) => g.isScheduled).length,
      final: games.filter((g) => g.isFinal).length,
    }
  }, [scoreboard])

  const filteredGames = useMemo((): GameSummary[] => {
    const games = scoreboard?.games ?? []
    if (filter === 'all') return games
    if (filter === 'live') return games.filter((g) => g.isLive)
    if (filter === 'upcoming') return games.filter((g) => g.isScheduled)
    if (filter === 'final') return games.filter((g) => g.isFinal)
    return games
  }, [scoreboard, filter])

  const hasLiveGames = (scoreboard?.games ?? []).some((g) => g.isLive)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">NBA Scores</h1>
          {hasLiveGames && (
            <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              {counts.live} game{counts.live !== 1 ? 's' : ''} in progress
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <DateNav date={date} onChange={setDate} />
          <button
            type="button"
            onClick={() => refresh()}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 text-sm transition-colors"
            title="Refresh scores"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      {!isLoading && (scoreboard?.games.length ?? 0) > 0 && (
        <div className="mb-4">
          <FilterChips active={filter} onChange={setFilter} counts={counts} />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Unable to load scores — {error.message}.{' '}
          <button type="button" onClick={() => refresh()} className="underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {/* Games grid */}
      <ScoreboardGrid
        games={filteredGames}
        isLoading={isLoading && !scoreboard}
      />
    </div>
  )
}
