# Messy Ops Reconciler — Frontend

An ops team uploads a bank-statement CSV and a folder of receipt images. The backend OCRs
the receipts and matches them to CSV rows. This UI shows what matched, what didn't, and
what a human needs to look at.

This repo is **frontend only**. It runs standalone against a mock data layer and switches
to the real API by flipping one environment variable.

---

## Setup

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # http://localhost:5173
```

`npm run build` produces `dist/`; `npm run preview` serves it.

Requires Node 20+. Built with React 19, Vite 8, Tailwind v4, react-router 7, and
`@tanstack/react-virtual`.

### Environment

`.env.example`:

```
# Base URL of the reconciliation backend.
# Leave unset to force mock mode regardless of VITE_USE_MOCKS.
VITE_API_URL=http://localhost:8000

# Serve fixture data instead of calling the backend.
# "true" enables mocks. Any other value uses the live API.
# The URL param ?mock=1 also enables mocks without editing this file.
VITE_USE_MOCKS=true
```

Mocks are on when `VITE_USE_MOCKS=true`, when the URL has `?mock=1`, **or** when
`VITE_API_URL` is unset — that last case stops a fresh clone from silently POSTing to its
own origin and 404ing. Whenever mocks are active, a `MOCK DATA` pill sits in the header,
so which mode you are in is never a guess.

### Running in mock mode

```bash
npm run dev          # .env already sets VITE_USE_MOCKS=true
```

Then: **Uploads → Load sample files → Run reconciliation**. The sample button stages the
fixture statement and receipts as real `File` objects, so the demo goes through the same
upload → run path as production. Turning mocks on changes the data source and nothing
else about how the app behaves — there is no hidden auto-populate.

#### Demo switches (mock mode only)

| URL param | Effect |
|---|---|
| `?mock=1` | Force mocks on regardless of `.env` |
| `?rows=500` | Generate a 500-row report — proves the table stays smooth |
| `?fail=reconcile` | Force an API error so the retry path is demoable (`upload` and `receipts` also work) |
| `?slow=1` | 4× latency, to see the loading states |

Combine them: `http://localhost:5173/report?rows=500&slow=1`

---

## THE CONTRACT

`runReconciliation()` resolves to this shape. The UI is built to it exactly and invents no
fields.

```json
{
  "summary": {
    "matched": 38,
    "discrepancy": 6,
    "missing_receipt": 4,
    "needs_review": 3,
    "total_variance": -184.32,
    "currency": "USD"
  },
  "rows": [
    {
      "id": "txn_0001",
      "status": "discrepancy",
      "confidence": 0.91,
      "reason": "Vendor matched, amount differs by $12.00",
      "date": "2026-07-14",
      "csv": {
        "transaction_id": "TXN-88213",
        "vendor": "AMZN MKTP US*2K4L9",
        "amount": 142.00,
        "date": "2026-07-14"
      },
      "receipt": {
        "filename": "IMG_4471.jpg",
        "image_url": "/mock/receipts/IMG_4471.jpg",
        "vendor": "Amazon Marketplace",
        "amount": 130.00,
        "date": "2026-07-13",
        "line_items": [
          { "description": "USB-C cable", "amount": 18.00 }
        ],
        "ocr_confidence": 0.88
      }
    }
  ]
}
```

### Rules the backend must hold to

- **`status` is exactly one of** `"matched"`, `"discrepancy"`, `"missing_receipt"`,
  `"needs_review"`. Nothing else, ever. An unrecognised value renders as a neutral grey
  badge rather than crashing, but it is a bug on your side, not a supported state.
- **When there is no receipt, `receipt` is `null`** — not `{}`, not omitted. Every screen
  handles null and renders an em dash (`—`); nothing ever prints `undefined`.
- `confidence` (match) and `receipt.ocr_confidence` are **different measurements** and are
  displayed separately. Match confidence answers "does this receipt belong to this
  transaction". OCR confidence answers "did we read the paper correctly". Do not merge
  them into one number.
- `reason` is free text shown verbatim to the user. Make it specific and consistent with
  the row's own numbers — a row that says "differs by $12.00" while its amounts differ by
  $9 is worse than no reason at all.
- `summary` counts must agree with the rows array. `total_variance` is
  `Σ(receipt.amount − csv.amount)` over rows that have a receipt; rows with a null receipt
  contribute nothing, because a missing receipt is unknown, not zero.
- Amounts are plain numbers in `summary.currency`. Negative values are legitimate
  (refunds), so is `0.00`, and so are five-figure amounts.
- Dates are plain `YYYY-MM-DD` calendar dates with no timezone.

### Endpoints

| Function | Request |
|---|---|
| `uploadBankStatement(file)` | `POST /api/bank-statement` — multipart, field `file` |
| `uploadReceipts(files)` | `POST /api/receipts` — multipart, repeated field `files` |
| `runReconciliation()` | `POST /api/reconcile` — JSON `{}`, resolves to the contract above |

All three live in `src/services/api.js` and route through the mock layer when mocks are
on. No component calls `fetch`.

**Errors:** any non-2xx is turned into an `ApiError` whose `message` is the most specific
text available — `error`, `message`, or `detail` from a JSON body, else the response text,
else `status + statusText`. That message is shown on screen verbatim next to a Retry
button, so a useful error string on your side becomes a useful error on the user's screen.

---

## Fixtures

`src/mocks/fixtures.js` generates 51 rows from a fixed seed (no `Math.random()`, so a
reload during a demo produces identical data). The summary is **computed from the rows**,
never hand-written, and at the default row count it reproduces the contract's numbers
exactly: `38 / 6 / 4 / 3` and `-184.32`.

The fixtures are deliberately ugly, because real bank data is:

- CSV vendors are raw statement descriptors — `SQ *BLUE BOTTLE COFFE`,
  `TST* MAMA'S KITCH`, `AMZN MKTP US*2K4L9`, `POS DEBIT WHOLEFDS MKT #10259 SEATTLE WA` —
  truncated mid-word, all caps, with processor prefixes and store numbers. Receipt vendors
  are the clean human names, so the fuzzy match is visibly non-trivial.
- A negative amount (refund), a `$0.00` row, and one over `$10,000`.
- A receipt dated a day before its CSV row.
- A 66-character vendor string, to prove the table layout cannot shift.
- Four rows with `receipt: null`.
- One row with `ocr_confidence: 0.41`, status `needs_review`.

Receipt images are five hand-authored SVGs in `public/mock/receipts/`. To swap in real
photographs, drop them in that folder and update the `receipt:` filenames in
`src/mocks/vendors.js` (and the `file:` fields in the hand-written edge rows in
`fixtures.js`).

---

## Why `needs_review` looks different

`discrepancy` is a confident finding: the system knows what is wrong. `needs_review` is an
admission that it does not know. Styling the second as a milder version of the first would
misrepresent both, so the distinction is structural, not just a hue:

| | discrepancy | needs_review |
|---|---|---|
| Row marker | 2px **solid** red left border | 2px **dashed** amber left border |
| Badge | solid fill, `!` glyph | dashed ring, `?` glyph |
| Receipt amount | shown as fact, red delta | prefixed `≈` and dimmed — the number is not trusted |
| Drawer | field diffs with explicit deltas | an amber "the system could not decide this one" note **above** the numbers |

Solid means we know. Dashed means we don't.

---

## Structure

```
src/
  app/         AppShell, Sidebar, Header, run button
  routes/      DashboardPage (triage overview), UploadsPage, ReportPage
  features/
    summary/   status cards + total variance
    table/     columns, sort/filter model, virtualized table, status badge
    drawer/    details drawer, receipt pane, field comparison, confidence bars
    uploads/   drop zones, thumbnails, rejection notices
  components/  Button, Tooltip, ErrorPanel, EmptyState, Skeleton
  services/    env, http (ApiError), api  ← the only network layer
  lib/         format, csv, files, status, row derivations
  mocks/       rng, vendors, fixtures, endpoint mocks, sample files
```

Conventions worth keeping: `lib/status.js` is the single place a status maps to a colour;
components never import fixtures or `fetch`; every formatter in `lib/format.js` tolerates
null and returns an em dash.

---

## Behaviour notes

- **Default sort** is review priority: `needs_review` → `discrepancy` → `missing_receipt`
  → `matched`, then by largest dollar variance. Matched rows are the least interesting
  thing on the page and sort last. Click a column to sort by it; a third click returns to
  review priority.
- **Filter and search live in the URL** (`?status=discrepancy&q=amazon`), so a filtered
  view can be pasted to a colleague.
- **The table is virtualized**, so 500 rows costs the same as 20. Column widths come from
  the header (`table-fixed`), so content can never shift the layout.
- **Keyboard:** rows are focusable, Enter/Space opens the drawer, ↑/↓ move between rows
  with the drawer open, Escape closes it and returns focus to the row.
- **Responsive:** the sidebar is 240px at ≥1024px, a 64px icon rail at 768–1023px, and
  off-canvas below 768px. Columns drop tightest-first as the viewport narrows, and every
  dropped value reappears as a second line on the row — so nothing is lost and the page
  never scrolls sideways.
- The **Run reconciliation** button is disabled until both a CSV and at least one receipt
  are staged, and hovering it says which one is missing.
