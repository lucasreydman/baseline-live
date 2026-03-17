import useSWR from 'swr'
import { fetcher, fullPlaybyplayUrl } from '@/lib/api'
import type { PlayByPlayResponse } from '@/lib/types'

const pbpFetcher = (url: string): Promise<PlayByPlayResponse> =>
  fetcher<PlayByPlayResponse>(url)

export function usePlayByPlay(gameId: string, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<PlayByPlayResponse>(
    enabled && gameId ? fullPlaybyplayUrl(gameId) : null,
    pbpFetcher,
    {
      refreshInterval: (d: PlayByPlayResponse | undefined) => {
        if (!d) return 8_000
        return d.gameStatus === 2 ? 6_000 : 0  // only poll during live games
      },
      revalidateOnFocus: false,
      dedupingInterval: 3000,
      keepPreviousData: true,
    }
  )

  return { playByPlay: data, isLoading, error, refresh: mutate }
}
