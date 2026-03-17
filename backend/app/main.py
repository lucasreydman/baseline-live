"""Baseline Live — FastAPI backend entry point."""

from __future__ import annotations
import logging
import os
from datetime import date

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import scoreboard, game

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Baseline Live API",
    description="Free NBA live data — scoreboard, box scores, play-by-play.",
    version="1.0.0",
)

# CORS
_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins = [o.strip() for o in _origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Routers
app.include_router(scoreboard.router)
app.include_router(game.router)


# Health check
@app.get("/health")
async def health():
    return {"status": "ok", "date": date.today().isoformat()}


# Global exception handler — never expose stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.exception("Unhandled error on %s", request.url)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
