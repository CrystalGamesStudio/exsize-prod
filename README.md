# ExSize

A gamified family task management app that motivates children through rewards, avatars, and friendly competition.

## Overview

ExSize helps families turn chores into fun. Parents assign tasks with ExBucks rewards, children complete them to earn currency, unlock avatar items, and climb the family leaderboard.

## Tech Stack

### Backend
- **FastAPI** — Modern async Python web framework
- **SQLAlchemy** — ORM for database models
- **PostgreSQL** (Neon) — Production database
- **SQLite** — Local development database
- **JWT + bcrypt** — Authentication

### Frontend
- **React 19** + **Vite** — Modern build tooling
- **TypeScript** — Type safety
- **TailwindCSS** + **shadcn/ui** — Styling
- **React Router** — Navigation
- **PWA** — Offline support

## Project Structure

```
exsize-prod/
├── src/exsize/          # Backend FastAPI app
│   ├── routers/         # API endpoints
│   ├── models.py        # SQLAlchemy models
│   ├── database.py      # DB connection
│   ├── security.py      # Auth utilities
│   └── app.py           # FastAPI app entry
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── layouts/     # Layout wrappers
│   │   └── api.ts       # API client
├── tests/               # Backend tests
└── plans/               # Implementation plans
```

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- [uv](https://github.com/astral-sh/uv) (Python package manager)

### Backend

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn --app-dir src exsize.app:app --reload

# Run tests
uv run pytest tests/ -x
```

### Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build
```

## Database

Local development uses SQLite. The database file is `exsize.db`.

**After schema changes**, delete `exsize.db` and restart the server to recreate tables.

Browse the database:
```bash
uvx datasette exsize.db
```

## Deployment

- **Backend**: Render (auto-deploys from `main` branch)
- **Database**: Neon PostgreSQL
- **Cold starts**: ~30s on free tier

Environment variables on Render:
- `DATABASE_URL` — Neon connection string
- `CORS_ORIGINS` — Allowed frontend origins
- `PORT` — Server port

## License

Proprietary — Crystal Games Studio
