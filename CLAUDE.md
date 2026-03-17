# Baseline Live — CLAUDE.md

## Project Goal

Baseline Live is a free, open-source NBA live-tracking web app. It lets fans:
- See all NBA games for any date (live, upcoming, final)
- View full box scores for both teams
- Follow a live play-by-play feed that auto-refreshes
- Keep multiple games open in a quick-switch tray

No auth, no payments, no betting, no social. Just clean NBA data.

## Architecture Overview

```
real-pro/
├── backend/          FastAPI Python service (port 8000)
│   ├── app/
│   │   ├── main.py       FastAPI app entry point
│   │   ├── routers/      Route handlers
│   │   │   ├── scoreboard.py
│   │   │   └── game.py
│   │   ├── services/     Business logic & NBA API wrappers
│   │   │   ├── nba_service.py   Raw nba_api calls + normalization
│   │   │   └── cache.py         TTL in-memory cache
│   │   └── models/       Pydantic response schemas
│   │       └── schemas.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
└── frontend/         Next.js 14 App Router (port 3000)
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx          Scoreboard home
    │   │   └── game/[gameId]/
    │   │       └── page.tsx      Game details
    │   ├── components/
    │   │   ├── layout/           Navbar, GameTray
    │   │   ├── scoreboard/       DatePicker, FilterChips, GameCard, ScoreboardGrid
    │   │   └── game/             GameHeader, BoxScore, PlayByPlay, SummaryTab
    │   ├── hooks/
    │   │   ├── useScoreboard.ts
    │   │   ├── useBoxScore.ts
    │   │   ├── usePlayByPlay.ts
    │   │   └── useGameSummary.ts
    │   ├── lib/
    │   │   ├── api.ts            Typed fetch helpers
    │   │   └── types.ts          Shared TypeScript types
    │   └── store/
    │       └── gameTray.ts       Zustand store for open games tray
    ├── package.json
    ├── tailwind.config.ts
    └── next.config.ts
```

## Run Commands

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                      # http://localhost:3000
```

### Both at once (with concurrently)
```bash
npm run dev                      # from repo root if root package.json is set up
```

## Build Commands
```bash
# Frontend production build
cd frontend && npm run build

# Backend is stateless; just run with uvicorn in production
```

## Testing Commands
```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test
```

## Deployment Notes

### Frontend → Vercel
- Set `NEXT_PUBLIC_API_URL` env var to your deployed backend URL
- `vercel deploy` from `frontend/`

### Backend → Railway / Render / Fly.io
- Point to `backend/` directory
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Set `ALLOWED_ORIGINS` to your frontend URL

### Docker Compose (local full-stack)
```bash
docker-compose up --build
```

## Environment Variables

### Backend (.env)
```
ALLOWED_ORIGINS=http://localhost:3000
CACHE_TTL_LIVE=10
CACHE_TTL_FINAL=300
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Important Decisions

1. **nba_api live endpoints** — Uses `nba_api.live.nba.endpoints` for scoreboard, boxscore, playbyplay. These are the real NBA CDN endpoints and are completely free.
2. **In-memory TTL cache** — `cachetools.TTLCache` on the backend. No Redis needed for a personal project. Cache keys are `{endpoint}:{param}`.
3. **Polling cadence** — Frontend polls via SWR. Live games poll every 10–15s for scoreboard/boxscore, every 5s for play-by-play. Final/scheduled games poll every 60s. Visibility API pauses polling on hidden tabs.
4. **No database** — All state is ephemeral. User's open-game tray stored in localStorage.
5. **App name** — "Baseline Live". No relation to any commercial product.
6. **Zustand** for lightweight global state (open games tray). SWR for server state.
7. **Request dedup** — SWR deduplicates identical fetches within a 2s window automatically.

## Live Polling & Caching

```
Frontend (SWR) → GET /api/... → FastAPI → TTL Cache → nba_api
                                             ↓ miss
                                         nba_api CDN call
```

TTL values (seconds):
| Endpoint              | Live game | Final/Scheduled |
|-----------------------|-----------|-----------------|
| /api/scoreboard       | 10        | 60              |
| /api/game/*/summary   | 10        | 300             |
| /api/game/*/boxscore  | 10        | 300             |
| /api/game/*/playbyplay| 5         | 300             |

The backend cache key includes a `live` flag derived from game status, so TTL adjusts automatically.

## Known Limitations

- `nba_api` CDN endpoints can be slow or temporarily unavailable (NBA occasionally changes URLs). Backend includes retry with exponential backoff.
- Play-by-play data is only available for games that have started.
- No historical data beyond what NBA's live API provides.
- The NBA API has no official SLA; treat all data as best-effort.
- Preseason / All-Star game IDs may behave differently.

## Next Steps / Backlog

- [ ] Add team logos (use ESPN CDN or NBA CDN URLs by team tricode)
- [ ] Add quarter-by-quarter line score display
- [ ] Progressive Web App (PWA) manifest for mobile install
- [ ] SSE / WebSocket for truly real-time updates
- [ ] Redis cache for multi-worker deployments
- [ ] Unit tests for frontend hooks
