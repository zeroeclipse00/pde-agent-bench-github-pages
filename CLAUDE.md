# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All frontend commands run from `web/frontend/`:

```bash
npm install        # install dependencies
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → ../../docs/
npm run typecheck  # TypeScript type checking
npm run preview    # preview production build at http://localhost:4173
```

Backend commands run from `web/server/`:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Architecture

This is a static React site (deployed to GitHub Pages) for the PDEAgent-Bench academic benchmark. The site has 14 full-page sections assembled in [App.tsx](web/frontend/src/App.tsx).

### Data flow

**Single source of truth:** `web/server/app/data/mock.json` (~850 lines). All site content lives here.

- **Dev mode:** Vite proxies `/api/*` → FastAPI at `localhost:8000`. FastAPI reads `mock.json` via an LRU-cached loader in [store.py](web/server/app/store.py).
- **Prod mode:** Frontend falls back to a bundled import of `mock.json` via [lib/fallback.ts](web/frontend/src/lib/fallback.ts). No backend required for the deployed site.

React Query hooks and TypeScript types are co-located in [lib/api.ts](web/frontend/src/lib/api.ts). React Query is configured with 60s staleTime, 1 retry, no refetch on window focus.

### Key config

- **Base path:** Production builds use `/pde-agent-bench-github-pages/` as the Vite base. Asset URLs must use the Vite `withBase()` utility.
- **Build output:** `npm run build` writes to `../../docs/` (recognized by GitHub Pages). `emptyOutDir: true` — the folder is cleared on each build.
- **Deployment:** Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and uploads `docs/` to GitHub Pages automatically.
- **Path alias:** `@/*` resolves to `src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

### Frontend structure

- `src/sections/` — 14 page sections (Hero, Leaderboard, ResultsExplorer, etc.)
- `src/components/` — shared atoms (`SectionHeader`, `AnimatedCounter`)
- `src/lib/api.ts` — React Query hooks + all TypeScript interfaces
- `src/lib/utils.ts` — formatting helpers (`fmtPct`, `rankColor`, etc.)
- Custom Tailwind theme in [tailwind.config.ts](web/frontend/tailwind.config.ts): ink palette, brand blues, glow/cardlift shadows, fade-in/rise-in animations

### Backend structure (8 API endpoints)

| Endpoint | Notes |
|---|---|
| `GET /api/stats` | Hero counters |
| `GET /api/leaderboard` | Supports `?backend=`, `?sort=`, `?limit=` |
| `GET /api/leaderboard/{model_id}` | Single row |
| `GET /api/models` | 8 systems (5 LLMs + 3 agents) |
| `GET /api/pde-types` | 11 PDE families |
| `GET /api/findings` | Research insights |
| `GET /api/authors` | Team + affiliations |
| `GET /api/figures` | Paper figures |
| `GET /api/citation` | Paper title, venue, BibTeX |

Pydantic schemas in [schemas.py](web/server/app/schemas.py) mirror the TypeScript interfaces in `api.ts` exactly.

## Updating benchmark data

Edit `web/server/app/data/mock.json` and push. Both the FastAPI backend and the static fallback import consume from this file, so a single edit updates the entire site.
