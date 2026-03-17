"""Scoreboard router."""

from datetime import date as date_type
from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import ScoreboardResponse
from app.services import nba_service

router = APIRouter(prefix="/api", tags=["scoreboard"])


@router.get("/scoreboard", response_model=ScoreboardResponse)
async def get_scoreboard(
    date: str = Query(
        default=None,
        description="Date in YYYY-MM-DD format. Defaults to today.",
        pattern=r"^\d{4}-\d{2}-\d{2}$",
    )
):
    """Return all games for the given date."""
    if date is None:
        date = date_type.today().isoformat()

    try:
        return nba_service.get_scoreboard(date)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"NBA data unavailable: {exc}") from exc
