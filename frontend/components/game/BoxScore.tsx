import { Skeleton } from '@/components/ui/Skeleton'
import { formatMinutes, formatPct } from '@/lib/utils'
import type { BoxScoreResponse, PlayerStats, TeamBoxScore } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BoxScoreProps {
  boxScore: BoxScoreResponse | undefined
  isLoading: boolean
  error?: Error
}

const STAT_COLS = [
  { key: 'minutes', label: 'MIN', align: 'text-left' },
  { key: 'points', label: 'PTS' },
  { key: 'rebounds', label: 'REB' },
  { key: 'assists', label: 'AST' },
  { key: 'steals', label: 'STL' },
  { key: 'blocks', label: 'BLK' },
  { key: 'turnovers', label: 'TO' },
  { key: 'fg', label: 'FG' },
  { key: '3pt', label: '3PT' },
  { key: 'ft', label: 'FT' },
  { key: 'plusMinus', label: '+/-' },
] as const

function formatStat(player: PlayerStats, key: string): string {
  switch (key) {
    case 'minutes': return formatMinutes(player.minutes)
    case 'points': return String(player.points)
    case 'rebounds': return String(player.rebounds)
    case 'assists': return String(player.assists)
    case 'steals': return String(player.steals)
    case 'blocks': return String(player.blocks)
    case 'turnovers': return String(player.turnovers)
    case 'fg': return `${player.fgMade}/${player.fgAttempted}`
    case '3pt': return `${player.threePtMade}/${player.threePtAttempted}`
    case 'ft': return `${player.ftMade}/${player.ftAttempted}`
    case 'plusMinus': return player.personId === 'totals' ? '' : (player.plusMinus > 0 ? `+${player.plusMinus}` : String(player.plusMinus))
    default: return ''
  }
}

function TeamTable({ team }: { team: TeamBoxScore }) {
  const starters = team.players.filter((p) => p.starter && p.status === 'ACTIVE')
  const bench = team.players.filter((p) => !p.starter && p.status === 'ACTIVE')
  const inactive = team.players.filter(
    (p) => p.status !== 'ACTIVE' || (!p.starter && !bench.includes(p))
  )

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">
        {team.teamCity} {team.teamName}
        <span className="ml-2 text-slate-500 font-normal text-xs">{team.teamTricode}</span>
      </h3>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="sticky left-0 bg-slate-900 px-3 py-2.5 text-left text-slate-500 font-medium min-w-[140px]">
                Player
              </th>
              {STAT_COLS.map((col) => (
                <th
                  key={col.key}
                  className="px-2.5 py-2.5 text-right text-slate-500 font-medium whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {starters.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={STAT_COLS.length + 1}
                    className="px-3 py-1.5 text-[10px] text-slate-600 font-medium uppercase tracking-wider bg-slate-900/50 sticky left-0"
                  >
                    Starters
                  </td>
                </tr>
                {starters.map((p) => (
                  <PlayerRow key={p.personId} player={p} />
                ))}
              </>
            )}

            {bench.length > 0 && (
              <>
                <tr>
                  <td
                    colSpan={STAT_COLS.length + 1}
                    className="px-3 py-1.5 text-[10px] text-slate-600 font-medium uppercase tracking-wider bg-slate-900/50 sticky left-0"
                  >
                    Bench
                  </td>
                </tr>
                {bench.map((p) => (
                  <PlayerRow key={p.personId} player={p} />
                ))}
              </>
            )}

            {/* Totals */}
            <tr className="border-t border-slate-800 bg-slate-900/50">
              <td className="sticky left-0 bg-slate-900/80 px-3 py-2 font-semibold text-slate-300">
                Team Totals
              </td>
              {STAT_COLS.map((col) => (
                <td
                  key={col.key}
                  className="px-2.5 py-2 text-right text-slate-300 font-semibold tabular-nums"
                >
                  {formatStat(team.totals, col.key)}
                </td>
              ))}
            </tr>

            {/* Inactive players */}
            {inactive.length > 0 && (
              <tr>
                <td
                  colSpan={STAT_COLS.length + 1}
                  className="px-3 py-2 text-[10px] text-slate-600 sticky left-0 bg-slate-900/30"
                >
                  DNP: {inactive.map((p) => p.nameI + (p.notPlayingReason ? ` (${p.notPlayingReason})` : '')).join(', ')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlayerRow({ player }: { player: PlayerStats }) {
  if (player.status !== 'ACTIVE') return null
  return (
    <tr className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
      <td className="sticky left-0 bg-slate-900 px-3 py-2.5 group-hover:bg-slate-800/30">
        <span className="font-medium text-slate-200">{player.nameI}</span>
        {player.position && (
          <span className="ml-2 text-slate-600">{player.position}</span>
        )}
      </td>
      {STAT_COLS.map((col) => {
        const val = formatStat(player, col.key)
        const isPoints = col.key === 'points'
        const isHighPoints = isPoints && player.points >= 20
        return (
          <td
            key={col.key}
            className={cn(
              'px-2.5 py-2.5 text-right tabular-nums',
              isHighPoints ? 'text-white font-bold' : 'text-slate-400',
              col.key === 'plusMinus' && player.plusMinus > 0 && 'text-emerald-400',
              col.key === 'plusMinus' && player.plusMinus < 0 && 'text-red-400/80',
            )}
          >
            {val}
          </td>
        )
      })}
    </tr>
  )
}

function SkeletonTable() {
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <div className="bg-slate-900 p-3 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    </div>
  )
}

export function BoxScore({ boxScore, isLoading, error }: BoxScoreProps) {
  if (error) {
    return (
      <div className="py-12 text-center text-slate-500">
        <p>Unable to load box score.</p>
      </div>
    )
  }

  if (isLoading || !boxScore) {
    return (
      <div className="space-y-6 py-4">
        <SkeletonTable />
        <SkeletonTable />
      </div>
    )
  }

  return (
    <div className="py-4">
      <TeamTable team={boxScore.awayTeam} />
      <TeamTable team={boxScore.homeTeam} />
    </div>
  )
}
