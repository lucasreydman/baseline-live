// Typed API fetch helpers

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

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

// Typed SWR fetcher — receives a full URL (used as SWR key), fetches directly
export const fetcher = async <T = unknown>(url: string): Promise<T> => {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' } })
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
