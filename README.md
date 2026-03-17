# Baseline Live

A free, open-source NBA live-tracking web app. See live scores, full box scores, and play-by-play for any NBA game — no ads, no accounts, no payments.

## Features

- **Live Scoreboard** — all games for any date with live/upcoming/final filters
- **Game Details** — score header, quarter-by-quarter line score, team leaders
- **Box Score** — full player stats for both teams, starters/bench grouping
- **Play-by-Play** — chronological feed with auto-refresh during live games
- **Game Tray** — keep multiple games open in a quick-switch bottom tray (localStorage)

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Data fetching | SWR |
| Global state | Zustand |
| Backend | FastAPI (Python 3.12) |
| NBA data | `nba_api` (live CDN endpoints — completely free) |
| Cache | In-memory TTL cache |

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API runs at `http://localhost:8000`. Interactive docs at `/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### Docker Compose

```bash
docker-compose up --build
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/scoreboard?date=YYYY-MM-DD` | All games for a date |
| `GET /api/game/{gameId}/summary` | Game summary + line score + leaders |
| `GET /api/game/{gameId}/boxscore` | Full box score for both teams |
| `GET /api/game/{gameId}/playbyplay` | Complete play-by-play feed |
| `GET /health` | Health check |

## Tests

```bash
cd backend
.venv\Scripts\activate
pytest tests/ -v
```

## Deployment

**Frontend → Vercel:** set `NEXT_PUBLIC_API_URL` env var to your backend URL.

**Backend → Railway / Render / Fly.io:**
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Env: `ALLOWED_ORIGINS=https://your-app.vercel.app`

## Environment Variables

`backend/.env`:
```
ALLOWED_ORIGINS=http://localhost:3000
```

`frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Architecture

```
Browser (SWR polling) → FastAPI → TTL Cache → nba_api CDN
```

Polling intervals adapt to game state: 6s for live play-by-play, 12s for live scores, 60s for static pages. No database needed — everything is stateless with in-memory caching.
