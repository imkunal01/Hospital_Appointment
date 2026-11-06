# Hospital Appointment Android App — Phased Execution Plan

> Assessment: Algions AI Labs — Android & Mobile App Development (Hospital Management domain)
> Timeline: 5 working days (brief allows 15; this plan compresses it)
> Stack: React Native (Expo) + Node.js (Express, TypeScript) + PostgreSQL on Supabase, API hosted on Render
> Method: every phase ships **code + tests + docs together**. A phase is not done until all three are committed.

---

## 0. How to use this plan

1. Put `AGENTS.md` (section 4) in the repo root before writing any code, so Antigravity follows the same rules in every task.
2. Work phase by phase. For each phase, paste the **Antigravity prompt** (included in each phase), review the plan it proposes, then let it execute.
3. Do not move on until the phase's **Exit Gate** is satisfied.
4. After each phase, read the diff and be able to explain it aloud. Shortlisted candidates do a 15-minute walkthrough and a 10-minute live change/debug task on their own code. AI output you cannot explain scores nothing.

---

## 1. What the brief requires (condensed, verified against the document)

### 1.1 Journey (must work end to end)
- Browse departments/doctors and view available appointment slots.
- Book, reschedule and cancel an appointment; show a clear **reference** and current **status**.
- Show visit/report **metadata** from the backend, with **no diagnosis or treatment recommendations**.
- Show upcoming/past appointments and notification/reminder preferences (simulation allowed).
- Synthetic patient records, secure session handling, role-safe access.

### 1.2 Technical expectations
- Installable Android APK (or reproducible build command).
- Backend you build or documented mock API. Do not hard-code the business dataset in screen components.
- Secure sign-in; tokens in platform secure storage; never log secrets.
- Coherent navigation, readable forms, accessibility labels and touch targets, clear loading/empty/success/error states.
- Persist app state, cache useful read-only data, **clearly distinguish offline actions from server-confirmed bookings**.
- Handle timeouts, malformed responses, session expiry, repeated taps without crashing or corrupting state.
- Minimal permissions, synthetic data only.
- Unit/widget/UI tests for key logic, **including at least one network/offline or validation failure case**.

### 1.3 Acceptance tests you must demonstrate
| # | Test | Proven by |
|---|------|-----------|
| A1 | Slot taken before confirmation -> actionable error and refreshed availability | Backend concurrency test + mobile `SLOT_TAKEN` handler + video |
| A2 | Install on a clean emulator/device from the submitted APK/build steps | Day 5 clean-install test |
| A3 | Complete main journey to confirmation/status | Video |
| A4 | One offline/API-failure or invalid-input case, recover without crash | Airplane-mode demo + validation test |
| A5 | No success state before backend confirms | `onSuccess`-only navigation + component test |

### 1.4 Required submission package
- Source repo, installable APK, repeatable build instructions
- README: stack, architecture, minimum Android version, permissions, API configuration, demo credentials, known limitations
- Backend source/API contract, sample synthetic data, test credentials
- Screenshots + 3-5 minute video (main journey + one failure/offline scenario)
- Tests + evidence of execution + how to reproduce the clean install
- Technical note: secure storage, state persistence, accessibility, release-readiness improvements
- Form fields: identification, assignment confirmation, repo URL/branch/final commit ID, video link, docs links, stack + limitations, **AI tools used + purpose + attribution**, declarations, APK link, Android version/device tested, backend URL

### 1.5 Rubric (100 marks) and where this plan earns each
| Criterion | Marks | Earned in |
|-----------|-------|-----------|
| Business journey and correctness | 25 | Phases 2, 3, 4 |
| Architecture, API integration, state/data handling | 20 | Phases 1, 2, 3, 4 |
| UI/UX and accessibility | 15 | Phases 3, 4 |
| Reliability, offline, lifecycle | 15 | Phase 4 |
| Security, privacy, validation | 10 | Phases 1, 2, 3 |
| Testing and build quality | 10 | Every phase + Phase 5 |
| Documentation and technical explanation | 5 | Every phase + Phase 5 |

### 1.6 Rules that cost marks if broken
- Do not commit `.env`, passwords, tokens, private keys, personal data. Only `.env.example`.
- A broken or permission-blocked link may be treated as missing evidence.
- Build a strong, correct MVP. State clearly what is unfinished.

---

## 2. Final architecture and decisions

| Area | Decision | Reason |
|------|----------|--------|
| Repo | One Git repo, two independent folders: `backend/`, `mobile/` (no shared workspace tooling) | Single repo link, clean separation |
| Mobile | React Native + Expo + TypeScript | Fast dev loop (Expo Go), EAS builds APK without local Android SDK |
| Navigation | Expo Router or React Navigation (pick one, stay consistent) | Auth-gated stacks + tabs |
| Server state | TanStack Query + persisted cache (AsyncStorage persister) | Caching, retries, offline reads |
| Secure storage | `expo-secure-store` (refresh token); access token in memory only | Keystore-backed |
| Network detection | `@react-native-community/netinfo` | Offline banner, disable writes |
| Backend | Node.js + Express + TypeScript + Zod | Validation at the edge |
| Database | PostgreSQL on **Supabase**, accessed with the `pg` package, **raw parameterized SQL** (no Prisma) | Hosted, no Docker, simple transactions |
| Migrations | Plain SQL files in `backend/sql/` run in Supabase SQL editor | Reproducible, no tooling |
| Auth | Own JWT auth (not Supabase Auth): access token 15 min + hashed refresh token | You can explain every line |
| DB security | Row Level Security enabled on all tables with **no policies** | Supabase's public API cannot expose data; Node backend connects with privileged role |
| Hosting | API on **Render** free tier | Reviewer's APK works instantly |
| Build | **EAS Build**, `preview` profile with `buildType: apk` | No local Android Studio needed |
| Tests | Jest + Supertest (backend); Jest + React Native Testing Library (mobile) | Meets brief |
| Offline policy | Reads cached; **all writes disabled offline** | Makes "no false success" trivially true |
| Reminders | Preference stored on server; reminders simulated, documented as limitation | Allowed by brief |

### 2.1 Free-tier gotchas (plan for them now)
1. **Render sleeps after inactivity (cold start 30-60 s).** Use ~30 s client timeout, call `GET /health` on app launch, show "Server is waking up..." after 5 s. Warm it up before recording the demo and before submitting. Optional: free UptimeRobot ping every 5 min.
2. **Supabase connection string:** use the **pooler** (Session/Transaction) connection string, not the direct `db.<ref>.supabase.co` host, which is IPv6-only and often fails from Render.
3. **Supabase free projects pause after ~7 days of inactivity.** Check it is awake before submitting; note it in README.
4. **Expo Go limitations:** avoid `expo-notifications` for development. Use stored preferences and simulated reminders.
5. **Emulator networking:** if testing a local backend, Android emulator uses `10.0.2.2` for host localhost. With Render deployed you avoid this.
6. **Time zones:** store slots in UTC, format on the device, state this in README.

---

## 3. Repository layout

```
hospital-appointment/
├── AGENTS.md                         # rules for Antigravity (section 4)
├── README.md                         # required headings (section 5)
├── .gitignore
├── docs/
│   ├── api-contract.md
│   ├── architecture.md               # Mermaid: ER, component, booking sequence, mobile layers
│   ├── technical-note.md             # secure storage, persistence, accessibility, release-readiness
│   ├── testing.md                    # how to run tests + manual failure scenarios
│   ├── demo-script.md                # video shot list
│   ├── ai-usage-and-attribution.md   # AI tools, purpose, per-phase log, libraries
│   ├── submission-form-answers.md    # every form field with final values
│   ├── submission-checklist.md
│   ├── screenshots/
│   └── test-evidence/
├── backend/
│   ├── sql/ (001_schema.sql, 002_seed.sql)
│   ├── src/
│   │   ├── config/ (env.ts, db.ts)
│   │   ├── middleware/ (auth, validate, errorHandler, rateLimit)
│   │   ├── modules/
│   │   │   ├── auth/ (routes, service, schema)
│   │   │   ├── catalog/ (departments, doctors, slots)
│   │   │   ├── appointments/
│   │   │   ├── reports/
│   │   │   └── preferences/
│   │   ├── utils/ (AppError, reference generator, hashing)
│   │   └── app.ts, server.ts
│   ├── tests/
│   ├── .env.example
│   └── package.json
└── mobile/
    ├── app/ or src/screens/
    ├── src/
    │   ├── api/ (client, interceptors, endpoints, schemas)
    │   ├── auth/ (session store, secure storage)
    │   ├── hooks/ (useDoctors, useSlots, useBook, useAppointments...)
    │   ├── components/ (Button, Input, ScreenState, StatusBadge, OfflineBanner)
    │   ├── storage/ (query persister)
    │   ├── theme/
    │   └── utils/ (errors, dates)
    ├── __tests__/
    ├── app.json, eas.json
    ├── .env.example
    └── package.json
```

---

## 4. `AGENTS.md` (paste into repo root; also into `.agent/rules/` if Antigravity uses it)

```md
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
```

---

## 5. README required headings (create the skeleton in Phase 0)

1. Overview and assigned project title
2. Tech stack and why
3. Architecture (link to `docs/architecture.md`)
4. Minimum Android version
5. Permissions (table: permission, why needed)
6. API configuration (base URL, env var names, cold-start note)
7. Local setup: backend, mobile
8. Build instructions: reproducible APK (`eas build ...`) and clean-install steps
9. Demo credentials (synthetic patients)
10. Running tests (link to `docs/testing.md`)
11. Documentation index (links to every doc)
12. Known limitations and assumptions
13. AI usage and attribution (link)

---

## 6. Phases

### Phase 0 — Foundation, database and doc skeleton (Day 1, morning)

**Goal:** a working repo, a live database with seed data, and every required doc created as a real skeleton.

**Build**
- Repo with `backend/`, `mobile/`, `docs/`, `.gitignore` (`.env`, `*.keystore`, `node_modules`, build outputs), `AGENTS.md`.
- Supabase project. Create `backend/sql/001_schema.sql`:
  - `users` (id uuid, email unique, password_hash, name, role `PATIENT|ADMIN`, created_at)
  - `refresh_tokens` (id, user_id, token_hash, expires_at, revoked_at)
  - `departments` (id, name)
  - `doctors` (id, department_id, name, specialty, bio)
  - `slots` (id, doctor_id, starts_at timestamptz, ends_at, status `AVAILABLE|BOOKED`) with **UNIQUE (doctor_id, starts_at)**
  - `appointments` (id, reference unique, patient_id, slot_id, status `CONFIRMED|CANCELLED|COMPLETED`, idempotency_key unique, created_at, updated_at)
  - `visit_reports` (id, appointment_id, title, report_type, report_date, file_size_kb) — **metadata only**
  - `reminder_preferences` (user_id pk, enabled, hours_before)
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on every table, no policies
  - Indexes: `slots(doctor_id, starts_at)`, `appointments(patient_id, created_at)`
- `backend/sql/002_seed.sql`: 4-5 departments, ~12 doctors, 14 days of slots, 2 synthetic patients (e.g. `patient1@example.test`), a few report-metadata rows. Use obviously fake data.
- Express + TypeScript skeleton, `pg` pool using the **pooler** URL, Zod-validated env on startup, `GET /health`, central error handler, `AppError` class.

**Docs created now**
- `README.md` skeleton with all headings from section 5 (fill what is known).
- `docs/architecture.md`: Mermaid **ER diagram** from the schema + **component diagram** (Mobile -> Render API -> Supabase Postgres).
- `docs/api-contract.md`: header, base URL, auth scheme, error shape, error-code table.
- `docs/ai-usage-and-attribution.md`: tools used (Antigravity + model name), purpose, per-phase log table, libraries with licences.
- `docs/submission-form-answers.md`: every form field listed with `TODO`.
- `docs/submission-checklist.md`: copy section 8 of this plan.
- `backend/.env.example`, `mobile/.env.example` (placeholders only).

**Tests:** none yet beyond `/health` smoke check.

**Antigravity prompt**
```
Phase 0 goal: repo foundation, Supabase schema + seed, backend skeleton, doc skeletons.
Read AGENTS.md first. Show me your plan before coding.
Implement: backend/sql/001_schema.sql (RLS enabled, no policies, unique (doctor_id, starts_at) on slots),
002_seed.sql (synthetic data only), Express+TS skeleton with pg pool, Zod env validation, /health, AppError + error handler.
Docs: README skeleton with required headings, docs/architecture.md with Mermaid ER + component diagram,
docs/api-contract.md header + error codes, docs/ai-usage-and-attribution.md, docs/submission-form-answers.md, .env.example files.
Do not add anything beyond this list. Append to docs/ai-usage-and-attribution.md.
```

**Exit gate**
- [ ] Schema and seed run cleanly in Supabase SQL editor
- [ ] `/health` returns OK locally and DB connectivity check passes
- [ ] All doc skeletons committed; no secrets in git (`git log -p | grep -i password` sanity check)

---

### Phase 1 — Authentication, read APIs and first deploy (Day 1 afternoon to Day 2 morning)

**Goal:** secure login and catalog endpoints, deployed on Render and reachable from your phone.

**Build**
- `POST /auth/login`: bcrypt compare, return access JWT (15 min) + refresh token (random, store **hash** only, 7-day expiry).
- `POST /auth/refresh`: validate hash + expiry + not revoked, return new access token.
- `POST /auth/logout`: revoke refresh token.
- Middleware: `requireAuth`, `requireRole`, Zod `validate(schema)`, login rate limit, helmet, CORS, request size limit.
- `GET /departments`, `GET /doctors?departmentId=`, `GET /doctors/:id/slots?date=YYYY-MM-DD`.
- **Deploy to Render now**: build `npm ci && npm run build`, start `npm start`, env vars set in Render dashboard (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` or equivalent, `NODE_ENV`). Hit `/health` from your phone's browser.

**Docs in the same phase**
- `docs/api-contract.md`: auth + read endpoints, each with request/response JSON examples and error cases.
- README: API configuration section (base URL, env var names, cold-start note), demo credentials section.
- `docs/technical-note.md`: **Security section** begins — bcrypt, JWT lifetimes, refresh hashing, RLS-without-policies rationale, parameterized queries, rate limiting, no secret logging.

**Tests (Supertest)**
- Login success; login wrong password -> 401 `UNAUTHORIZED`
- Protected route without token -> 401
- Invalid login body -> 400 `VALIDATION_ERROR`
- Departments/doctors/slots return expected shapes

**Evidence:** save test output to `docs/test-evidence/backend-phase1.txt`.

**Antigravity prompt**
```
Phase 1 goal: auth + catalog read APIs + Render deployment config.
Read AGENTS.md. Plan first.
Implement: login/refresh/logout (bcrypt, 15-min access JWT, hashed refresh token), requireAuth, validate middleware,
login rate limit, helmet, CORS, GET /departments, /doctors, /doctors/:id/slots.
Tests: Supertest for login ok/fail, 401 without token, 400 invalid body, catalog shapes.
Docs: api-contract.md (examples + errors), README API config + demo credentials, technical-note.md security section.
Append to docs/ai-usage-and-attribution.md. No extra features.
```

**Exit gate**
- [ ] Deployed Render URL serves `/health` and `/departments` (with token)
- [ ] Tests green, output saved
- [ ] Contract matches real responses

---

### Phase 2 — Booking engine and domain rules (Day 2)

**Goal:** all appointment operations correct under concurrency, repeated taps and ownership rules. Backend feature-complete.

**Build**
- `POST /appointments` with `Idempotency-Key` header:
  1. If an appointment with that key exists for this patient, return it (same reference).
  2. `BEGIN`; `UPDATE slots SET status='BOOKED' WHERE id=$1 AND status='AVAILABLE'`; if `rowCount=0` -> `ROLLBACK`, throw 409 `SLOT_TAKEN`.
  3. `INSERT` appointment with generated reference (e.g. `HA-YYYYMMDD-XXXX`), status `CONFIRMED`; `COMMIT`.
- `GET /appointments?scope=upcoming|past` (own only), `GET /appointments/:id` (own only; 404 otherwise).
- `PATCH /appointments/:id/reschedule` `{ newSlotId }`: one transaction — claim new slot, release old slot, update appointment. If the new slot is taken, 409 and the original is untouched.
- `POST /appointments/:id/cancel`: slot back to `AVAILABLE`, status `CANCELLED`; cancelling an already cancelled appointment is a safe no-op returning current state.
- `GET /appointments/:id/reports`: metadata only.
- `GET /me/preferences`, `PUT /me/preferences` (validated).
- Ownership: every appointment query includes `patient_id = $user`.
- Reject booking slots in the past; reject rescheduling a cancelled/completed appointment (define and document rules).

**Docs in the same phase**
- `docs/api-contract.md`: complete, including the 409 `SLOT_TAKEN` example, idempotency header behaviour, status lifecycle table.
- `docs/architecture.md`: **booking sequence diagram** (Mermaid) showing happy path and conflict path; status state diagram (`CONFIRMED -> CANCELLED`, `CONFIRMED -> COMPLETED`).
- `docs/technical-note.md`: concurrency and idempotency section; "no false success" explained as a server-side guarantee.

**Tests (Supertest)**
- Concurrent double-book: `Promise.all` of two requests for the same slot -> exactly one 201, one 409
- Same `Idempotency-Key` twice -> same reference, one slot consumed
- Patient A cannot read/cancel/reschedule patient B's appointment -> 404
- Reschedule to a taken slot -> 409 and original appointment/slot unchanged
- Cancel twice is safe; cancelled slot becomes bookable again
- Booking a past slot -> 400
- Preferences validation (hours_before range)

**Evidence:** `docs/test-evidence/backend-final.txt`. Redeploy to Render and re-verify the live URL.

**Antigravity prompt**
```
Phase 2 goal: complete backend booking domain.
Read AGENTS.md. Plan first.
Implement: book (Idempotency-Key, transaction, atomic UPDATE ... WHERE status='AVAILABLE', 409 SLOT_TAKEN),
list upcoming/past, detail, reschedule (atomic), cancel (idempotent), reports metadata, preferences.
All appointment queries scoped to the authenticated patient; others' records return 404.
Tests: concurrent double-book, idempotent retry, ownership isolation, reschedule conflict leaves original intact,
double cancel, past-slot rejection, preferences validation.
Docs: complete api-contract.md, Mermaid booking sequence + status diagram in architecture.md, technical-note.md concurrency section.
Append to docs/ai-usage-and-attribution.md.
```

**Exit gate**
- [ ] `npm test` fully green; evidence saved
- [ ] Redeployed; booking works against the live URL (verify with curl/Postman)
- [ ] API contract complete and accurate

---

### Phase 3 — Mobile foundation and main journey (Day 3)

**Goal:** a patient can log in, browse, pick a slot, book, and see a server-confirmed reference and status.

**Build**
- Expo + TypeScript project, navigation: Auth stack (Login) and App tabs (Doctors, Appointments, Profile).
- `src/api/client.ts`: Axios instance, base URL from `EXPO_PUBLIC_API_URL`, **30 s timeout**, `/health` warm-up call on launch, "Server is waking up..." UI if a request exceeds 5 s.
- Refresh interceptor: on `TOKEN_EXPIRED`, call `/auth/refresh` **once** using a shared in-flight promise (parallel requests wait on it), retry the original request; on failure clear session and route to Login.
- `src/auth/`: session store; refresh token in `expo-secure-store`; access token in memory; restore session on launch; never log tokens.
- Shared components: `ScreenState` (loading / empty / error + Retry), `Button` (loading + disabled states), `Input` (label, error text), theme tokens.
- Screens: Login -> Departments -> Doctors list -> Doctor detail with date selector and slot picker -> Booking confirmation dialog -> Confirmation screen (reference + status from the **server response**).
- Booking mutation: generate idempotency key once per attempt; button disabled while pending; navigate to Confirmation **only in `onSuccess`**; on `SLOT_TAKEN` show actionable message and invalidate the slots query.
- Android config: `app.json` with package name, `minSdkVersion` decision recorded, permissions limited to INTERNET.

**Docs in the same phase**
- README: mobile setup, `EXPO_PUBLIC_API_URL`, **permissions table**, **minimum Android version**.
- `docs/technical-note.md`: **Secure storage section** (what is stored where and why; what is never persisted; no secret logging).
- `docs/architecture.md`: mobile layering diagram (screen -> hook -> api client -> interceptor -> backend).
- `docs/screenshots/`: capture login, doctor list, slot picker, confirmation, **slot-conflict error** as you build them.

**Tests (Jest + RNTL)**
- Error-code mapper (backend codes to user messages)
- Auth store: restore from secure storage, clear on logout
- Book button disabled while pending (repeated taps cannot double-submit)
- `SLOT_TAKEN` shows message and triggers slots refetch
- Success screen is not rendered before mutation success

**Antigravity prompt**
```
Phase 3 goal: mobile foundation + main booking journey.
Read AGENTS.md. Plan first.
Implement: Expo+TS, navigation (auth gate + tabs), axios client (30s timeout, /health warm-up, waking-up state),
refresh interceptor with single shared refresh promise, SecureStore session (refresh token only; access token in memory),
ScreenState/Button/Input/theme, Login, Departments, Doctors, Slot picker, Booking, Confirmation.
Booking: idempotency key per attempt, disabled while pending, navigate only on success, SLOT_TAKEN -> message + refetch slots.
Tests: error mapper, auth store, pending-disable, SLOT_TAKEN handling, no success before confirmation.
Docs: README mobile setup + permissions + min Android, technical-note secure storage, mobile layering diagram.
Append to docs/ai-usage-and-attribution.md.
```

**Exit gate**
- [ ] Full booking journey works on your phone (Expo Go) against the Render URL
- [ ] Slot conflict scenario reproduced and handled (use two accounts or two devices)
- [ ] Tests green; screenshots captured; docs updated

---

### Phase 4 — Management, reliability, accessibility and offline (Day 4)

**Goal:** complete the journey (manage appointments) and make the app resilient and accessible. Start the APK build at the end of the day.

**Build**
- My Appointments with Upcoming/Past tabs, pull-to-refresh, empty states.
- Appointment detail: status badge, reference, reschedule (reuses slot picker), cancel with confirmation dialog, report metadata list (title, type, date, size) with a note that no medical advice is shown.
- Reminder preferences screen: toggle + hours-before, saved to the server; reminders documented as simulated.
- Persisted TanStack Query cache (AsyncStorage persister) with sensible `staleTime`/`gcTime`; "Last updated" label on cached data.
- NetInfo: offline banner; **disable Book/Reschedule/Cancel/Save while offline** with an explanatory message.
- Response validation with Zod so a malformed payload becomes a handled error, not a crash.
- Session expiry path verified: expired refresh -> Login with a message.
- Foreground refetch via `AppState`/focus manager; preserve in-progress form state across backgrounding.
- Login form validation (email format, required fields, inline errors).
- Accessibility pass: `accessibilityLabel` + `accessibilityRole` on all interactive controls, 48dp minimum touch targets, adequate contrast, status shown by text plus colour (never colour alone), logical focus/reading order, dynamic text scaling doesn't break layouts.
- Permissions audit: inspect the merged manifest; remove anything beyond INTERNET.
- Repeated-tap safety on every mutating action (reschedule, cancel, save preferences).

**Docs in the same phase**
- `docs/technical-note.md`: **State persistence section** (what is cached, what is not, offline vs server-confirmed distinction); **Accessibility section** (what was done and how it was checked); **Release-readiness improvements** (refresh-token rotation, certificate pinning, crash reporting, push reminders via FCM, CI pipeline, release signing/Play App Signing, rate limiting per user, audit logs, paid-tier hosting without cold starts, offline write queue clearly labelled "pending").
- README: **Known limitations** (reminders simulated, no offline write queue, free-tier cold start, Supabase pause after inactivity, single time zone display).
- `docs/testing.md`: how to run backend and mobile tests, and the manual failure scenarios: airplane mode, slot conflict, expired token, malformed response, server timeout.
- `docs/demo-script.md`: shot list for the video.
- Update screenshots: offline banner, empty state, error state, appointments list, detail, preferences.

**Tests (Jest + RNTL)**
- Offline banner appears; write buttons disabled while offline
- Malformed API response does not crash; error state shown
- Expired session redirects to Login
- **At least one network-failure test with a mocked failing API** (brief requirement)
- Cancel dialog requires confirmation; double-tap cancel only sends one request
- Login validation errors

**Evidence:** `docs/test-evidence/mobile-final.txt`.

**Day-end action:** configure `eas.json` (`preview` profile, `android.buildType: "apk"`), run `eas build -p android --profile preview`. The free queue can take 10-30+ minutes, so start it **today**.

**Antigravity prompt**
```
Phase 4 goal: appointment management, reliability, accessibility, offline.
Read AGENTS.md. Plan first.
Implement: My Appointments (upcoming/past, pull-to-refresh, empty states), detail with reschedule/cancel (confirm dialog),
report metadata list, reminder preferences, persisted query cache + "last updated", NetInfo offline banner disabling all writes,
Zod response validation, session-expiry handling, foreground refetch, login validation,
accessibility labels/roles/48dp targets, manifest permission audit, repeated-tap protection.
Tests: offline disables writes, malformed response handled, expired session -> login, mocked network failure, cancel confirm + single request, login validation.
Docs: technical-note (persistence, accessibility, release-readiness), README known limitations, docs/testing.md, demo-script.md.
Append to docs/ai-usage-and-attribution.md. No extra features.
```

**Exit gate**
- [ ] All five acceptance tests (A1-A5) pass manually on a device
- [ ] Tests green; evidence saved
- [ ] EAS APK build started

---

### Phase 5 — Package, verify, submit (Day 5)

**Goal:** a verified, reviewer-proof submission.

**Tasks**
1. Download the APK from EAS. Test on a **clean emulator or fresh device**: install, follow **only the README**, complete the journey.
2. Record **Android version and device tested** in `docs/submission-form-answers.md`.
3. Upload the APK as a **GitHub Release asset** (or Drive with public/reviewer access).
4. Wake Render and Supabase; verify `/health`, login, and booking against the live URL.
5. Record the **3-5 minute video** following `docs/demo-script.md`:
   - Install APK on clean device, login
   - Browse departments/doctors, view slots
   - Book, show reference + status
   - Slot-conflict error with refreshed availability
   - Airplane-mode: offline banner, cached data visible, writes disabled, recovery on reconnect
   - Appointments list, reschedule, cancel, report metadata, preferences
6. Finalize documents: README (all headings complete), architecture diagrams render on GitHub, technical note complete, testing evidence attached, screenshots in place.
7. Finalize `docs/ai-usage-and-attribution.md`: tools used, what each was used for, what you reviewed/changed by hand, library and source attribution.
8. Complete `docs/submission-form-answers.md`: full name, registration number, university email, role, exact project title, repo URL, primary branch, **final commit ID**, video link, live demo/backend URL, docs links, stack, limitations, AI usage, APK link, Android version/device, declarations.
9. Tag the final commit (`v1.0.0`). Confirm no secrets in history.
10. **Open every link in an incognito window**. Grant reviewer access if the repo is private.
11. Submit the form.

**Exit gate:** section 8 checklist fully ticked.

---

## 7. Day-by-day schedule

| Day | Phases | Docs touched |
|-----|--------|--------------|
| 1 | Phase 0, start Phase 1 | README skeleton, ER + component diagrams, AI log, form sheet, contract header |
| 2 | Finish Phase 1, Phase 2 | Contract complete, booking sequence diagram, tech note (security, concurrency) |
| 3 | Phase 3 | README mobile/permissions/min Android, tech note (secure storage), screenshots |
| 4 | Phase 4 (+ start APK build) | Tech note (persistence, accessibility, release-readiness), limitations, testing.md, demo script |
| 5 | Phase 5 | Final verification, video, form answers, AI declaration |

**If you slip:** Day 5 morning is the buffer. Cut scope, never evidence. Cut order: reminder preferences UI polish, then reschedule UI (keep API), then extra screens. Never cut: booking, conflict handling, offline handling, tests, README, video.

---

## 8. Final submission checklist

**Product**
- [ ] APK installs on a clean device/emulator
- [ ] Login with demo credentials works
- [ ] Browse -> slots -> book -> reference + status
- [ ] Reschedule and cancel work; statuses update
- [ ] Report metadata shows; no diagnosis/treatment text anywhere
- [ ] Upcoming/past lists and reminder preferences work
- [ ] Slot-taken error is actionable and availability refreshes (A1)
- [ ] Offline/API failure recovers without crash (A4)
- [ ] No success UI before server confirmation (A5)

**Engineering**
- [ ] Refresh token in SecureStore; access token in memory; no secrets in logs
- [ ] Parameterized SQL; ownership checks; RLS enabled
- [ ] Only INTERNET permission (or each extra justified in README)
- [ ] Backend tests and mobile tests green; evidence saved

**Docs**
- [ ] README has all headings, demo credentials, min Android, permissions, API config, limitations
- [ ] `docs/api-contract.md` matches deployed behaviour
- [ ] `docs/architecture.md` diagrams (ER, component, booking sequence, mobile layers)
- [ ] `docs/technical-note.md` (secure storage, persistence, accessibility, release-readiness)
- [ ] `docs/testing.md` + `docs/test-evidence/`
- [ ] Screenshots + 3-5 min video
- [ ] `docs/ai-usage-and-attribution.md` complete and honest
- [ ] `docs/submission-form-answers.md` complete

**Hygiene**
- [ ] No `.env`, keystore, tokens, or personal data in git history
- [ ] `.env.example` files present
- [ ] Final commit ID recorded; release tagged
- [ ] Render and Supabase awake; all links open in incognito

---

## 9. Interview preparation (15-min walkthrough + 10-min live change)

Be able to explain and modify:
- **Atomic booking:** why `UPDATE ... WHERE status='AVAILABLE'` plus `rowCount` beats read-then-write (race condition); what `ROLLBACK` protects.
- **Idempotency key:** what repeated taps/retries would do without it.
- **Refresh flow:** why the access token is short-lived, why the refresh token is stored hashed server-side, why the shared in-flight refresh promise exists.
- **SecureStore vs AsyncStorage:** Keystore-backed encryption vs plain storage; why the access token stays in memory.
- **RLS with no policies:** why it protects data when using Supabase with your own backend.
- **Parameterized queries:** your SQL-injection answer.
- **Cache vs truth:** how the query cache differs from server state, and how the design prevents false success.
- **Cold-start handling:** why the 30 s timeout and warm-up ping exist.
- **Likely live-change tasks:** add a status filter, add a field to the appointment, change the reminder range, add a validation rule, add an endpoint. Keep layers clean so changes touch one place.

---

## 10. Risk register

| Risk | Mitigation |
|------|------------|
| Scope creep from the AI agent | Phase prompts forbid extras; review each plan before execution |
| Render cold start ruins the demo | Warm-up ping, longer timeout, pre-warm before recording and submitting |
| Supabase direct host fails from Render | Use pooler connection string |
| Supabase project pauses | Check before submitting; note in README |
| EAS build queue delays | Start the build at end of Day 4 |
| Docs left to the end | Doc work is part of every phase's exit gate |
| Unexplainable AI code | Read diffs per phase; keep code simple; rehearse section 9 |
| Secrets committed | `.gitignore` first commit; `.env.example` only; history check before submit |
| Broken links at review | Incognito link check on Day 5 |