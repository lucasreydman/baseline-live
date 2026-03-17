// Typed API fetch helpers

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    let message = `API error ${res.status}`
    try {
      const body = await res.json()
      if (body?.detail) message = body.detail
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

export function scoreboardUrl(date: string) {
  return `/api/scoreboard?date=${date}`
}

export function gameSummaryUrl(gameId: string) {
  return `/api/game/${gameId}/summary`
}

export function boxscoreUrl(gameId: string) {
  return `/api/game/${gameId}/boxscore`
}

export function playbyplayUrl(gameId: string) {
  return `/api/game/${gameId}/playbyplay`
}

// Typed SWR fetcher — cast T at each call site via useSWR<T>
export const fetcher = <T = unknown>(path: string): Promise<T> => apiFetch<T>(path)

// Full URLs for use with SWR keys
export function fullScoreboardUrl(date: string) {
  return `${API_BASE}${scoreboardUrl(date)}`
}

export function fullGameSummaryUrl(gameId: string) {
  return `${API_BASE}${gameSummaryUrl(gameId)}`
}

export function fullBoxscoreUrl(gameId: string) {
  return `${API_BASE}${boxscoreUrl(gameId)}`
}

export function fullPlaybyplayUrl(gameId: string) {
  return `${API_BASE}${playbyplayUrl(gameId)}`
}
