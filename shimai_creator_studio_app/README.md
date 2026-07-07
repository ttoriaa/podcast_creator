# Shimai Creator Studio App (Prototype)

This folder is a development-ready scaffold for an interactive creator operations console.

## Pages

- pages/dashboard.html
- pages/brainstorm.html
- pages/scripts.html
- pages/publish.html

## Shared Assets

- assets/css/studio.css
- assets/js/studio-data.js
- assets/js/studio-core.js
- page-level scripts in assets/js/

## Run

Open shimai_creator_studio_app/index.html in a browser, or open pages/dashboard.html directly.

## Current Scope

- Interactive tasks on Dashboard (filter + checkbox state persistence)
- Topic selection and filtering on Brainstorm
- Brainstorm supports API-first topic generation from RSS + GLM, with local fallback
- Script editor with autosave + snapshots on Scripts
- Scripts page supports backend draft generation, with local fallback
- Publish checklist and state gating on Publish

## Persistence

Uses localStorage key: shimai_creator_studio_state

## Backend (Optional but Recommended)

Run backend API from ../backend for RSS and GLM generation.
If backend is unavailable, Brainstorm and Scripts pages continue to work with local fallback templates.

## API Base Configuration

Frontend API base can be configured in this priority:

1. URL query parameter: `?api_base=http://127.0.0.1:8000`
2. localStorage state: `apiBase`
3. Global variable: `window.STUDIO_API_BASE`
4. Default fallback: `http://127.0.0.1:8000`
