'use client'

import Link from 'next/link'
import { StatusChip } from '@/components/ui/StatusChip'
import { formatClock, periodLabel } from '@/lib/utils'
import type { GameDetailSummary } from '@/lib/types'

interface GameHeaderProps {
  summary: GameDetailSummary
}

export function GameHeader({ summary }: GameHeaderProps) {
  const { homeTeam: home, awayTeam: away } = summary

  const clockDisplay = summary.isLive && summary.period > 0
    ? [periodLabel(summary.period), formatClock(summary.gameClock)].filter(Boolean).join(' ')
    : null

  return (
    <div className="bg-slate-900 border-b border-slate-800">
      <div className="mx-auto max-w-5xl px-4 py-5">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-4"
        >
          ← All Games
        </Link>

        <div className="flex items-center gap-4">
          {/* Away team */}
          <div className="flex-1 text-right">
            <div className="text-2xl font-bold text-slate-200">{away.teamTricode}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {away.teamCity} {away.teamName}
            </div>
            <div className="text-xs text-slate-600">{away.wins}–{away.losses}</div>
          </div>

          {/* Score + status */}
          <div className="text-center px-4 shrink-0">
            {summary.gameStatus === 1 ? (
              <div className="text-slate-500 text-sm">{summary.gameStatusText}</div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold tabular-nums text-white">
                  {away.score}
                </span>
                <span className="text-slate-600 text-2xl">–</span>
                <span className="text-4xl font-bold tabular-nums text-white">
                  {home.score}
                </span>
              </div>
            )}
            <div className="mt-2 flex flex-col items-center gap-1">
              <StatusChip
                status={summary.gameStatus}
                text={
                  summary.isLive
                    ? clockDisplay || 'LIVE'
                    : summary.isFinal
                    ? 'Final'
                    : summary.gameStatusText
                }
              />
              {summary.arenaName && (
                <span className="text-xs text-slate-600">
                  {summary.arenaName}
                  {summary.arenaCity ? `, ${summary.arenaCity}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Home team */}
          <div className="flex-1 text-left">
            <div className="text-2xl font-bold text-slate-200">{home.teamTricode}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {home.teamCity} {home.teamName}
            </div>
            <div className="text-xs text-slate-600">{home.wins}–{home.losses}</div>
          </div>
        </div>

        {/* Quarter scores */}
        {summary.periodScores.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="mx-auto text-xs text-center border-collapse">
              <thead>
                <tr>
                  <th className="px-3 py-1 text-slate-500 font-normal w-16 text-left">Team</th>
                  {summary.periodScores.map((ps) => (
                    <th key={ps.period} className="px-3 py-1 text-slate-500 font-normal w-8">
                      {periodLabel(ps.period, ps.periodType)}
                    </th>
                  ))}
                  <th className="px-3 py-1 text-slate-400 font-semibold w-8">T</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-1 text-slate-400 font-semibold text-left">{away.teamTricode}</td>
                  {summary.periodScores.map((ps) => (
                    <td key={ps.period} className="px-3 py-1 text-slate-300 tabular-nums">
                      {ps.awayScore}
                    </td>
                  ))}
                  <td className="px-3 py-1 text-white font-bold tabular-nums">{away.score}</td>
                </tr>
                <tr>
                  <td className="px-3 py-1 text-slate-400 font-semibold text-left">{home.teamTricode}</td>
                  {summary.periodScores.map((ps) => (
                    <td key={ps.period} className="px-3 py-1 text-slate-300 tabular-nums">
                      {ps.homeScore}
                    </td>
                  ))}
                  <td className="px-3 py-1 text-white font-bold tabular-nums">{home.score}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
