"""NBA data service — wraps nba_api live endpoints and normalises responses."""

from __future__ import annotations
import logging
import time
from datetime import datetime, timezone
from typing import Any, Optional

from nba_api.live.nba.endpoints import boxscore, playbyplay
from nba_api.stats.endpoints.scoreboardv3 import ScoreboardV3

from app.models.schemas import (
    BoxScoreResponse,
    GameDetailSummary,
    GameSummary,
    PeriodScore,
    PlayByPlayResponse,
    PlayEvent,
    PlayerStats,
    ScoreboardResponse,
    TeamBoxScore,
    TeamLeader,
    TeamScore,
)
from app.services.cache import cache

logger = logging.getLogger(__name__)


class GameNotStartedError(Exception):
    """Raised when the NBA live API returns an empty body (game not started yet)."""
    pass


# ---------------------------------------------------------------------------
# TTL constants (seconds)
# ---------------------------------------------------------------------------
TTL_LIVE = 10
TTL_FINAL = 300
TTL_PLAYBYPLAY_LIVE = 5
TTL_SCOREBOARD_STATIC = 60  # upcoming/final-only scoreboard


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _safe_int(val: Any, default: int = 0) -> int:
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


def _safe_float(val: Any, default: float = 0.0) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _safe_str(val: Any, default: str = "") -> str:
    if val is None:
        return default
    return str(val)


def _game_status_flags(status: int) -> tuple[bool, bool, bool]:
    """Returns (is_live, is_final, is_scheduled)."""
    return status == 2, status == 3, status == 1


def _ttl_for_status(status: int, live_ttl: int = TTL_LIVE, final_ttl: int = TTL_FINAL) -> int:
    if status == 2:  # live
        return live_ttl
    return final_ttl


def _fetch_with_retry(fn, retries: int = 3, backoff: float = 1.5) -> Any:
    """Call fn() with simple exponential-backoff retry."""
    last_exc: Exception = RuntimeError("unknown")
    for attempt in range(retries):
        try:
            return fn()
        except Exception as exc:
            # Empty response = game not started; no point retrying
            if isinstance(exc, ValueError) and "Expecting value" in str(exc):
                raise
            last_exc = exc
            if attempt < retries - 1:
                sleep_time = backoff ** attempt
                logger.warning("NBA API call failed (attempt %d/%d): %s — retrying in %.1fs",
                               attempt + 1, retries, exc, sleep_time)
                time.sleep(sleep_time)
    raise last_exc


# ---------------------------------------------------------------------------
# Team normalisation helpers
# ---------------------------------------------------------------------------

def _normalise_team_score(t: dict) -> TeamScore:
    return TeamScore(
        teamId=_safe_str(t.get("teamId")),
        teamName=_safe_str(t.get("teamName")),
        teamCity=_safe_str(t.get("teamCity")),
        teamTricode=_safe_str(t.get("teamTricode")),
        score=_safe_int(t.get("score")),
        wins=_safe_int(t.get("wins")),
        losses=_safe_int(t.get("losses")),
    )


# ---------------------------------------------------------------------------
# Scoreboard
# ---------------------------------------------------------------------------

def get_scoreboard(date: str) -> ScoreboardResponse:
    """Return normalised scoreboard for the given date (YYYY-MM-DD)."""
    cache_key = f"scoreboard:{date}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    def _fetch():
        sb = ScoreboardV3(game_date=date, timeout=20)
        return sb.get_dict()

    raw = _fetch_with_retry(_fetch)
    games_raw = raw.get("scoreboard", {}).get("games", [])

    games: list[GameSummary] = []
    any_live = False

    for g in games_raw:
        status = _safe_int(g.get("gameStatus"))
        is_live, is_final, is_scheduled = _game_status_flags(status)
        if is_live:
            any_live = True

        home = _normalise_team_score(g.get("homeTeam", {}))
        away = _normalise_team_score(g.get("awayTeam", {}))

        games.append(GameSummary(
            gameId=_safe_str(g.get("gameId")),
            gameCode=_safe_str(g.get("gameCode")),
            gameStatus=status,
            gameStatusText=_safe_str(g.get("gameStatusText")),
            period=_safe_int(g.get("period")),
            gameClock=_safe_str(g.get("gameClock")),
            gameTimeUTC=_safe_str(g.get("gameTimeUTC")),
            arenaName=_safe_str(g.get("gameLeaders", {}).get("awayLeaders", {}).get("teamCity", "")),  # fallback
            arenaCity="",
            homeTeam=home,
            awayTeam=away,
            isLive=is_live,
            isFinal=is_final,
            isScheduled=is_scheduled,
        ))

    # Pull arena from a different field if available
    for i, (g, gs) in enumerate(zip(games_raw, games)):
        arena = g.get("arena", {})
        games[i] = gs.model_copy(update={
            "arenaName": _safe_str(arena.get("arenaName", gs.arenaName)),
            "arenaCity": _safe_str(arena.get("arenaCity", "")),
        })

    result = ScoreboardResponse(date=date, games=games)
    ttl = TTL_LIVE if any_live else TTL_SCOREBOARD_STATIC
    cache.set(cache_key, result, ttl)
    return result


# ---------------------------------------------------------------------------
# Game Summary
# ---------------------------------------------------------------------------

def get_game_summary(game_id: str) -> GameDetailSummary:
    cache_key = f"summary:{game_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    def _fetch():
        bs = boxscore.BoxScore(game_id=game_id)
        return bs.get_dict()

    try:
        raw = _fetch_with_retry(_fetch)
    except ValueError as exc:
        raise GameNotStartedError("game_not_started") from exc

    game = raw.get("game", {})

    status = _safe_int(game.get("gameStatus"))
    is_live, is_final, _ = _game_status_flags(status)

    home_raw = game.get("homeTeam", {})
    away_raw = game.get("awayTeam", {})

    home = _normalise_team_score(home_raw)
    away = _normalise_team_score(away_raw)

    # Period scores
    period_scores: list[PeriodScore] = []
    home_periods = home_raw.get("periods", [])
    away_periods = away_raw.get("periods", [])
    for hp, ap in zip(home_periods, away_periods):
        period_scores.append(PeriodScore(
            period=_safe_int(hp.get("period")),
            periodType=_safe_str(hp.get("periodType", "REGULAR")),
            homeScore=_safe_int(hp.get("score")),
            awayScore=_safe_int(ap.get("score")),
        ))

    # Leaders
    def _extract_leaders(team_raw: dict) -> list[TeamLeader]:
        leaders = []
        for p in team_raw.get("players", [])[:3]:
            stats = p.get("statistics", {})
            leaders.append(TeamLeader(
                personId=_safe_str(p.get("personId")),
                name=_safe_str(p.get("name")),
                jerseyNum=_safe_str(p.get("jerseyNum")),
                position=_safe_str(p.get("position")),
                points=_safe_int(stats.get("points")),
                rebounds=_safe_int(stats.get("reboundsTotal")),
                assists=_safe_int(stats.get("assists")),
            ))
        # Sort by points descending
        leaders.sort(key=lambda x: x.points, reverse=True)
        return leaders[:3]

    arena = game.get("arena", {})

    result = GameDetailSummary(
        gameId=_safe_str(game.get("gameId")),
        gameStatus=status,
        gameStatusText=_safe_str(game.get("gameStatusText")),
        period=_safe_int(game.get("period")),
        gameClock=_safe_str(game.get("gameClock")),
        gameTimeUTC=_safe_str(game.get("gameTimeUTC")),
        arenaName=_safe_str(arena.get("arenaName")),
        arenaCity=_safe_str(arena.get("arenaCity")),
        homeTeam=home,
        awayTeam=away,
        periodScores=period_scores,
        homeLeaders=_extract_leaders(home_raw),
        awayLeaders=_extract_leaders(away_raw),
        isLive=is_live,
        isFinal=is_final,
        lastUpdated=_now_utc(),
    )

    ttl = _ttl_for_status(status)
    cache.set(cache_key, result, ttl)
    return result


# ---------------------------------------------------------------------------
# Box Score
# ---------------------------------------------------------------------------

def _normalise_player(p: dict) -> PlayerStats:
    stats = p.get("statistics", {})
    status = _safe_str(p.get("status", "ACTIVE"))
    not_playing_reason = _safe_str(p.get("notPlayingReason")) or None

    fg_made = _safe_int(stats.get("fieldGoalsMade"))
    fg_att = _safe_int(stats.get("fieldGoalsAttempted"))
    tp_made = _safe_int(stats.get("threePointersMade"))
    tp_att = _safe_int(stats.get("threePointersAttempted"))
    ft_made = _safe_int(stats.get("freeThrowsMade"))
    ft_att = _safe_int(stats.get("freeThrowsAttempted"))

    def _pct(made: int, att: int) -> float:
        return round(made / att, 3) if att > 0 else 0.0

    return PlayerStats(
        personId=_safe_str(p.get("personId")),
        name=_safe_str(p.get("name")),
        nameI=_safe_str(p.get("nameI")),
        jerseyNum=_safe_str(p.get("jerseyNum")),
        position=_safe_str(p.get("position")),
        starter=str(p.get("starter", "0")) == "1",
        status=status,
        notPlayingReason=not_playing_reason,
        minutes=_safe_str(stats.get("minutesCalculated", "")),
        points=_safe_int(stats.get("points")),
        rebounds=_safe_int(stats.get("reboundsTotal")),
        assists=_safe_int(stats.get("assists")),
        steals=_safe_int(stats.get("steals")),
        blocks=_safe_int(stats.get("blocks")),
        turnovers=_safe_int(stats.get("turnovers")),
        fgMade=fg_made,
        fgAttempted=fg_att,
        fgPct=_pct(fg_made, fg_att),
        threePtMade=tp_made,
        threePtAttempted=tp_att,
        threePtPct=_pct(tp_made, tp_att),
        ftMade=ft_made,
        ftAttempted=ft_att,
        ftPct=_pct(ft_made, ft_att),
        plusMinus=_safe_int(stats.get("plusMinusPoints")),
    )


def _build_team_totals(team_raw: dict, players: list[PlayerStats]) -> PlayerStats:
    """Build synthetic totals row from team statistics dict."""
    stats = team_raw.get("statistics", {})

    fg_made = _safe_int(stats.get("fieldGoalsMade"))
    fg_att = _safe_int(stats.get("fieldGoalsAttempted"))
    tp_made = _safe_int(stats.get("threePointersMade"))
    tp_att = _safe_int(stats.get("threePointersAttempted"))
    ft_made = _safe_int(stats.get("freeThrowsMade"))
    ft_att = _safe_int(stats.get("freeThrowsAttempted"))

    def _pct(made: int, att: int) -> float:
        return round(made / att, 3) if att > 0 else 0.0

    return PlayerStats(
        personId="totals",
        name="Team Totals",
        nameI="Totals",
        jerseyNum="",
        position="",
        starter=False,
        status="ACTIVE",
        notPlayingReason=None,
        minutes="",
        points=_safe_int(stats.get("points")),
        rebounds=_safe_int(stats.get("reboundsTotal")),
        assists=_safe_int(stats.get("assists")),
        steals=_safe_int(stats.get("steals")),
        blocks=_safe_int(stats.get("blocks")),
        turnovers=_safe_int(stats.get("turnovers")),
        fgMade=fg_made,
        fgAttempted=fg_att,
        fgPct=_pct(fg_made, fg_att),
        threePtMade=tp_made,
        threePtAttempted=tp_att,
        threePtPct=_pct(tp_made, tp_att),
        ftMade=ft_made,
        ftAttempted=ft_att,
        ftPct=_pct(ft_made, ft_att),
        plusMinus=0,
    )


def get_boxscore(game_id: str) -> BoxScoreResponse:
    cache_key = f"boxscore:{game_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    def _fetch():
        bs = boxscore.BoxScore(game_id=game_id)
        return bs.get_dict()

    try:
        raw = _fetch_with_retry(_fetch)
    except ValueError as exc:
        raise GameNotStartedError("game_not_started") from exc

    game = raw.get("game", {})

    status = _safe_int(game.get("gameStatus"))
    is_live, _, _ = _game_status_flags(status)

    def _build_team(team_raw: dict) -> TeamBoxScore:
        players_raw = team_raw.get("players", [])
        players = [_normalise_player(p) for p in players_raw]
        totals = _build_team_totals(team_raw, players)
        return TeamBoxScore(
            teamId=_safe_str(team_raw.get("teamId")),
            teamName=_safe_str(team_raw.get("teamName")),
            teamCity=_safe_str(team_raw.get("teamCity")),
            teamTricode=_safe_str(team_raw.get("teamTricode")),
            score=_safe_int(team_raw.get("score")),
            players=players,
            totals=totals,
        )

    result = BoxScoreResponse(
        gameId=_safe_str(game.get("gameId")),
        gameStatus=status,
        gameStatusText=_safe_str(game.get("gameStatusText")),
        period=_safe_int(game.get("period")),
        gameClock=_safe_str(game.get("gameClock")),
        homeTeam=_build_team(game.get("homeTeam", {})),
        awayTeam=_build_team(game.get("awayTeam", {})),
        isLive=is_live,
        lastUpdated=_now_utc(),
    )

    ttl = _ttl_for_status(status)
    cache.set(cache_key, result, ttl)
    return result


# ---------------------------------------------------------------------------
# Play by Play
# ---------------------------------------------------------------------------

def get_playbyplay(game_id: str) -> PlayByPlayResponse:
    cache_key = f"playbyplay:{game_id}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    def _fetch():
        pbp = playbyplay.PlayByPlay(game_id=game_id)
        return pbp.get_dict()

    try:
        raw = _fetch_with_retry(_fetch)
    except ValueError as exc:
        raise GameNotStartedError("game_not_started") from exc
    game = raw.get("game", {})
    actions_raw = game.get("actions", [])

    status = _safe_int(game.get("gameStatus", 2))
    is_live, _, _ = _game_status_flags(status)

    plays: list[PlayEvent] = []
    for a in actions_raw:
        home_score = _safe_str(a.get("scoreHome", ""))
        away_score = _safe_str(a.get("scoreAway", ""))
        is_score_change = (
            _safe_str(a.get("isScoreChange", "")) in ("1", "true", "True")
            or bool(a.get("isScoreChange"))
        )
        plays.append(PlayEvent(
            actionNumber=_safe_int(a.get("actionNumber")),
            clock=_safe_str(a.get("clock")),
            timeActual=_safe_str(a.get("timeActual")),
            period=_safe_int(a.get("period")),
            periodType=_safe_str(a.get("periodType", "REGULAR")),
            teamId=_safe_str(a.get("teamId")) or None,
            teamTricode=_safe_str(a.get("teamTricode")) or None,
            actionType=_safe_str(a.get("actionType")),
            subType=_safe_str(a.get("subType")) or None,
            description=_safe_str(a.get("description")),
            scoreHome=home_score,
            scoreAway=away_score,
            isScoreChange=is_score_change,
            personId=_safe_str(a.get("personId")) or None,
            playerName=_safe_str(a.get("playerName")) or None,
            playerNameI=_safe_str(a.get("playerNameI")) or None,
        ))

    result = PlayByPlayResponse(
        gameId=game_id,
        gameStatus=status,
        period=_safe_int(game.get("period", 0)),
        plays=plays,
        lastUpdated=_now_utc(),
    )

    ttl = TTL_PLAYBYPLAY_LIVE if is_live else TTL_FINAL
    cache.set(cache_key, result, ttl)
    return result
