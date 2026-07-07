# Podcast Creator Backend

## What It Provides

- POST /api/rss/sync: pull episode title/description/audio_url from RSS
- POST /api/topics/generate: generate topic candidates and outlines via GLM (fallback if model fails)
- POST /api/scripts/generate: generate script first draft via GLM (fallback if model fails)
- POST /api/audio/semantic: pull RSS audio URLs and return semantic analysis + transcript placeholder
- GET /api/health: health and capability flags

## Setup

1. Open terminal in backend folder.
2. Create and activate a Python virtual environment.
3. Install dependencies.
4. Copy `.env.example` to `.env` and fill values.
5. Run server:

```bash
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

## Frontend Integration

Frontend pages call `http://127.0.0.1:8000` directly.
If backend is down or model fails, UI uses local fallback templates.
