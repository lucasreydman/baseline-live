"""Unit tests for nba_service normalisation helpers."""

import pytest
from app.services.nba_service import (
    _safe_int,
    _safe_float,
    _safe_str,
    _game_status_flags,
    _ttl_for_status,
    _normalise_team_score,
    _normalise_player,
    _build_team_totals,
    TTL_LIVE,
    TTL_FINAL,
)


# ---------------------------------------------------------------------------
# _safe_* helpers
# ---------------------------------------------------------------------------

def test_safe_int_normal():
    assert _safe_int(42) == 42
    assert _safe_int("7") == 7


def test_safe_int_fallback():
    assert _safe_int(None) == 0
    assert _safe_int("x") == 0
    assert _safe_int("x", default=99) == 99


def test_safe_float_normal():
    assert _safe_float(3.14) == pytest.approx(3.14)
    assert _safe_float("0.5") == pytest.approx(0.5)


def test_safe_float_fallback():
    assert _safe_float(None) == 0.0
    assert _safe_float("bad") == 0.0


def test_safe_str_normal():
    assert _safe_str("hello") == "hello"
    assert _safe_str(42) == "42"


def test_safe_str_none():
    assert _safe_str(None) == ""
    assert _safe_str(None, default="N/A") == "N/A"


# ---------------------------------------------------------------------------
# _game_status_flags
# ---------------------------------------------------------------------------

def test_status_scheduled():
    is_live, is_final, is_scheduled = _game_status_flags(1)
    assert not is_live
    assert not is_final
    assert is_scheduled


def test_status_live():
    is_live, is_final, is_scheduled = _game_status_flags(2)
    assert is_live
    assert not is_final
    assert not is_scheduled


def test_status_final():
    is_live, is_final, is_scheduled = _game_status_flags(3)
    assert not is_live
    assert is_final
    assert not is_scheduled


# ---------------------------------------------------------------------------
# _ttl_for_status
# ---------------------------------------------------------------------------

def test_ttl_live_game():
    assert _ttl_for_status(2) == TTL_LIVE


def test_ttl_final_game():
    assert _ttl_for_status(3) == TTL_FINAL


def test_ttl_scheduled_game():
    assert _ttl_for_status(1) == TTL_FINAL


# ---------------------------------------------------------------------------
# _normalise_team_score
# ---------------------------------------------------------------------------

def test_normalise_team_score_full():
    raw = {
        "teamId": "1610612747",
        "teamName": "Lakers",
        "teamCity": "Los Angeles",
        "teamTricode": "LAL",
        "score": 108,
        "wins": 30,
        "losses": 20,
    }
    team = _normalise_team_score(raw)
    assert team.teamId == "1610612747"
    assert team.teamName == "Lakers"
    assert team.teamTricode == "LAL"
    assert team.score == 108
    assert team.wins == 30
    assert team.losses == 20


def test_normalise_team_score_missing_fields():
    team = _normalise_team_score({})
    assert team.teamId == ""
    assert team.score == 0
    assert team.wins == 0


# ---------------------------------------------------------------------------
# _normalise_player
# ---------------------------------------------------------------------------

def _make_player_raw(**overrides):
    base = {
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
            "blocks": 1,
            "turnovers": 3,
            "fieldGoalsMade": 12,
            "fieldGoalsAttempted": 20,
            "threePointersMade": 2,
            "threePointersAttempted": 5,
            "freeThrowsMade": 4,
            "freeThrowsAttempted": 4,
            "plusMinusPoints": 12,
            "minutesCalculated": "PT35M00.00S",
        },
    }
    base.update(overrides)
    return base


def test_normalise_player_stats():
    p = _normalise_player(_make_player_raw())
    assert p.personId == "2544"
    assert p.name == "LeBron James"
    assert p.points == 30
    assert p.rebounds == 8
    assert p.assists == 7
    assert p.fgMade == 12
    assert p.fgAttempted == 20
    assert p.fgPct == pytest.approx(0.6)
    assert p.threePtMade == 2
    assert p.threePtPct == pytest.approx(0.4)
    assert p.ftMade == 4
    assert p.ftPct == pytest.approx(1.0)
    assert p.plusMinus == 12
    assert p.starter is True


def test_normalise_player_zero_attempts():
    """Percentage should be 0 when no attempts."""
    raw = _make_player_raw()
    raw["statistics"]["fieldGoalsAttempted"] = 0
    raw["statistics"]["fieldGoalsMade"] = 0
    p = _normalise_player(raw)
    assert p.fgPct == 0.0


def test_normalise_player_inactive():
    raw = _make_player_raw(status="INACTIVE", notPlayingReason="INJURY_ILLNESS")
    p = _normalise_player(raw)
    assert p.status == "INACTIVE"
    assert p.notPlayingReason == "INJURY_ILLNESS"


def test_normalise_player_bench():
    raw = _make_player_raw()
    raw["starter"] = "0"
    p = _normalise_player(raw)
    assert p.starter is False


# ---------------------------------------------------------------------------
# _build_team_totals
# ---------------------------------------------------------------------------

def test_build_team_totals():
    team_raw = {
        "statistics": {
            "points": 110,
            "reboundsTotal": 45,
            "assists": 25,
            "steals": 8,
            "blocks": 5,
            "turnovers": 14,
            "fieldGoalsMade": 42,
            "fieldGoalsAttempted": 90,
            "threePointersMade": 12,
            "threePointersAttempted": 30,
            "freeThrowsMade": 14,
            "freeThrowsAttempted": 18,
        }
    }
    totals = _build_team_totals(team_raw, [])
    assert totals.personId == "totals"
    assert totals.points == 110
    assert totals.fgMade == 42
    assert totals.fgAttempted == 90
    assert totals.fgPct == pytest.approx(42 / 90, abs=0.001)
