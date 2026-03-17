import { Skeleton } from '@/components/ui/Skeleton'
import type { GameDetailSummary } from '@/lib/types'
import { format, parseISO } from 'date-fns'

interface SummaryTabProps {
  summary: GameDetailSummary | undefined
  isLoading: boolean
  error?: Error
}

function LeaderCard({
  tricode,
  leaders,
}: {
  tricode: string
  leaders: GameDetailSummary['homeLeaders']
}) {
  if (!leaders || leaders.length === 0) return null
  const top = leaders[0]
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">
        {tricode} Leader
      </div>
      <div className="text-sm font-semibold text-white">{top.name}</div>
      <div className="text-xs text-slate-500 mb-2">{top.position} · #{top.jerseyNum}</div>
      <div className="flex gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-white tabular-nums">{top.points}</div>
          <div className="text-xs text-slate-500">PTS</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white tabular-nums">{top.rebounds}</div>
          <div className="text-xs text-slate-500">REB</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white tabular-nums">{top.assists}</div>
          <div className="text-xs text-slate-500">AST</div>
        </div>
      </div>
    </div>
  )
}

export function SummaryTab({ summary, isLoading, error }: SummaryTabProps) {
  if (error) {
    return (
      <div className="py-12 text-center text-slate-500">
        <p>Unable to load game summary.</p>
      </div>
    )
  }

  if (isLoading || !summary) {
    return (
      <div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
        <Skeleton className="h-16 rounded-lg" />
      </div>
    )
  }

  const hasLeaders =
    (summary.awayLeaders && summary.awayLeaders.length > 0) ||
    (summary.homeLeaders && summary.homeLeaders.length > 0)

  let lastUpdated = ''
  try {
    lastUpdated = format(parseISO(summary.lastUpdated), 'h:mm:ss a')
  } catch {
    lastUpdated = summary.lastUpdated
  }

  return (
    <div className="space-y-4 py-2">
      {hasLeaders && (
        <>
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Leaders</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LeaderCard tricode={summary.awayTeam.teamTricode} leaders={summary.awayLeaders} />
            <LeaderCard tricode={summary.homeTeam.teamTricode} leaders={summary.homeLeaders} />
          </div>
        </>
      )}

      {!hasLeaders && summary.gameStatus === 1 && (
        <div className="py-12 text-center text-slate-500">
          <p>Game hasn&apos;t started yet.</p>
          <p className="text-xs mt-1">{summary.gameStatusText}</p>
        </div>
      )}

      {!hasLeaders && summary.gameStatus !== 1 && (
        <div className="py-8 text-center text-slate-500 text-sm">
          No leader stats available yet.
        </div>
      )}

      <div className="text-xs text-slate-600 text-right">
        Updated {lastUpdated}
      </div>
    </div>
  )
}
