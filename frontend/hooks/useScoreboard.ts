import useSWR from 'swr'
import { fetcher, fullScoreboardUrl } from '@/lib/api'
import type { ScoreboardResponse } from '@/lib/types'

const REFRESH_LIVE = 12_000    // 12s when any game is live
const REFRESH_STATIC = 60_000  // 60s when all games final/upcoming

const scoreboardFetcher = (url: string): Promise<ScoreboardResponse> =>
  fetcher<ScoreboardResponse>(url)

export function useScoreboard(date: string) {
  const { data, error, isLoading, mutate } = useSWR<ScoreboardResponse>(
    fullScoreboardUrl(date),
    scoreboardFetcher,
    {
      refreshInterval: (d: ScoreboardResponse | undefined) => {
        if (!d) return REFRESH_LIVE
        const hasLive = d.games.some((g) => g.isLive)
        return hasLive ? REFRESH_LIVE : REFRESH_STATIC
      },
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  )

  return {
    scoreboard: data,
    isLoading,
    error,
    refresh: mutate,
  }
}
