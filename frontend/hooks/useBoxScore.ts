import useSWR from 'swr'
import { fetcher, fullBoxscoreUrl } from '@/lib/api'
import type { BoxScoreResponse } from '@/lib/types'

const boxscoreFetcher = (url: string): Promise<BoxScoreResponse> =>
  fetcher<BoxScoreResponse>(url)

export function useBoxScore(gameId: string, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<BoxScoreResponse>(
    enabled && gameId ? fullBoxscoreUrl(gameId) : null,
    boxscoreFetcher,
    {
      refreshInterval: (d: BoxScoreResponse | undefined) => {
        if (!d) return 15_000
        return d.isLive ? 12_000 : 0  // don't poll for final games
      },
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  )

  return { boxScore: data, isLoading, error, refresh: mutate }
}
