'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { useGameTray } from '@/store/gameTray'
import { StatusChip } from '@/components/ui/StatusChip'
import { formatClock, periodLabel } from '@/lib/utils'
import type { GameSummary } from '@/lib/types'

interface GameCardProps {
  game: GameSummary
}

export function GameCard({ game }: GameCardProps) {
  const { addGame, removeGame, hasGame } = useGameTray()
  const inTray = hasGame(game.gameId)

  const { homeTeam: home, awayTeam: away } = game

  let clockDisplay = ''
  if (game.isLive && game.period > 0) {
    const clock = formatClock(game.gameClock)
    clockDisplay = clock
      ? `${periodLabel(game.period)} ${clock}`
      : periodLabel(game.period)
  }

  let timeDisplay = ''
  if (game.isScheduled && game.gameTimeUTC) {
    try {
      timeDisplay = format(parseISO(game.gameTimeUTC), 'h:mm a')
    } catch {
      timeDisplay = game.gameStatusText
    }
  }

  function handleTrayToggle(e: React.MouseEvent) {
    e.preventDefault()
    if (inTray) {
      removeGame(game.gameId)
    } else {
      addGame({
        gameId: game.gameId,
        homeTricode: home.teamTricode,
        awayTricode: away.teamTricode,
        homeScore: home.score,
        awayScore: away.score,
        statusText: game.gameStatusText,
        isLive: game.isLive,
      })
    }
  }

  return (
    <Link href={`/game/${game.gameId}`} className="group block">
      <div className="relative rounded-xl border border-slate-800 bg-slate-900 p-4 transition-all hover:border-slate-700 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-black/20">
        {/* Status + clock */}
        <div className="flex items-center justify-between mb-3">
          <StatusChip
            status={game.gameStatus}
            text={
              game.isLive
                ? clockDisplay || 'LIVE'
                : game.isFinal
                ? 'Final'
                : timeDisplay || game.gameStatusText
            }
          />
          <button
            type="button"
            onClick={handleTrayToggle}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-500 hover:text-slate-300 rounded px-2 py-0.5 bg-slate-800 hover:bg-slate-700"
            title={inTray ? 'Remove from tray' : 'Add to tray'}
          >
            {inTray ? '− Tray' : '+ Tray'}
          </button>
        </div>

        {/* Teams + scores */}
        <div className="space-y-2.5">
          {/* Away */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 text-sm font-bold text-slate-300 tracking-wide">
                {away.teamTricode}
              </span>
              <span className="text-xs text-slate-500">
                {away.wins}–{away.losses}
              </span>
            </div>
            <span
              className={`text-xl font-bold tabular-nums ${
                game.isFinal && away.score > home.score
                  ? 'text-white'
                  : game.isFinal
                  ? 'text-slate-500'
                  : 'text-white'
              }`}
            >
              {game.isScheduled ? '—' : away.score}
            </span>
          </div>

          {/* Home */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 text-sm font-bold text-slate-300 tracking-wide">
                {home.teamTricode}
              </span>
              <span className="text-xs text-slate-500">
                {home.wins}–{home.losses}
              </span>
            </div>
            <span
              className={`text-xl font-bold tabular-nums ${
                game.isFinal && home.score > away.score
                  ? 'text-white'
                  : game.isFinal
                  ? 'text-slate-500'
                  : 'text-white'
              }`}
            >
              {game.isScheduled ? '—' : home.score}
            </span>
          </div>
        </div>

        {/* Arena */}
        {game.arenaName && (
          <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-600">
            {game.arenaName}{game.arenaCity ? `, ${game.arenaCity}` : ''}
          </div>
        )}
      </div>
    </Link>
  )
}
