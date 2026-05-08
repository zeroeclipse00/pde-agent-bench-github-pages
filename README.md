# PDEAgent-Bench Showcase Site

Academic project page for **PDEAgent-Bench**. The site is a static React app
deployed to GitHub Pages via GitHub Actions.

## Project layout

```
web/
├── frontend/          Vite + React + TypeScript + Tailwind + Recharts
└── server/            FastAPI mock API (local dev only)
```

The frontend reads data from `web/server/app/data/mock.json` — either through
the FastAPI server in dev mode, or via a bundled fallback in production.

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

## Deployment

Pushing to `main` triggers a GitHub Actions workflow that builds the frontend
and deploys it to GitHub Pages automatically. No manual build step needed.

To update the site content, edit `web/server/app/data/mock.json` and push.

## File structure

```
web/
├── frontend/
│   ├── src/
│   │   ├── App.tsx               page composition
│   │   ├── lib/
│   │   │   ├── api.ts            typed fetch + react-query hooks
│   │   │   └── fallback.ts       imports mock.json for static builds
│   │   ├── components/           reusable UI atoms
│   │   └── sections/             Hero, Authors, Leaderboard, ResultsExplorer, …
│   ├── vite.config.ts
│   └── package.json
└── server/
    ├── app/
    │   ├── main.py               FastAPI app
    │   ├── schemas.py            Pydantic response models
    │   ├── data/mock.json        single source of truth for all data
    │   └── routers/              stats, leaderboard, models, pde-types, …
    └── requirements.txt
```

## API endpoints

| Method | Path                         | Description               |
| ------ | ---------------------------- | ------------------------- |
| GET    | `/api/health`                | liveness check            |
| GET    | `/api/stats`                 | hero counters             |
| GET    | `/api/leaderboard?backend=…` | leaderboard rows          |
| GET    | `/api/models`                | model + agent catalog     |
| GET    | `/api/pde-types`             | PDE family definitions    |
| GET    | `/api/findings`              | insight cards             |
| GET    | `/api/authors`               | research team             |
| GET    | `/api/figures`               | paper figure metadata     |
| GET    | `/api/citation`              | title, abstract, BibTeX   |
