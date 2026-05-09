# Project Page — Technical Guide

This directory contains the source for the PDEAgent-Bench project page.

## Structure

```
web/
├── frontend/          Vite + React + TypeScript + Tailwind + Recharts
└── server/            FastAPI mock API (local dev only)
```

## Local development

Two terminals:

```bash
# Terminal 1 — backend (optional; frontend falls back to bundled data without it)
cd web/server
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

```bash
# Terminal 2 — frontend
cd web/frontend
npm install
npm run dev        # http://localhost:5173
```

## Data

All site content lives in a single file: `server/app/data/mock.json`.

- **Dev:** Vite proxies `/api/*` → FastAPI, which reads `mock.json`.
- **Prod:** Frontend imports `mock.json` directly via a bundled fallback — no backend required.

To update the site (results, authors, figures, etc.), edit `mock.json` and push to `main`.

## Frontend commands

Run from `web/frontend/`:

```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → ../../docs/
npm run typecheck  # TypeScript type checking
npm run preview    # preview production build at http://localhost:4173
```

## Key files

```
frontend/src/
├── App.tsx               page composition (14 sections)
├── lib/
│   ├── api.ts            React Query hooks + TypeScript interfaces
│   └── fallback.ts       bundled mock.json import for static builds
├── components/           shared UI atoms
└── sections/             Hero, Authors, Leaderboard, ResultsExplorer, …
```

## API endpoints (dev only)

| Path | Description |
|---|---|
| `GET /api/stats` | Hero counters |
| `GET /api/leaderboard` | Supports `?backend=`, `?sort=`, `?limit=` |
| `GET /api/models` | Model + agent catalog |
| `GET /api/pde-types` | PDE family definitions |
| `GET /api/findings` | Insight cards |
| `GET /api/authors` | Research team |
| `GET /api/figures` | Paper figure metadata |
| `GET /api/citation` | Title, abstract, BibTeX |
