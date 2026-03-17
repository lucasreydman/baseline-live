"""Game detail router (summary, boxscore, play-by-play)."""

from fastapi import APIRouter, HTTPException, Path

from app.models.schemas import BoxScoreResponse, GameDetailSummary, PlayByPlayResponse
from app.services import nba_service
from app.services.nba_service import GameNotStartedError

router = APIRouter(prefix="/api/game", tags=["game"])

_GAME_ID_PATH = Path(..., description="10-digit NBA game ID", pattern=r"^\d{10}$")


@router.get("/{gameId}/summary", response_model=GameDetailSummary)
async def get_summary(gameId: str = _GAME_ID_PATH):
    try:
        return nba_service.get_game_summary(gameId)
    except GameNotStartedError as exc:
        raise HTTPException(status_code=404, detail="game_not_started") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"NBA data unavailable: {exc}") from exc


@router.get("/{gameId}/boxscore", response_model=BoxScoreResponse)
async def get_boxscore(gameId: str = _GAME_ID_PATH):
    try:
        return nba_service.get_boxscore(gameId)
    except GameNotStartedError as exc:
        raise HTTPException(status_code=404, detail="game_not_started") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"NBA data unavailable: {exc}") from exc


@router.get("/{gameId}/playbyplay", response_model=PlayByPlayResponse)
async def get_playbyplay(gameId: str = _GAME_ID_PATH):
    try:
        return nba_service.get_playbyplay(gameId)
    except GameNotStartedError as exc:
        raise HTTPException(status_code=404, detail="game_not_started") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"NBA data unavailable: {exc}") from exc
