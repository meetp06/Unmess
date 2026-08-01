# Messy Ops Reconciler

A hackathon-ready reconciliation workspace. The React dashboard accepts a bank-statement CSV and receipt images, then the FastAPI service extracts receipt fields with Gemini vision and matches them to transactions.

## Project layout

- `frontend/` — React, Vite, and Tailwind CSS workspace.
- `backend/` — FastAPI REST API, temporary receipt storage, OpenAI vision extraction, and RapidFuzz reconciliation.

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- A Gemini API key with access to your selected image-capable model

## 1. Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
```

Set these values in `backend/.env` (the file is ignored by git):

```dotenv
GEMINI_API_KEY=your_server_side_api_key
GEMINI_VISION_MODEL=gemini-3.6-flash
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Then run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Check it at `http://localhost:8000/api/health`; interactive API docs are at `http://localhost:8000/docs`.

## 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`). `VITE_API_URL` in `frontend/.env.local` points the app at FastAPI; set it to the deployed API URL when you deploy.

## How the apps connect

The frontend only uses the functions in `frontend/src/services/api.js`:

1. `uploadBankStatement(file)` posts the selected CSV and receives `session_id` plus validated transactions.
2. `uploadReceipts(files, sessionId)` posts JPG/PNG files with that session ID.
3. `runReconciliation(sessionId)` calls `/api/extract-receipts`, then `/api/reconcile`, and returns the report for the table and drawer.

The API keeps each session's receipt images in the system temporary directory. It clears sessions after 24 hours and clears active temporary files when the server stops. Never put `GEMINI_API_KEY` in the frontend or source control.

## CSV format

The bank statement must be UTF-8 CSV with exactly these required header names (additional columns are allowed):

```csv
Transaction_ID,Date,Vendor,Amount_USD
TX-80421,2026-07-29,Acme Office Supply,184.50
TX-80418,2026-07-28,Northstar Coffee,42.80
```

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/upload/bank-statement` | Validates and stores one CSV; starts a session |
| `POST` | `/api/upload/receipts` | Stores one or more JPG/PNG images for a session |
| `POST` | `/api/extract-receipts` | Uses Gemini vision to extract vendor, date, and amount |
| `POST` | `/api/reconcile` | Generates `matched`, `amount_discrepancy`, and `missing_receipt` results |

## Demo files

Ready-to-upload demo assets are in [`demo/`](demo/README.md): a quick five-transaction scenario and an expanded 12-transaction scenario, with eight fictional receipt PNGs. The expanded run demonstrates six matches, two amount discrepancies, and four missing receipts.

## Test and build

```bash
# backend, with its virtual environment active
pytest

# frontend
cd frontend
npm run build
```

The backend requires a configured Gemini key only for `/api/extract-receipts`; upload and CSV validation tests run without one.
