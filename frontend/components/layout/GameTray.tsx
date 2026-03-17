'use client'

import Link from 'next/link'
import { useGameTray } from '@/store/gameTray'
import { cn } from '@/lib/utils'

export function GameTray() {
  const { openGames, removeGame } = useGameTray()

  if (openGames.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <span className="text-xs text-slate-500 font-medium shrink-0 mr-1">Open</span>
          {openGames.map((game) => (
            <div
              key={game.gameId}
              className="flex items-center gap-1.5 shrink-0 group"
            >
              <Link
                href={`/game/${game.gameId}`}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  'bg-slate-800 hover:bg-slate-700 text-slate-200',
                  game.isLive && 'border border-emerald-500/30'
                )}
              >
                {game.isLive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <span className="text-slate-400">{game.awayTricode}</span>
                <span className="font-mono text-xs text-slate-500">
                  {game.awayScore}–{game.homeScore}
                </span>
                <span className="text-slate-400">{game.homeTricode}</span>
              </Link>
              <button
                type="button"
                onClick={() => removeGame(game.gameId)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-slate-400 text-xs px-1"
                aria-label="Remove from tray"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
