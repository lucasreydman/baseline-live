"""Tests for NBA data normalisation helpers in nba_service."""

import pytest
from app.services.nba_service import (
    _safe_int,
    _safe_float,
    _safe_str,
    _game_status_flags,
    _normalise_team_score,
    _normalise_player,
    _build_team_totals,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def test_safe_int_valid():
    assert _safe_int("42") == 42
    assert _safe_int(7) == 7


def test_safe_int_fallback():
    assert _safe_int(None) == 0
    assert _safe_int("abc") == 0
    assert _safe_int(None, default=99) == 99


def test_safe_float_valid():
    assert _safe_float("3.14") == pytest.approx(3.14)


def test_safe_str_none():
    assert _safe_str(None) == ""
    assert _safe_str(None, default="N/A") == "N/A"


def test_game_status_flags_live():
    is_live, is_final, is_sched = _game_status_flags(2)
    assert is_live and not is_final and not is_sched


def test_game_status_flags_final():
    is_live, is_final, is_sched = _game_status_flags(3)
    assert is_final and not is_live and not is_sched


def test_game_status_flags_scheduled():
    is_live, is_final, is_sched = _game_status_flags(1)
    assert is_sched and not is_live and not is_final


# ---------------------------------------------------------------------------
# Team score normalisation
# ---------------------------------------------------------------------------

TEAM_RAW = {
    "teamId": "1610612744",
    "teamName": "Warriors",
    "teamCity": "Golden State",
    "teamTricode": "GSW",
    "score": 110,
    "wins": 25,
    "losses": 20,
}


def test_normalise_team_score_basic():
    ts = _normalise_team_score(TEAM_RAW)
    assert ts.teamTricode == "GSW"
    assert ts.score == 110
    assert ts.wins == 25


def test_normalise_team_score_missing_fields():
    ts = _normalise_team_score({})
    assert ts.teamId == ""
    assert ts.score == 0


# ---------------------------------------------------------------------------
# Player normalisation
# ---------------------------------------------------------------------------

PLAYER_RAW = {
    "personId": "2544",
    "name": "LeBron James",
    "nameI": "L. James",
    "jerseyNum": "23",
    "position": "F",
    "starter": "1",
    "status": "ACTIVE",
    "statistics": {
        "points": 30,
        "reboundsTotal": 8,
        "assists": 7,
        "steals": 1,
        "blocks": 0,
        "turnovers": 3,
        "fieldGoalsMade": 12,
        "fieldGoalsAttempted": 20,
        "threePointersMade": 2,
        "threePointersAttempted": 5,
        "freeThrowsMade": 4,
        "freeThrowsAttempted": 5,
        "plusMinusPoints": 12,
        "minutesCalculated": "PT36M00.00S",
    },
}


def test_normalise_player_stats():
    p = _normalise_player(PLAYER_RAW)
    assert p.name == "LeBron James"
    assert p.points == 30
    assert p.rebounds == 8
    assert p.assists == 7
    assert p.starter is True
    assert p.fgMade == 12
    assert p.fgAttempted == 20
    assert p.fgPct == pytest.approx(0.600, abs=0.001)
    assert p.threePtPct == pytest.approx(0.400, abs=0.001)
    assert p.ftPct == pytest.approx(0.800, abs=0.001)
    assert p.plusMinus == 12


def test_normalise_player_pct_zero_attempts():
    raw = {**PLAYER_RAW, "statistics": {**PLAYER_RAW["statistics"], "fieldGoalsAttempted": 0, "fieldGoalsMade": 0}}
    p = _normalise_player(raw)
    assert p.fgPct == 0.0


def test_normalise_player_inactive():
    raw = {**PLAYER_RAW, "status": "INACTIVE", "notPlayingReason": "INJURY"}
    p = _normalise_player(raw)
    assert p.status == "INACTIVE"
    assert p.notPlayingReason == "INJURY"


# ---------------------------------------------------------------------------
# Team totals
# ---------------------------------------------------------------------------

TEAM_RAW_WITH_STATS = {
    "statistics": {
        "points": 110,
        "reboundsTotal": 42,
        "assists": 25,
        "steals": 8,
        "blocks": 5,
        "turnovers": 12,
        "fieldGoalsMade": 42,
        "fieldGoalsAttempted": 88,
        "threePointersMade": 14,
        "threePointersAttempted": 35,
        "freeThrowsMade": 12,
        "freeThrowsAttempted": 15,
    }
}


def test_build_team_totals():
    totals = _build_team_totals(TEAM_RAW_WITH_STATS, [])
    assert totals.points == 110
    assert totals.rebounds == 42
    assert totals.fgMade == 42
    assert totals.fgAttempted == 88
    assert totals.fgPct == pytest.approx(42 / 88, abs=0.001)
    assert totals.name == "Team Totals"
