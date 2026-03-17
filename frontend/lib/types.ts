// Shared TypeScript types — mirrors backend Pydantic schemas

export interface TeamScore {
  teamId: string
  teamName: string
  teamCity: string
  teamTricode: string
  score: number
  wins: number
  losses: number
}

export interface GameSummary {
  gameId: string
  gameCode: string
  gameStatus: 1 | 2 | 3   // 1=scheduled, 2=live, 3=final
  gameStatusText: string
  period: number
  gameClock: string
  gameTimeUTC: string
  arenaName: string
  arenaCity: string
  homeTeam: TeamScore
  awayTeam: TeamScore
  isLive: boolean
  isFinal: boolean
  isScheduled: boolean
}

export interface ScoreboardResponse {
  date: string
  games: GameSummary[]
}

// Game detail summary
export interface PeriodScore {
  period: number
  periodType: string
  homeScore: number
  awayScore: number
}

export interface TeamLeader {
  personId: string
  name: string
  jerseyNum: string
  position: string
  points: number
  rebounds: number
  assists: number
}

export interface GameDetailSummary {
  gameId: string
  gameStatus: 1 | 2 | 3
  gameStatusText: string
  period: number
  gameClock: string
  gameTimeUTC: string
  arenaName: string
  arenaCity: string
  homeTeam: TeamScore
  awayTeam: TeamScore
  periodScores: PeriodScore[]
  homeLeaders: TeamLeader[] | null
  awayLeaders: TeamLeader[] | null
  isLive: boolean
  isFinal: boolean
  lastUpdated: string
}

// Box score
export interface PlayerStats {
  personId: string
  name: string
  nameI: string
  jerseyNum: string
  position: string
  starter: boolean
  status: string
  notPlayingReason: string | null
  minutes: string
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
  turnovers: number
  fgMade: number
  fgAttempted: number
  fgPct: number
  threePtMade: number
  threePtAttempted: number
  threePtPct: number
  ftMade: number
  ftAttempted: number
  ftPct: number
  plusMinus: number
}

export interface TeamBoxScore {
  teamId: string
  teamName: string
  teamCity: string
  teamTricode: string
  score: number
  players: PlayerStats[]
  totals: PlayerStats
}

export interface BoxScoreResponse {
  gameId: string
  gameStatus: 1 | 2 | 3
  gameStatusText: string
  period: number
  gameClock: string
  homeTeam: TeamBoxScore
  awayTeam: TeamBoxScore
  isLive: boolean
  lastUpdated: string
}

// Play by play
export interface PlayEvent {
  actionNumber: number
  clock: string
  timeActual: string
  period: number
  periodType: string
  teamId: string | null
  teamTricode: string | null
  actionType: string
  subType: string | null
  description: string
  scoreHome: string
  scoreAway: string
  isScoreChange: boolean
  personId: string | null
  playerName: string | null
  playerNameI: string | null
}

export interface PlayByPlayResponse {
  gameId: string
  gameStatus: 1 | 2 | 3
  period: number
  plays: PlayEvent[]
  lastUpdated: string
}

// Open game tray item (stored in localStorage)
export interface TrayGame {
  gameId: string
  homeTricode: string
  awayTricode: string
  homeScore: number
  awayScore: number
  statusText: string
  isLive: boolean
}
