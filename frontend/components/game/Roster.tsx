'use client'

import { Skeleton } from '@/components/ui/Skeleton'
import type { BoxScoreResponse, PlayerStats } from '@/lib/types'
import { cn } from '@/lib/utils'

interface RosterProps {
  boxScore: BoxScoreResponse | undefined
  isLoading: boolean
  error?: Error
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'text-emerald-400' },
  INACTIVE: { label: 'Out', color: 'text-red-400' },
  'NOT ACTIVE': { label: 'Out', color: 'text-red-400' },
  DNP: { label: 'DNP', color: 'text-slate-500' },
}

function statusDisplay(status: string) {
  return STATUS_LABELS[status.toUpperCase()] ?? { label: status, color: 'text-slate-500' }
}

function PlayerRow({ player, showStarter }: { player: PlayerStats; showStarter?: boolean }) {
  const isActive = player.status === 'ACTIVE'
  const { label, color } = statusDisplay(player.status)

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
        isActive ? 'hover:bg-slate-800/40' : 'opacity-60'
      )}
    >
      {/* Jersey */}
      <span className="w-6 text-xs text-slate-600 text-right shrink-0 font-mono">
        {player.jerseyNum}
      </span>

      {/* Name + position */}
      <div className="flex-1 min-w-0">
        <span className={cn('text-sm font-medium', isActive ? 'text-slate-200' : 'text-slate-500')}>
          {player.name}
        </span>
        {player.position && (
          <span className="ml-2 text-xs text-slate-600">{player.position}</span>
        )}
        {showStarter && player.starter && isActive && (
          <span className="ml-2 text-[10px] text-amber-500/80 font-medium uppercase tracking-wide">
            Starter
          </span>
        )}
      </div>

      {/* Status / injury reason */}
      <div className="text-right shrink-0">
        {isActive ? (
          <span className={cn('text-xs font-medium', color)}>{label}</span>
        ) : (
          <div>
            <span className={cn('text-xs font-medium', color)}>{label}</span>
            {player.notPlayingReason && (
              <div className="text-[10px] text-slate-600 mt-0.5 max-w-[120px] text-right leading-tight">
                {player.notPlayingReason.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TeamRoster({ tricode, city, name, players }: {
  tricode: string
  city: string
  name: string
  players: PlayerStats[]
}) {
  const starters = players.filter(p => p.starter && p.status === 'ACTIVE')
  const bench = players.filter(p => !p.starter && p.status === 'ACTIVE')
  const unavailable = players.filter(p => p.status !== 'ACTIVE')

  return (
    <div className="flex-1 min-w-0">
      <div className="mb-3">
        <span className="text-sm font-semibold text-slate-200">{city} {name}</span>
        <span className="ml-2 text-xs text-slate-500">{tricode}</span>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        {starters.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-600 bg-slate-900/60">
              Starters
            </div>
            {starters.map(p => <PlayerRow key={p.personId} player={p} />)}
          </>
        )}

        {bench.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-600 bg-slate-900/60 border-t border-slate-800/60">
              Bench
            </div>
            {bench.map(p => <PlayerRow key={p.personId} player={p} />)}
          </>
        )}

        {unavailable.length > 0 && (
          <>
            <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-600 bg-slate-900/60 border-t border-slate-800/60">
              Unavailable
            </div>
            {unavailable.map(p => <PlayerRow key={p.personId} player={p} />)}
          </>
        )}
      </div>
    </div>
  )
}

function SkeletonRoster() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 py-4">
      {[0, 1].map(i => (
        <div key={i} className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="rounded-xl border border-slate-800 overflow-hidden space-y-1 p-2">
            {Array.from({ length: 10 }).map((_, j) => (
              <Skeleton key={j} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Roster({ boxScore, isLoading, error }: RosterProps) {
  if (error) {
    if (error.message === 'game_not_started') {
      return (
        <div className="py-16 text-center text-slate-500">
          <p className="text-slate-400 text-base">Rosters not yet posted</p>
          <p className="text-xs mt-1 text-slate-600">
            Active/inactive lists are typically available ~90 min before tip-off
          </p>
        </div>
      )
    }
    return (
      <div className="py-12 text-center text-slate-500">
        <p>Unable to load roster.</p>
      </div>
    )
  }

  if (isLoading || !boxScore) {
    return <SkeletonRoster />
  }

  const { awayTeam, homeTeam } = boxScore

  return (
    <div className="py-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <TeamRoster
          tricode={awayTeam.teamTricode}
          city={awayTeam.teamCity}
          name={awayTeam.teamName}
          players={awayTeam.players}
        />
        <TeamRoster
          tricode={homeTeam.teamTricode}
          city={homeTeam.teamCity}
          name={homeTeam.teamName}
          players={homeTeam.players}
        />
      </div>
    </div>
  )
}
