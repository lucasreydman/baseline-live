"""Pydantic response schemas for the Baseline Live API."""

from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Scoreboard
# ---------------------------------------------------------------------------

class TeamScore(BaseModel):
    teamId: str
    teamName: str
    teamCity: str
    teamTricode: str
    score: int
    wins: int
    losses: int


class GameSummary(BaseModel):
    gameId: str
    gameCode: str
    gameStatus: int          # 1=scheduled, 2=live, 3=final
    gameStatusText: str      # e.g. "Q3 4:32", "Final", "7:30 pm ET"
    period: int
    gameClock: str           # e.g. "PT04M32.00S" or ""
    gameTimeUTC: str
    arenaName: str
    arenaCity: str
    homeTeam: TeamScore
    awayTeam: TeamScore
    isLive: bool
    isFinal: bool
    isScheduled: bool


class ScoreboardResponse(BaseModel):
    date: str
    games: list[GameSummary]


# ---------------------------------------------------------------------------
# Game Detail — Summary
# ---------------------------------------------------------------------------

class PeriodScore(BaseModel):
    period: int
    periodType: str
    homeScore: int
    awayScore: int


class TeamLeader(BaseModel):
    personId: str
    name: str
    jerseyNum: str
    position: str
    points: int
    rebounds: int
    assists: int


class GameDetailSummary(BaseModel):
    gameId: str
    gameStatus: int
    gameStatusText: str
    period: int
    gameClock: str
    gameTimeUTC: str
    arenaName: str
    arenaCity: str
    homeTeam: TeamScore
    awayTeam: TeamScore
    periodScores: list[PeriodScore]
    homeLeaders: Optional[list[TeamLeader]] = None
    awayLeaders: Optional[list[TeamLeader]] = None
    isLive: bool
    isFinal: bool
    lastUpdated: str


# ---------------------------------------------------------------------------
# Box Score
# ---------------------------------------------------------------------------

class PlayerStats(BaseModel):
    personId: str
    name: str
    nameI: str           # e.g. "L. James"
    jerseyNum: str
    position: str
    starter: bool
    status: str          # "ACTIVE", "INACTIVE", "DNP", etc.
    notPlayingReason: Optional[str] = None
    minutes: str
    points: int
    rebounds: int
    assists: int
    steals: int
    blocks: int
    turnovers: int
    fgMade: int
    fgAttempted: int
    fgPct: float
    threePtMade: int
    threePtAttempted: int
    threePtPct: float
    ftMade: int
    ftAttempted: int
    ftPct: float
    plusMinus: int


class TeamBoxScore(BaseModel):
    teamId: str
    teamName: str
    teamCity: str
    teamTricode: str
    score: int
    players: list[PlayerStats]
    totals: PlayerStats    # synthetic totals row


class BoxScoreResponse(BaseModel):
    gameId: str
    gameStatus: int
    gameStatusText: str
    period: int
    gameClock: str
    homeTeam: TeamBoxScore
    awayTeam: TeamBoxScore
    isLive: bool
    lastUpdated: str


# ---------------------------------------------------------------------------
# Play by Play
# ---------------------------------------------------------------------------

class PlayEvent(BaseModel):
    actionNumber: int
    clock: str           # game clock string e.g. "PT04M32.00S"
    timeActual: str      # UTC timestamp
    period: int
    periodType: str
    teamId: Optional[str] = None
    teamTricode: Optional[str] = None
    actionType: str
    subType: Optional[str] = None
    description: str
    scoreHome: str
    scoreAway: str
    isScoreChange: bool
    personId: Optional[str] = None
    playerName: Optional[str] = None
    playerNameI: Optional[str] = None


class PlayByPlayResponse(BaseModel):
    gameId: str
    gameStatus: int
    period: int
    plays: list[PlayEvent]
    lastUpdated: str
