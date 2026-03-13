
# Timesheet Frontend (v2.0.0)

UI layer for the Personal Timesheet Tracker desktop app.

## Repository Split (GitHub)
- UI and backend are stored in separate GitHub repositories.
- This repository contains only frontend code.
- Backend repository provides API + desktop launcher (`run.py`).
- Recommended local folder layout:
  - `...\backend`
  - `...\frontend`

## Prerequisites (Windows)
- Node.js `18+`
- npm
- Backend repo available locally (for full desktop run flow)

## UI Setup
```bat
cd frontend
npm install
```

## Build UI (Manual)
```bat
npm run build
```

The UI build is also automatically handled by the unified `backend/build.bat` script.

## Recommended Run Flow (Backend + UI Together)
1. Build UI in this repo:
```bat
cd frontend
npm run build
```

2. Start app from backend repo:
```bat
cd ..\backend
.\.venv\Scripts\activate.bat
python run.py
```

3. Confirm backend log:
- `Using UI file: ...\frontend\dist\index.html`

## Development Mode (UI + API in Separate Terminals)
Terminal 1 (Backend API):
```bat
cd backend
.\.venv\Scripts\activate.bat
uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2 (Frontend):
```bat
cd frontend
npm run dev
```

Open `http://localhost:3000`.

## Scripts
```bat
npm run dev
npm run build
```
  
