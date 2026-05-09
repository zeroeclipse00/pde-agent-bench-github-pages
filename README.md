# PDEAgent-Bench

**PDEAgent-Bench** is a benchmark for evaluating LLM-based agents on partial differential equation (PDE) solving tasks. This repository hosts the official project page, deployed automatically to GitHub Pages via GitHub Actions.

**Live site:** [junhui-li-duke.github.io/pde-agent-bench-github-pages](https://junhui-li-duke.github.io/pde-agent-bench-github-pages/)

## What's in this repo

| Path | Contents |
|---|---|
| `web/` | Source code for the project page (React frontend + FastAPI dev server) |
| `docs/` | Built static site — served by GitHub Pages |
| `.github/workflows/` | CI/CD: builds the frontend and deploys `docs/` on every push to `main` |

## Deployment

Pushing to `main` automatically builds and deploys the site. No manual steps needed.

To update site content (benchmark results, author info, figures, etc.), edit `web/server/app/data/mock.json` and push.

For local development and technical details, see [web/README.md](web/README.md).
