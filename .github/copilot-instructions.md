# Copilot Instructions

## Purpose
This repository contains Netlify serverless functions used by the church website API endpoints.

## Tech Stack
- Node.js serverless functions (`.mjs`, ESM style)
- Netlify Functions runtime
- `node-fetch` for remote HTTP calls
- `nodemailer` for contact email delivery
- Shared response helper in `netlify/functions/util/response.mjs`

## Core Workflow
1. Make minimal, targeted edits.
2. Preserve existing function signatures and endpoint behavior unless asked otherwise.
3. Keep the current style: simple async handlers, explicit status codes, and small helper functions.

## Repository-Specific Rules
- Every function should export `handler` and return via `generateResponse(event, statusCode, body)`.
- Do not bypass `generateResponse`; it centralizes CORS behavior and origin handling.
- Keep response bodies consistent with current consumers (plain text vs JSON string).
- Maintain compatibility with the current Netlify setup in `netlify.toml` (functions directory and bundling assumptions).
- Prefer extending existing utility patterns under `netlify/functions/util/` before introducing new abstractions.
- When editing `contact.mjs`, keep credentials and addresses environment-driven (`GMAIL_USERNAME`, `GMAIL_PASSWORD`, `CONTACT_EMAIL`).

## Validation Commands
Run relevant checks after changes:
- `npm run live` (project script currently available)
- If adding new scripts (lint/test), document and run them in the same change.

## Reliability and Security
- Validate untrusted input early and return `400` for malformed requests.
- Use explicit failure messages and status codes for upstream fetch failures.
- Never hardcode secrets or tokens.
- Keep external fetch usage bounded and predictable; avoid adding expensive retries or scraping loops unless requested.

## Dependency and API Guidance
- Prefer built-in Node capabilities and existing packages before adding dependencies.
- If a third-party API or library behavior is version-sensitive, use Context7 to confirm exact usage before implementing changes.

## Out of Scope by Default
Unless explicitly requested, do not:
- Change endpoint URLs or payload contracts.
- Rework deployment configuration.
- Replace shared response/CORS handling.
- Introduce broad refactors across all functions.
