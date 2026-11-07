# Development Record & Project Context

> **Project:** Hospital Appointment Android Application  
> **Company Assessment:** Algions AI Labs Private Limited  
> **Internship Role:** Android & Mobile App Development  
> **Domain:** Hospital Management  
> **Repository:** `https://github.com/imkunal01/Hospital_Appointment`  
> **Primary Branch:** `main`  
> **Current Version:** `1.0.0` (Milestone Phase 5 Complete)  
> **Total Automated Tests:** **65 / 65 Passing** (35 Backend + 30 Mobile)

---

## 1. Document Purpose & Future Chat Protocol

This document serves as the **single source of truth** for the architecture, implementation history, decision rationale, test matrix, and current state of the project.

> [!IMPORTANT]
> **Instructions for Future AI Chat Threads:**
> If you are an AI assistant opening this project in a new conversation:
> 1. Read this file first. It contains the complete context of everything built across Phases 0 through 5.
> 2. Respect the non-negotiables in Section 2 at all times.
> 3. Do not rewrite or modify already-tested core modules unless explicitly requested by the user.
> 4. Ensure all documentation and test suites remain aligned with any future changes.

---

## 2. Non-Negotiables & Core Constraints (From Assessment Brief)

1. **Synthetic Data Only:** Real patient data is strictly prohibited. Synthetic demo accounts are `patient1@example.test` and `patient2@example.test` (password `Password123!`).
2. **Non-Diagnostic Visit Reports:** Visit reports contain **strictly metadata only** (title, date, byte size). **Zero clinical diagnosis or treatment recommendations** exist anywhere in the backend or mobile code.
3. **Zero Secrets in Git / Unencrypted Storage:**
   - Only `.env.example` placeholder files are committed.
   - Passwords and tokens are never printed to console logs.
   - Refresh token is stored exclusively in **Android Keystore** via `expo-secure-store`.
   - Access token is kept **strictly in-memory** (never in plain `AsyncStorage`).
4. **No False Positive Success (Rule A5):**
   - The UI never optimistically displays success before receiving HTTP 201/200 from the backend.
   - Navigation to confirmation screens is performed strictly inside the mutation's `onSuccess` callback.
5. **Offline Policy (Rule A4):**
   - Offline mode is strictly **Read-Only Cache**.
   - When offline, a clear amber `OfflineBanner` is displayed, and all write mutations (Book, Reschedule, Cancel, Save Preferences) are disabled.
6. **Accessibility & Controls:**
   - Every interactive control has a **minimum 48dp touch target** (`spacing.minTouchTarget`).
   - All controls have explicit `accessibilityRole` and `accessibilityLabel` attributes.
   - Status badges use triple indicators (text + symbol + color).
7. **Database Isolation & SQL Safety:**
   - Raw SQL queries via node `pg` with parameterized placeholders (`$1, $2, ...`). Zero string concatenation.
   - Every appointment query is scoped to the authenticated patient (`patient_id = $userId`); others' IDs return 404.
   - All 8 database tables have **Row Level Security (RLS) enabled with 0 public policies** to block direct Supabase PostgREST access.
8. **Standardized Error Body Shape:**
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR | UNAUTHORIZED | TOKEN_EXPIRED | FORBIDDEN | SLOT_TAKEN | NOT_FOUND | RATE_LIMITED | INTERNAL",
       "message": "Human-readable actionable message",
       "details": {}
     }
   }
   ```
9. **Minimal Permissions:** Only `android.permission.INTERNET` declared in `mobile/app.json`.

---

## 3. Phase-by-Phase Development Record

### Phase 0: Foundation, Skeletons, Database Schema & Seed Data
- **Objective:** Establish repository structure, database schema, synthetic data, backend skeleton, and documentation frameworks.
- **Git Commit:** `a736649`
- **Key Deliverables:**
  - Database schema (`backend/sql/001_schema.sql`): 8 tables (`users`, `refresh_tokens`, `departments`, `doctors`, `slots`, `appointments`, `visit_reports`, `patient_preferences`) with UUID primary keys and `UNIQUE (doctor_id, starts_at)` on slots. RLS enabled on all tables with zero policies.
  - Seed script (`backend/sql/002_seed.sql`): 5 departments (Cardiology, Dermatology, Orthopedics, Pediatrics, Neurology), 12 doctors, rolling 14-day appointment slots, 2 synthetic patients, and non-diagnostic report metadata.
  - Backend skeleton: Express 5 + TypeScript, Zod environment validation (`src/config/env.ts`), PostgreSQL connection pool (`src/config/db.ts`), custom `AppError` class, central error handling middleware (`src/middleware/errorHandler.ts`), and `/health` route.
  - Documentation skeletons: `README.md`, `docs/architecture.md`, `docs/api-contract.md`, `docs/technical-note.md`, `docs/testing.md`, `docs/demo-script.md`, `docs/ai-usage-and-attribution.md`, `docs/submission-form-answers.md`, `docs/submission-checklist.md`.
  - Tests: `backend/tests/health.test.ts` (2 tests passed).

### Phase 1: Authentication, Catalog Read APIs & Security
- **Objective:** Implement secure dual-token authentication, catalog discovery APIs, rate limiting, and request validation.
- **Git Commit:** `1107a45`
- **Key Deliverables:**
  - Token service (`backend/src/utils/token.ts`): 15-minute signed JWT access tokens, 7-day SHA-256 hashed refresh tokens.
  - Middleware:
    - `requireAuth`: Verifies Bearer JWT, extracts user identity, and handles `TOKEN_EXPIRED`.
    - `requireRole`: Enforces role-based permissions (`PATIENT` vs `ADMIN`).
    - `validate`: Express middleware executing Zod schema validation on request body/query/params.
    - `loginRateLimiter`: Express rate limiter (10 attempts / 15 minutes per IP).
  - Auth routes (`backend/src/modules/auth/`): `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
  - Catalog routes (`backend/src/modules/catalog/`): `GET /departments`, `GET /doctors?departmentId=`, `GET /doctors/:id/slots?date=YYYY-MM-DD`.
  - Tests: `backend/tests/auth.test.ts` (9 tests), `backend/tests/catalog.test.ts` (8 tests). Total backend tests: 19 passing.

### Phase 2: Booking Engine, Concurrency & Management
- **Objective:** Build atomic booking engine, race condition locks, rescheduling swap transactions, idempotent cancellations, patient scoping, and non-diagnostic report retrieval.
- **Git Commit:** `80aecd2`
- **Key Deliverables:**
  - Transaction runner (`withTransaction` in `backend/src/config/db.ts`) providing transactional client lifecycle with automatic `COMMIT` and `ROLLBACK`.
  - Reference code generator (`backend/src/utils/reference.ts`): Format `HA-YYYYMMDD-XXXX`.
  - Appointments module (`backend/src/modules/appointments/`):
    - `POST /appointments`: Atomic conditional claim (`UPDATE slots SET status='BOOKED' ... WHERE status='AVAILABLE'`). Returns 409 `SLOT_TAKEN` on collision. Rejects past slots (400) and supports `Idempotency-Key` deduplication.
    - `GET /appointments?scope=upcoming|past`: Scoped to authenticated user (`WHERE patient_id = $userId`).
    - `GET /appointments/:id`: Strict ownership check; returns 404 for other users' records.
    - `PATCH /appointments/:id/reschedule`: Atomic swap (claims new slot, frees old slot; cleanly rolls back if new slot is taken, preserving original appointment).
    - `POST /appointments/:id/cancel`: Frees slot, sets appointment status to `CANCELLED`, fully idempotent.
    - `GET /appointments/:id/reports`: Strictly returns metadata (title, report type, upload date, file size).
  - Preferences module (`backend/src/modules/preferences/`): `GET /me/preferences` and `PUT /me/preferences` (validates reminder lead time between 1 and 72 hours).
  - Tests: `backend/tests/appointments.test.ts` (12 tests, including `Promise.all` concurrency collision tests), `backend/tests/preferences.test.ts` (4 tests). Total backend tests: 35 passing.

### Phase 3: Mobile Foundation, Hardware Keystore Auth & Main Journey
- **Objective:** Create React Native + Expo mobile client, Android Keystore session manager, accessible components, and complete discovery-to-booking patient journey.
- **Git Commit:** `eabc55e`
- **Key Deliverables:**
  - Expo SDK 52 + TypeScript app configured with package `com.algions.hospitalappointment`.
  - Storage layer:
    - `mobile/src/auth/secureStorage.ts`: Persists refresh token in Android Keystore using `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
    - `mobile/src/auth/sessionStore.ts`: In-memory volatile store for access token (never written to unencrypted disk).
  - HTTP client (`mobile/src/api/client.ts`):
    - Axios instance with 30s timeout.
    - Automatic `/health` warm-up ping on startup.
    - Axios response interceptor for `TOKEN_EXPIRED`: triggers single shared in-flight refresh promise and replays failed requests seamlessly.
    - Event emitter for slow responses (>5s) to trigger waking-up banner.
  - Component library (with minimum 48dp touch targets and accessibility labels):
    - `Button.tsx`: Enforces loading spinner, disabled state, and min 48dp size.
    - `Input.tsx`: Accessible text input with label and error state.
    - `ScreenState.tsx`: Unified Loading, Empty, and Error (+ Retry) container.
    - `StatusBadge.tsx`: Triple-indicator badge (label, icon, color).
    - `WakingUpBanner.tsx`: Top banner alerting users when Render backend is spinning up.
  - Screens & Navigation:
    - `LoginScreen.tsx`: Pre-fill demo chips for `patient1` and `patient2`.
    - `DepartmentsScreen.tsx`: Medical specialty catalog with doctor counts.
    - `DoctorsListScreen.tsx`: Filtered doctor cards.
    - `DoctorDetailScreen.tsx`: Horizontal date picker, live slots grid, confirm bottom sheet modal. Crucially executes navigation strictly in `onSuccess` (Rule A5).
    - `ConfirmationScreen.tsx`: Displays server-confirmed reference `HA-...`, doctor details, and next steps.
  - Tests: `errors.test.ts` (5 tests), `authStore.test.ts` (5 tests), `booking.test.tsx` (9 tests). Total mobile tests: 19 passing.

### Phase 4: Appointment Management, Offline Caching, Reliability & Accessibility
- **Objective:** Implement full appointment lifecycle management, non-diagnostic report viewing, persistent offline caching with write lockdown, NetInfo listener, and double-tap prevention.
- **Git Commit:** `cffd5b0`
- **Key Deliverables:**
  - State persistence: `@tanstack/query-async-storage-persister` integrated via `PersistQueryClientProvider` in `mobile/App.tsx` (24-hour cache retention).
  - Network listener (`mobile/src/hooks/useNetwork.ts`): Tracks online/offline status using `@react-native-community/netinfo`.
  - Offline Banner (`mobile/src/components/OfflineBanner.tsx`): Persistent amber alert displayed when disconnected.
  - Offline Write Lockdown: All booking, reschedule, cancel, and preference mutations are disabled when offline (guaranteeing no unconfirmed offline writes).
  - Debouncing ref guards: Synchronous `useRef` locks (`isCancellingRef`, `isReschedulingRef`) prevent double-tap race conditions.
  - Management Screens:
    - `AppointmentsScreen.tsx`: Segmented tabs for "Upcoming" and "Past" appointments.
    - `AppointmentDetailScreen.tsx`: Detailed card, reschedule modal with slot picker, cancellation confirmation alert, and Visit Reports metadata list.
    - `PreferencesScreen.tsx`: Notification toggle and lead hours selector (1–72h).
    - `ProfileScreen.tsx`: User profile details, shortcuts to preferences, and secure logout.
  - Navigation: Full bottom tab navigator (`AppNavigator.tsx`) with nested stack navigators (`DoctorsStackNavigator`, `AppointmentsStackNavigator`, `ProfileStackNavigator`).
  - Tests: `appointmentManagement.test.tsx` (2 tests), `offlineAndFailure.test.tsx` (5 tests), `loginValidation.test.tsx` (4 tests). Total mobile tests: 30 passing.

### Phase 5: Packaging, EAS Configuration, Verification & Submission Docs
- **Objective:** Configure EAS Build for standalone APK generation, conduct Android permissions audit, compile test evidence, finalize submission answers, and sign off documentation.
- **Git Commit:** `5b6f81f`
- **Key Deliverables:**
  - EAS configuration (`mobile/eas.json`): `preview` profile configured with `android.buildType: "apk"` for standalone `.apk` builds.
  - Permissions audit: Inspected `mobile/app.json`; verified only `android.permission.INTERNET` is declared (least privilege).
  - Pre-filled submission form (`docs/submission-form-answers.md`): Detailed answers, tech stack breakdown, build runbooks, and links.
  - Verified submission checklist (`docs/submission-checklist.md`): Verified all product, security, testing, and hygiene criteria.
  - Timed demonstration script (`docs/demo-script.md`): 3:30–4:15 minute shot list with exact voiceover cues mapped to acceptance criteria A1 through A5.
  - AI attribution declaration (`docs/ai-usage-and-attribution.md`): Complete log of AI assistance and third-party permissive open-source licenses.
  - Git history security scan: Verified zero credentials, passwords, or secrets leaked into git history.

---

## 4. Codebase Directory Structure & File Map

```
Hospital_Appointment/
├── AGENTS.md                          # Mandatory project rules & non-negotiables
├── DEVELOPMENT_RECORD.md              # Context & phase history (this document)
├── README.md                          # Main project guide (Sections 1-13)
├── .agent/rules/AGENTS.md             # Antigravity agent rule mirror
├── .gitignore                         # Strict ignore rules (ignores .env, dist, node_modules)
│
├── backend/                           # Node.js + Express 5 + TypeScript Backend
│   ├── package.json                   # Scripts: dev, build, start, test
│   ├── tsconfig.json                  # NodeNext module resolution, isolatedModules: true
│   ├── .env.example                   # Template for DATABASE_URL, JWT_SECRET, etc.
│   ├── sql/
│   │   ├── 001_schema.sql             # 8 tables, UUID PKs, slot uniqueness, RLS enabled
│   │   └── 002_seed.sql               # Synthetic departments, doctors, rolling slots, users
│   ├── src/
│   │   ├── server.ts                  # HTTP listener on port 4000
│   │   ├── app.ts                     # Express setup, Helmet, CORS, json, routes, errorHandler
│   │   ├── config/
│   │   │   ├── db.ts                  # pg Pooler + withTransaction runner
│   │   │   └── env.ts                 # Zod environment schema validation
│   │   ├── errors/
│   │   │   └── AppError.ts            # Standardized AppError class with HTTP status & codes
│   │   ├── middleware/
│   │   │   ├── auth.ts                # requireAuth (Bearer JWT) & requireRole (PATIENT/ADMIN)
│   │   │   ├── errorHandler.ts        # Central error handler emitting standardized error shape
│   │   │   ├── rateLimiter.ts         # IP-based rate limiter for /auth/login (10/15min)
│   │   │   └── validate.ts            # Zod validation middleware for body, query, params
│   │   ├── utils/
│   │   │   ├── reference.ts           # Unique booking reference generator (HA-YYYYMMDD-XXXX)
│   │   │   └── token.ts               # signAccessToken, verifyAccessToken, hashToken (SHA-256)
│   │   └── modules/
│   │       ├── auth/                  # auth.routes.ts, auth.service.ts, auth.validation.ts
│   │       ├── catalog/               # catalog.routes.ts, catalog.service.ts, catalog.validation.ts
│   │       ├── appointments/          # appointments.routes.ts, appointments.service.ts, validation
│   │       └── preferences/           # preferences.routes.ts, preferences.service.ts, validation
│   └── tests/
│       ├── health.test.ts             # 2 tests (/health, DB ping failure)
│       ├── auth.test.ts               # 9 tests (login, refresh, logout, rate limiter)
│       ├── catalog.test.ts            # 8 tests (departments, doctors, slot availability)
│       ├── appointments.test.ts       # 12 tests (atomic booking, concurrency collision, scoping)
│       └── preferences.test.ts        # 4 tests (defaults, 1-72h range validation)
│
├── mobile/                            # React Native + Expo SDK 52 + TypeScript Mobile App
│   ├── package.json                   # Dependencies & Jest configuration
│   ├── app.json                       # Package: com.algions.hospitalappointment, INTERNET only
│   ├── eas.json                       # EAS Build config (preview profile -> apk)
│   ├── tsconfig.json                  # Strict TypeScript configuration
│   ├── .env.example                   # Template: EXPO_PUBLIC_API_URL
│   ├── App.tsx                        # Root component with PersistQueryClientProvider & SafeArea
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts              # Axios client (30s timeout, silent refresh, warm-up ping)
│   │   │   ├── endpoints.ts           # Strongly typed API caller functions
│   │   │   └── types.ts               # Shared TypeScript data transfer interfaces
│   │   ├── auth/
│   │   │   ├── secureStorage.ts       # Android Keystore refresh token manager (expo-secure-store)
│   │   │   └── sessionStore.ts        # In-memory volatile access token store
│   │   ├── components/
│   │   │   ├── Button.tsx             # 48dp button with loading spinner and disabled state
│   │   │   ├── Input.tsx              # 48dp accessible text input with error message
│   │   │   ├── OfflineBanner.tsx      # Amber warning banner when network is lost
│   │   │   ├── ScreenState.tsx        # Loading, Empty, and Error (+ Retry) layout
│   │   │   ├── StatusBadge.tsx        # CONFIRMED / CANCELLED / COMPLETED badge
│   │   │   └── WakingUpBanner.tsx     # Blue cold-start notification banner (>5s wait)
│   │   ├── hooks/
│   │   │   ├── useAppointments.ts     # TanStack queries & mutations for appointments & reports
│   │   │   ├── useBooking.ts          # Mutation hook for booking appointments
│   │   │   ├── useCatalog.ts          # Queries for departments, doctors, and slots
│   │   │   ├── useNetwork.ts          # NetInfo connectivity hook
│   │   │   └── usePreferences.ts      # Queries & mutations for patient reminder preferences
│   │   ├── navigation/
│   │   │   ├── AppNavigator.tsx       # Bottom tab navigator (Doctors, Appointments, Profile)
│   │   │   ├── AppointmentsStackNavigator.tsx # Appointments list & detail stack
│   │   │   ├── AuthNavigator.tsx      # Login stack
│   │   │   ├── DoctorsStackNavigator.tsx      # Discovery, Doctor list, Slot booking stack
│   │   │   ├── ProfileStackNavigator.tsx      # Profile and Preferences stack
│   │   │   └── RootNavigator.tsx      # Top-level auth gate (Session vs Login)
│   │   ├── screens/
│   │   │   ├── AppointmentDetailScreen.tsx # Reschedule modal, cancel alert, visit reports metadata
│   │   │   ├── AppointmentsScreen.tsx # Upcoming / Past filter tabs
│   │   │   ├── ConfirmationScreen.tsx # Server-confirmed reference display
│   │   │   ├── DepartmentsScreen.tsx  # Specialty department cards
│   │   │   ├── DoctorDetailScreen.tsx # Date scroll, real-time slots, confirm modal
│   │   │   ├── DoctorsListScreen.tsx  # Doctor cards filtered by department
│   │   │   ├── LoginScreen.tsx        # Credentials form with quick-fill synthetic chips
│   │   │   ├── PreferencesScreen.tsx  # Reminder toggle and 1-72 lead hours selector
│   │   │   └── ProfileScreen.tsx      # Patient information and logout button
│   │   ├── storage/
│   │   │   └── queryPersister.ts      # AsyncStorage persister with 24h retention
│   │   ├── theme/
│   │   │   ├── colors.ts              # Medical blue, emerald, amber, rose, neutral palette
│   │   │   ├── spacing.ts             # 48dp minTouchTarget, layout padding, typography
│   │   │   └── index.ts               # Theme exports
│   │   └── utils/
│   │       ├── dates.ts               # Date & time formatting helpers
│   │       └── errors.ts              # Error shape to friendly user text mapper
│   └── __tests__/
│       ├── errors.test.ts             # 5 tests (Error code mapping)
│       ├── authStore.test.ts          # 5 tests (SecureStore + memory storage rules)
│       ├── booking.test.tsx           # 9 tests (Main journey, conflict alert, no false success)
│       ├── appointmentManagement.test.tsx # 2 tests (Double-tap debouncing, report metadata)
│       ├── offlineAndFailure.test.tsx # 5 tests (Offline banner, action locking, reconnection)
│       └── loginValidation.test.tsx   # 4 tests (Email/password format validation)
│
└── docs/                              # Project Documentation & Assessment Deliverables
    ├── ai-usage-and-attribution.md    # Transparent AI usage log and third-party licenses
    ├── api-contract.md                # Full REST API specification with error models
    ├── architecture.md                # System architecture, ER diagrams, booking sequence
    ├── demo-script.md                 # 3:30-4:15 min video shot list and voiceover guide
    ├── development-record.md          # Mirror of this development record
    ├── submission-checklist.md        # Verified pre-submission verification gate
    ├── submission-form-answers.md     # Pre-filled answers for the assessment form
    ├── technical-note.md              # Security, concurrency, caching, and accessibility notes
    ├── testing.md                     # Test execution commands & failure simulation procedures
    └── test-evidence/
        ├── backend-phase0.txt         # Initial 2 tests passing
        ├── backend-phase1.txt         # 19 tests passing
        ├── backend-final.txt          # All 35 backend tests passing
        ├── mobile-phase3.txt          # Initial 19 mobile tests passing
        └── mobile-final.txt           # All 30 mobile tests passing
```

---

## 5. Complete Automated Test Matrix (65 Tests)

### Backend Suites (`backend/tests/`): 35 Passed
1. **`health.test.ts` (2 tests):**
   - Returns HTTP 200 with `status: "ok"` and database ping confirmation.
   - Gracefully handles database connection failure returning 500 `INTERNAL`.
2. **`auth.test.ts` (9 tests):**
   - Validates user login with correct credentials and returns JWT access and refresh tokens.
   - Rejects non-existent email with 401 `UNAUTHORIZED`.
   - Rejects incorrect password with 401 `UNAUTHORIZED`.
   - Validates email and password format via Zod (400 `VALIDATION_ERROR`).
   - Exchanges valid refresh token for a new access token.
   - Rejects revoked or invalid refresh tokens with 401 `UNAUTHORIZED`.
   - Invalidates refresh token on logout.
   - Enforces rate limiting on `/auth/login` (10 requests per 15 minutes per IP).
3. **`catalog.test.ts` (8 tests):**
   - Returns all active hospital departments.
   - Returns doctors filtered by department ID.
   - Returns 400 if `departmentId` is not a valid UUID.
   - Returns slots for a doctor on a specific date (`YYYY-MM-DD`).
   - Returns only available slots when `availableOnly=true`.
   - Returns 400 for malformed date strings.
   - Rejects unauthenticated requests to catalog endpoints with 401 `UNAUTHORIZED`.
4. **`appointments.test.ts` (12 tests):**
   - Atomically books an available slot, returning 201 with reference code.
   - **Concurrency Collision Test:** Executes parallel bookings on the identical slot (`Promise.all`), asserting exactly one 201 and one 409 `SLOT_TAKEN`.
   - Rejects attempts to book a past slot with 400 `VALIDATION_ERROR`.
   - Deduplicates identical requests when `Idempotency-Key` header is provided.
   - Retrieves upcoming appointments scoped strictly to authenticated patient.
   - Retrieves past appointments scoped strictly to authenticated patient.
   - Returns 404 when querying an appointment belonging to another patient.
   - Atomically reschedules appointment to a new slot.
   - Rollback verification: Fails reschedule if new slot is taken, leaving original appointment intact.
   - Idempotently cancels an appointment and frees the associated slot.
   - Retrieves visit reports metadata; **asserts zero clinical diagnosis fields exist**.
5. **`preferences.test.ts` (4 tests):**
   - Returns default reminder preferences (enabled, 24h lead time).
   - Updates reminder preferences with valid values (48h).
   - Rejects reminder lead time less than 1 hour (400 `VALIDATION_ERROR`).
   - Rejects reminder lead time greater than 72 hours (400 `VALIDATION_ERROR`).

### Mobile Suites (`mobile/__tests__/`): 30 Passed
1. **`errors.test.ts` (5 tests):**
   - Maps `SLOT_TAKEN` to *"This slot has just been reserved by another patient. Please choose another time."*
   - Maps `UNAUTHORIZED` to *"Incorrect email or password. Please try again."*
   - Maps `TOKEN_EXPIRED` to *"Your session has expired. Please sign in again."*
   - Maps `RATE_LIMITED` to *"Too many login attempts. Please wait 15 minutes before trying again."*
   - Maps generic network dropouts to actionable connection retry instructions.
2. **`authStore.test.ts` (5 tests):**
   - Stores refresh token in `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
   - Stores access token exclusively in memory (`sessionStore.ts`).
   - Clears both memory and hardware Keystore on logout.
   - Verifies access token is never written to unencrypted storage.
   - Restores session on app startup if a valid refresh token exists in Keystore.
3. **`booking.test.tsx` (9 tests):**
   - Renders department cards and doctors list.
   - Allows selecting dates and viewing available slot chips.
   - Opens confirmation modal upon tapping an available slot.
   - Shows loading indicator and disables submit button while mutation is pending.
   - **Rule A5 (No False Success):** Asserts `ConfirmationScreen` is never rendered optimistically, only appearing upon HTTP 201 response.
   - **Rule A1 (Slot Conflict):** Asserts 409 `SLOT_TAKEN` triggers actionable alert dialog and invalidates slot cache.
   - Preserves user selections on screen if booking fails due to network loss.
4. **`appointmentManagement.test.tsx` (2 tests):**
   - **Double-Tap Debouncing:** Simulates rapid double-tap on "Cancel Appointment", asserting API mutation is invoked exactly once.
   - **Report Metadata:** Asserts visit report displays title, date, and file size with zero diagnosis or treatment text.
5. **`offlineAndFailure.test.tsx` (5 tests):**
   - **Rule A4 (Offline Banner):** Verifies "You are currently offline" banner renders when network is lost.
   - Verifies "Confirm Booking" button is disabled in offline mode.
   - Verifies "Cancel Appointment" button is disabled in offline mode.
   - Verifies cached appointment history remains viewable in offline mode.
   - Verifies banner disappears and actions re-enable upon network reconnection.
6. **`loginValidation.test.tsx` (4 tests):**
   - Validates empty email and password inputs with field-level errors.
   - Validates invalid email format.
   - Validates password minimum length (6 characters).
   - Pre-fills synthetic demo credentials via quick-fill chip.

---

## 6. Technical Issues Encountered & Resolved

| # | Issue Encountered | Root Cause | Resolution |
|---|---|---|---|
| 1 | `Using hybrid module kind (Node16/18/Next) is only supported in "isolatedModules: true"` warning in `ts-jest` | `backend/tsconfig.json` used `NodeNext` module resolution without explicitly setting `isolatedModules`. | Added `"isolatedModules": true` to `backend/tsconfig.json`. |
| 2 | Express 5 `req.params.id` typed as `string \| string[]` causing TS2345 in catalog routes | Express 5 widened param types to support array routing. | Wrapped param lookups in `String(req.params.id)`. |
| 3 | Multiline SQL match failure in Jest test spies | Test spy checked `sql.includes("UPDATE slots SET status = 'BOOKED' ...")` on a single line, but SQL had newlines. | Updated spy predicate to check both `sql.includes('UPDATE slots')` and `sql.includes("'BOOKED'")`. |
| 4 | Seed slot UUID validation failure (`s1111111-...`) | Zod `.uuid()` requires valid hexadecimal characters `[0-9a-fA-F]`. Non-hex prefixes (`s1...`, `r1...`) caused 400 `VALIDATION_ERROR`. | Replaced non-hex UUIDs with valid hex characters (`e1111111-...` for slots, `f1111111-...` for reports) across seed scripts and test fixtures. |
| 5 | Peer dependency conflict during mobile `npm install` | `@testing-library/jest-native@5.4.3` requested `react-test-renderer@19`, which clashed with React 18.3.1. | Pinned `"react-test-renderer": "18.3.1"` in `mobile/package.json` and ran `npm install --legacy-peer-deps`. |
| 6 | React Navigation 7 screen props typing mismatch | Screen props were incompatible with `createNativeStackNavigator()` generic types. | Defined explicit stack parameter lists (`DoctorsStackParamList`, `AppointmentsStackParamList`) and cast component routes properly. |
| 7 | Jest module resolution failing for `.js` extensions in mobile imports | TypeScript imported relative files as `.js` in compiled outputs, but Jest looked for `.tsx`. | Added `moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' }` to `mobile/jest.config.js`. |
| 8 | `Alert.alert` no-op in Jest test environment | Clicking "Cancel Appointment" showed an `Alert.alert` confirmation prompt, but Jest mock didn't invoke the confirm button handler. | Spied on `Alert.alert` in tests and automatically triggered the confirmation callback. |
| 9 | `getByRole('alert')` missing match in RNTL | React Native doesn't expose native `role="alert"` in default test tree. | Switched test selector to `getByLabelText(/You are currently offline/i)` and `findByText(...)`. |
| 10 | Unmocked slot query in appointment test causing undefined query key error | `QueryClient` threw error because slot query endpoint wasn't mocked in `appointmentManagement.test.tsx`. | Added `(endpoints.getDoctorSlotsApi as jest.Mock).mockResolvedValue([])` in test setup. |
| 11 | Synchronous rapid double-tap calling mutation twice in test | React state update (`mutation.isPending`) is asynchronous and allows synchronous double-presses within the same tick. | Added synchronous ref locks (`isCancellingRef.current = true`) to immediately debounce rapid double-taps. |

---

## 7. Synthetic Credentials & Environment Configuration

### Synthetic Demo Patients
- **Patient 1:**
  - Email: `patient1@example.test`
  - Password: `Password123!`
  - Seeded Data: Upcoming appointment in Cardiology; completed appointment with 2 visit reports (blood count metadata, ECG waveform report metadata).
- **Patient 2:**
  - Email: `patient2@example.test`
  - Password: `Password123!`
  - Purpose: Parallel concurrency testing and slot-taken collision demonstrations.

### Backend Environment Variables (`backend/.env`)
```bash
PORT=4000
NODE_ENV=development # or production
DATABASE_URL=postgresql://postgres:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
JWT_SECRET=your_jwt_access_secret_min_32_chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_chars
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=*
```

### Mobile Environment Variables (`mobile/.env`)
```bash
EXPO_PUBLIC_API_URL=https://hospital-appointment-api.onrender.com
# For Android Studio Emulator local testing: http://10.0.2.2:4000
```

---

## 8. Final Candidate Action Items for Submission

1. **Push all commits to GitHub:**
   ```bash
   git push origin main
   ```
2. **Compile standalone Android APK via EAS:**
   ```bash
   cd mobile
   npx eas-cli build -p android --profile preview
   ```
3. **Record 3–5 Minute Evaluation Video:**
   - Follow the detailed script in [`docs/demo-script.md`](docs/demo-script.md).
   - Demonstrate: Clean install (A2), Login, Main booking journey (A3, A5), Concurrency conflict (A1), Airplane mode offline lockdown (A4), Rescheduling, Cancellation, and Non-diagnostic report metadata.
   - Upload to YouTube (Unlisted) or Google Drive (public view).
4. **Fill Candidate Details & Submit:**
   - Open [`docs/submission-form-answers.md`](docs/submission-form-answers.md).
   - Enter Full Name, Registration Number, University Email, and Video URL.
   - Copy-paste into the Algions AI Labs assessment submission form.
5. **Tag Final Release:**
   ```bash
   git tag v1.0.0
   git push origin main --tags
   ```
