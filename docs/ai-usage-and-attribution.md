# AI Usage and Attribution

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management

---

## 1. AI Tools Used

| Tool | Model / Provider | Purpose of Use |
|---|---|---|
| **Antigravity Assistant** | Gemini 3.8 Flash (Google DeepMind) | Architecture structuring, TypeScript backend and React Native scaffolding, SQL schema & seed drafting, test case generation, and markdown documentation formatting. |

---

## 2. Evaluation Transparency & Candidate Ownership

As required by the Algions AI Labs assessment guidelines:
1. All AI-generated suggestions, code, and configurations were reviewed, validated, and tested by the candidate.
2. The candidate understands the architectural choices, database constraints, concurrency mechanisms, and error models thoroughly and is prepared to explain and modify any component during the 15-minute technical walkthrough and 10-minute live coding challenge.

---

## 3. Per-Phase AI Activity Log

| Phase | AI Contribution | Candidate Review & Manual Modifications |
|---|---|---|
| **Phase 0 — Foundation & Skeletons** | - Generated `AGENTS.md` and repository guidelines.<br>- Generated PostgreSQL schema (`001_schema.sql`) with RLS enabled on all tables and unique constraints.<br>- Generated synthetic seed script (`002_seed.sql`) with 14-day rolling slot generation.<br>- Scaffolding Express + TypeScript with Zod env validation, AppError class, and `/health` test. | - Manually verified bcrypt hash validity using `node` test script.<br>- Verified RLS table isolation and foreign key cascade rules.<br>- Confirmed that visit reports contain strictly non-diagnostic metadata.<br>- Executed build and Jest test suites to ensure 0-warning compilation. |
| **Phase 1 — Auth & Catalog APIs** | - Generated dual-token authentication service (`loginUser`, `refreshAccessToken`, `logoutUser`).<br>- Generated token utilities (`signAccessToken`, `verifyAccessToken`, `hashToken`).<br>- Generated middleware (`requireAuth`, `requireRole`, `validate`, `loginRateLimiter`).<br>- Generated catalog endpoints (`GET /departments`, `GET /doctors`, `GET /doctors/:id/slots`).<br>- Generated Supertest integration test suites for auth and catalog flows. | - Verified 15-minute access token expiry and 7-day refresh token lifetime.<br>- Verified SHA-256 hashing of refresh tokens before database storage.<br>- Confirmed that catalog endpoints require valid authentication.<br>- Verified rate limiting window (10 requests / 15 mins) and rate limit bypass in test environment.<br>- Executed `npm test` and verified 19 passing tests. |
| **Phase 2 — Booking Engine & Concurrency** | - Generated atomic booking transaction engine (`bookAppointment`) with `Idempotency-Key` deduplication.<br>- Implemented atomic slot state lock (`UPDATE slots SET status='BOOKED' ...`) returning 409 `SLOT_TAKEN` on collision.<br>- Generated atomic rescheduling (`rescheduleAppointment`) and idempotent cancellation (`cancelAppointment`).<br>- Generated patient-scoped appointment listing, details, and report metadata retrieval.<br>- Implemented user reminder preferences module (`GET/PUT /me/preferences`).<br>- Generated Supertest concurrency test suites (`Promise.all` racing locks, idempotent retries, ownership isolation). | - Verified that concurrent requests for the exact same slot result in exactly one 201 and one 409.<br>- Verified that failed reschedule attempts roll back cleanly without modifying original appointment or slot.<br>- Confirmed that appointment queries enforce `patient_id = $userId` and return 404 for unauthorized access.<br>- Verified that visit reports contain strictly non-diagnostic metadata.<br>- Executed `npm test` and verified 35 passing tests. |
| **Phase 3 — Mobile Main Journey** | - Generated React Native + Expo + TypeScript mobile application foundation.<br>- Generated Android Keystore session manager (`expo-secure-store` for refresh tokens; memory for access tokens).<br>- Implemented Axios client with 30s cold-start timeout, automatic `/health` warm-up, and single shared refresh promise.<br>- Created accessible component system (`Button`, `Input`, `ScreenState`, `StatusBadge`, `WakingUpBanner`) meeting 48dp touch target rules.<br>- Implemented main patient flow: Login -> Departments -> Doctors -> Date/Slot Picker -> Confirmation.<br>- Generated Jest + React Native Testing Library tests covering error mapping, auth store, disabled-while-pending, slot conflict handling, and no-false-success navigation. | - Verified that access tokens are never persisted to AsyncStorage.<br>- Confirmed that navigation to ConfirmationScreen occurs strictly inside the mutation `onSuccess` callback (Rule A5).<br>- Verified that on 409 `SLOT_TAKEN`, the app shows an actionable dialog and invalidates the slots cache query.<br>- Checked accessibility labels and 48dp touch targets across all touchable controls.<br>- Executed `npm test` in `mobile/` and verified 19 passing tests. |
| **Phase 4 — Reliability, Management & Offline** | *Pending Phase 4 execution* | *Pending* |
| **Phase 5 — Package, Verify & Submit** | *Pending Phase 5 execution* | *Pending* |

---

## 4. Third-Party Libraries & Licensing

All external dependencies utilized in this project are permissible open-source software under standard permissive licenses (MIT / Apache 2.0 / BSD):

### 4.1 Backend Dependencies
- `express` — MIT License (Web application framework)
- `pg` — MIT License (Non-blocking PostgreSQL client)
- `zod` — MIT License (TypeScript-first schema validation)
- `helmet` — MIT License (Security HTTP headers middleware)
- `cors` — MIT License (CORS middleware)
- `bcryptjs` — MIT License (Optimized bcrypt password hashing)
- `jsonwebtoken` — MIT License (JWT signing and verification)
- `dotenv` — BSD-2-Clause License (Environment variable loader)
- `jest`, `ts-jest`, `supertest` — MIT License (Automated test runner and HTTP assertions)

### 4.2 Mobile Dependencies (Phase 3 & 4)
- `expo` — MIT License (Application framework)
- `react-native` — MIT License (Mobile framework)
- `@tanstack/react-query` — MIT License (Asynchronous server state management)
- `expo-secure-store` — MIT License (Encrypted hardware keystore storage)
- `@react-native-community/netinfo` — MIT License (Network connectivity detection)
- `axios` — MIT License (Promise-based HTTP client)

