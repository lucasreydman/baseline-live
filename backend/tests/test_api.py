"""Integration-style API tests using FastAPI TestClient with mocked nba_service."""

from unittest.mock import patch, MagicMock
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import (
    ScoreboardResponse,
    GameSummary,
    TeamScore,
    GameDetailSummary,
    BoxScoreResponse,
    TeamBoxScore,
    PlayerStats,
    PlayByPlayResponse,
)

client = TestClient(app)


def _make_team_score(**kwargs) -> TeamScore:
    defaults = dict(
        teamId="1610612744", teamName="Warriors", teamCity="Golden State",
        teamTricode="GSW", score=110, wins=25, losses=20
    )
    return TeamScore(**{**defaults, **kwargs})


def _make_game_summary(**kwargs) -> GameSummary:
    defaults = dict(
        gameId="0022301234", gameCode="20240101/BOSLAL", gameStatus=3,
        gameStatusText="Final", period=4, gameClock="", gameTimeUTC="2024-01-01T00:00:00Z",
        arenaName="Chase Center", arenaCity="San Francisco",
        homeTeam=_make_team_score(teamTricode="GSW"),
        awayTeam=_make_team_score(teamTricode="LAL", teamName="Lakers", score=105),
        isLive=False, isFinal=True, isScheduled=False
    )
    return GameSummary(**{**defaults, **kwargs})


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# Scoreboard
# ---------------------------------------------------------------------------

def test_scoreboard_default_date():
    mock_response = ScoreboardResponse(date="2024-01-01", games=[_make_game_summary()])
    with patch("app.routers.scoreboard.nba_service.get_scoreboard", return_value=mock_response):
        r = client.get("/api/scoreboard?date=2024-01-01")
    assert r.status_code == 200
    body = r.json()
    assert body["date"] == "2024-01-01"
    assert len(body["games"]) == 1


def test_scoreboard_invalid_date():
    r = client.get("/api/scoreboard?date=notadate")
    assert r.status_code == 422


def test_scoreboard_service_error():
    with patch("app.routers.scoreboard.nba_service.get_scoreboard", side_effect=RuntimeError("NBA down")):
        r = client.get("/api/scoreboard?date=2024-01-01")
    assert r.status_code == 502
    assert "NBA data unavailable" in r.json()["detail"]


# ---------------------------------------------------------------------------
# Game summary
# ---------------------------------------------------------------------------

def _make_detail_summary() -> GameDetailSummary:
    return GameDetailSummary(
        gameId="0022301234", gameStatus=3, gameStatusText="Final",
        period=4, gameClock="", gameTimeUTC="2024-01-01T00:00:00Z",
        arenaName="Chase Center", arenaCity="SF",
        homeTeam=_make_team_score(), awayTeam=_make_team_score(teamTricode="LAL"),
        periodScores=[], homeLeaders=None, awayLeaders=None,
        isLive=False, isFinal=True, lastUpdated="2024-01-01T00:00:00Z",
    )


def test_game_summary_ok():
    with patch("app.routers.game.nba_service.get_game_summary", return_value=_make_detail_summary()):
        r = client.get("/api/game/0022301234/summary")
    assert r.status_code == 200
    assert r.json()["gameId"] == "0022301234"


def test_game_summary_invalid_id():
    r = client.get("/api/game/short/summary")
    assert r.status_code in (404, 422)


def test_game_summary_error():
    with patch("app.routers.game.nba_service.get_game_summary", side_effect=Exception("fail")):
        r = client.get("/api/game/0022301234/summary")
    assert r.status_code == 502


# ---------------------------------------------------------------------------
# Box score
# ---------------------------------------------------------------------------

def _make_player() -> PlayerStats:
    return PlayerStats(
        personId="1", name="Test Player", nameI="T. Player", jerseyNum="1",
        position="G", starter=True, status="ACTIVE", notPlayingReason=None,
        minutes="PT24M00.00S", points=15, rebounds=4, assists=3,
        steals=1, blocks=0, turnovers=2,
        fgMade=6, fgAttempted=12, fgPct=0.5,
        threePtMade=1, threePtAttempted=3, threePtPct=0.333,
        ftMade=2, ftAttempted=2, ftPct=1.0, plusMinus=8,
    )


def _make_boxscore() -> BoxScoreResponse:
    team = TeamBoxScore(
        teamId="1", teamName="Warriors", teamCity="Golden State", teamTricode="GSW",
        score=110, players=[_make_player()], totals=_make_player(),
    )
    return BoxScoreResponse(
        gameId="0022301234", gameStatus=3, gameStatusText="Final",
        period=4, gameClock="", homeTeam=team, awayTeam=team,
        isLive=False, lastUpdated="2024-01-01T00:00:00Z",
    )


def test_boxscore_ok():
    with patch("app.routers.game.nba_service.get_boxscore", return_value=_make_boxscore()):
        r = client.get("/api/game/0022301234/boxscore")
    assert r.status_code == 200
    assert r.json()["homeTeam"]["teamTricode"] == "GSW"


# ---------------------------------------------------------------------------
# Play by play
# ---------------------------------------------------------------------------

def _make_pbp() -> PlayByPlayResponse:
    return PlayByPlayResponse(
        gameId="0022301234", gameStatus=3, period=4, plays=[], lastUpdated="2024-01-01T00:00:00Z"
    )


def test_playbyplay_ok():
    with patch("app.routers.game.nba_service.get_playbyplay", return_value=_make_pbp()):
        r = client.get("/api/game/0022301234/playbyplay")
    assert r.status_code == 200
    assert r.json()["plays"] == []
