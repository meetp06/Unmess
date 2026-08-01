# Security review — Messy Ops Reconciler

## Executive summary

No committed API keys or known dependency vulnerabilities were found. The frontend production build and backend test suite pass. The project is safe to place in source control **provided the ignored `backend/.env` file is never force-added**.

This is a hackathon/local-workspace app. Before public deployment, address the production findings below: the API has no user authentication or rate limiting, and image upload validation should be strengthened.

## Critical findings

No critical findings were identified.

## High findings

### SEC-001 — Public API endpoints have no authentication or rate limiting

- Rule ID: `FASTAPI-AUTH-001`, `FASTAPI-LIMITS-001`
- Severity: High for public deployment; acceptable only for a local, single-user demo.
- Location: `backend/app/main.py`, routes beginning at lines 69, 86, 163, and 186; paid provider request at `backend/app/services.py:206`.
- Evidence: Upload, extraction, reconciliation, and receipt-image routes do not use a FastAPI auth dependency. `/api/extract-receipts` can invoke Gemini for every stored receipt.
- Impact: A public API could be used by unauthenticated visitors to upload files, consume temporary storage, and spend the Gemini API budget.
- Fix: Require authentication at the API/router boundary, enforce per-user ownership of session IDs, and add rate/request limits at the reverse proxy or API gateway.
- Mitigation: Do not expose the backend publicly until those controls are in place; keep it bound to localhost for the hackathon demo.
- False-positive notes: This does not affect a localhost-only demonstration with a trusted user.

## Medium findings

### SEC-002 — Receipt image URLs are bearer-like capabilities

- Rule ID: `FASTAPI-AUTHZ-001`, `FASTAPI-FILES-001`
- Severity: Medium for public deployment.
- Location: `backend/app/main.py:148-160`, with URLs returned from `backend/app/main.py:131-139`.
- Evidence: Receipt images are served when a caller knows a random session ID and receipt ID; no user/session authorization is applied.
- Impact: A leaked reconciliation response or image URL could expose a receipt until the temporary session expires.
- Fix: Apply authenticated session ownership checks before returning receipt metadata or images.
- Mitigation: Do not share API responses or image URLs outside the current local demo session.
- False-positive notes: The identifiers are random UUID values and are not practically enumerable, but a leaked URL remains usable.

### SEC-003 — Image validation relies on file extension and a short signature

- Rule ID: `FASTAPI-UPLOAD-001`
- Severity: Medium.
- Location: `backend/app/services.py:115-130`; uploaded file bytes are read at `backend/app/main.py:112`.
- Evidence: The validator checks filename suffix, content type, and PNG/JPEG prefix bytes, but does not decode the image or limit pixel dimensions.
- Impact: Malformed, polyglot, or decompression-bomb images can be stored and forwarded to the vision provider; oversized multipart requests can also consume resources before the application-level byte check.
- Fix: Verify images with a decoder such as Pillow, enforce a maximum pixel count, read only up to the configured size limit, and configure a request-body limit at the reverse proxy.
- Mitigation: Keep uploads restricted to trusted local demo users and retain the existing 10 MB per-file cap.
- False-positive notes: The current suffix, MIME, signature, file-count, and byte-size checks already block basic invalid upload attempts.

### SEC-004 — Production security headers, host allowlisting, and docs policy are not configured in application code

- Rule ID: `FASTAPI-HEADERS-001`, `FASTAPI-HOST-001`, `FASTAPI-OPENAPI-001`, `REACT-HEADERS-001`
- Severity: Medium for public deployment.
- Location: `backend/app/main.py:42-61`; `frontend/index.html:1-14`.
- Evidence: The app has strict local CORS origins and disables credentialed CORS, but does not add `TrustedHostMiddleware`, response security headers, or a production policy for FastAPI docs/OpenAPI.
- Impact: The deployed service lacks visible defense-in-depth controls and may expose implementation detail through interactive docs.
- Fix: Set security headers and trusted hosts at the reverse proxy/CDN (preferred), disable or protect docs in production, and verify runtime headers after deployment.
- Mitigation: Use a hosting platform or proxy that sets CSP, `X-Content-Type-Options`, frame protection, and referrer policy.
- False-positive notes: These controls may be configured by future hosting infrastructure; no deployment configuration exists in this repository to verify it.

## Low findings

### SEC-005 — JavaScript dependency manifest uses `latest`

- Rule ID: `REACT-SUPPLY-001`
- Severity: Low.
- Location: `frontend/package.json:10-13,15-17`.
- Evidence: React, Vite, and related packages use the `latest` tag. A lockfile is present, so current installs are reproducible, but a future `npm install` can update them unexpectedly.
- Impact: Unexpected upgrades increase supply-chain and regression risk.
- Fix: Replace `latest` with reviewed semver ranges or exact versions, and use `npm ci` in CI.
- Mitigation: Retain and commit `frontend/package-lock.json`; review lockfile changes before merging.

## Verified controls and checks

- `.gitignore` ignores `.env`, virtual environments, node modules, build output, and `frontend/.env.local`.
- Repository source scan found no hard-coded Gemini/OpenAI-style key values outside the ignored environment file.
- Client configuration uses only `VITE_API_URL`, a public backend base URL; the Gemini API key stays server-side in `backend/.env`.
- CORS is an explicit localhost allowlist with credentials disabled (`backend/app/main.py:48-61`).
- Upload filenames are sanitized to their basename and stored with server-generated UUID names (`backend/app/main.py:111-125`, `backend/app/store.py:63-65`).
- `npm audit --omit=dev --audit-level=high` found **0 vulnerabilities**.
- `pip-audit -r backend/requirements.txt` found **no known vulnerabilities**.
- `pytest` passed 5/5 backend tests; `npm run build` completed successfully.
