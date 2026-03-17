import { GameCard } from './GameCard'
import { Skeleton } from '@/components/ui/Skeleton'
import type { GameSummary } from '@/lib/types'

interface ScoreboardGridProps {
  games: GameSummary[]
  isLoading: boolean
}

function GameCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
      <Skeleton className="h-5 w-20" />
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-8" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-8" />
        </div>
      </div>
    </div>
  )
}

export function ScoreboardGrid({ games, isLoading }: ScoreboardGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-4xl mb-4">🏀</div>
        <p className="text-slate-400 text-lg font-medium">No games today</p>
        <p className="text-slate-600 text-sm mt-1">Try a different date</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {games.map((game) => (
        <GameCard key={game.gameId} game={game} />
      ))}
    </div>
  )
}
