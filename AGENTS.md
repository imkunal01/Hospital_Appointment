# Project rules: Hospital Appointment App (assessment submission)

## Structure
- One repo, two independent projects: /backend (Node+Express+TS, raw SQL via `pg`) and /mobile (React Native+Expo+TS).
- No Prisma, no Docker. Postgres is hosted on Supabase, API on Render.

## Non-negotiables (from the assessment brief)
- Synthetic data only. Never real patient info. Reports are METADATA only: no diagnosis or treatment text anywhere.
- Never commit secrets. Only .env.example. Never log tokens, passwords, or PII.
- Refresh token in expo-secure-store only. Access token in memory only.
- UI must never show success before the server confirms (HTTP 201/200). Offline = read-only cache; all writes disabled.
- Every list/detail screen has loading, empty, and error(+retry) states.
- Controls have accessibilityLabel/accessibilityRole and minimum 48dp touch targets.
- Parameterized SQL only. Every appointment query is scoped to the authenticated patient (404 for others' records).
- Error body shape: { "error": { "code", "message", "details?" } }
  Codes: VALIDATION_ERROR, UNAUTHORIZED, TOKEN_EXPIRED, FORBIDDEN, SLOT_TAKEN, NOT_FOUND, RATE_LIMITED, INTERNAL.
- Request only necessary Android permissions (INTERNET only unless justified).

## Definition of Done for every task
1. Code works and tests pass (run them and show the summary).
2. Docs updated in the SAME change: docs/api-contract.md, docs/architecture.md, README.md, docs/technical-note.md as relevant.
3. Append an entry to docs/ai-usage-and-attribution.md (what AI generated, what the owner reviewed/changed).
4. Keep code simple and readable. The owner must be able to explain every line and modify it live.

## Style
- Backend layering: route -> service -> db. Mobile layering: screen -> hook -> api client.
- No feature beyond the current phase's list. Do not add libraries without stating why.
- Small commits: feat: / fix: / test: / docs:
