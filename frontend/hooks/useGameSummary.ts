import useSWR from 'swr'
import { fetcher, fullGameSummaryUrl } from '@/lib/api'
import type { GameDetailSummary } from '@/lib/types'

const summaryFetcher = (url: string): Promise<GameDetailSummary> =>
  fetcher<GameDetailSummary>(url)

export function useGameSummary(gameId: string) {
  const { data, error, isLoading, mutate } = useSWR<GameDetailSummary>(
    gameId ? fullGameSummaryUrl(gameId) : null,
    summaryFetcher,
    {
      refreshInterval: (d: GameDetailSummary | undefined) => {
        if (!d) return 15_000
        return d.isLive ? 12_000 : 60_000
      },
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  )

  return { summary: data, isLoading, error, refresh: mutate }
}
