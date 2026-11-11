Backend Core & Reliability (Section 2)
 Project Setup: TypeScript strict: true, engines: { "node": ">=20.0.0" }, scripts: dev, build, start, test, lint (tsc --noEmit).
 Database & Pool Resiliency:
Configured for Supabase connection pooler (DATABASE_URL) with automatic SSL detection (rejectUnauthorized: false).
Added idle client error listener (pool.on('error')) to prevent pool dropouts.
Added statement timeouts (statement_timeout: 10000) and connection timeouts to prevent hanging queries.
Idempotent schema (001_schema.sql) and synthetic seed (002_seed.sql) with RLS enabled on all tables, UNIQUE (doctor_id, starts_at), and UNIQUE (patient_id, idempotency_key).
 Authentication & Sessions:
Dual-token lifecycle: 15-minute HS256 access JWT, 7-day SHA-256 hashed refresh token in PostgreSQL.
Timing-safe login: Constant-time dummy bcrypt comparison when email is not found to prevent user enumeration.
Distinct TOKEN_EXPIRED error code so the client seamlessly triggers refresh.
IP-based rate limiting with trust proxy: 1 configured for Render.
 Validation & Centralized Errors:
Zod validation on every route parameter, query, and request body.
Central AppError and error middleware outputting { "error": { "code", "message", "details?" } }.
Zero SQL or stack trace leakage to the client; unknown errors return generic INTERNAL.
 Strict Business Rules & Concurrency:
Atomic slot locking via UPDATE slots SET status='BOOKED' ... with row-count verification.
Server-side past-slot rejection.
Idempotency key tracking per patient returning identical confirmation on retry.
Atomic reschedule with rollback (failed reschedule leaves original appointment untouched).
Patient ownership scoping (patient_id = $userId), returning 404 for unauthorized appointment access.
Report endpoint returns strictly non-diagnostic metadata.
 Security & Zero-Leakage Logging:
Helmet enabled, CORS configured for mobile native requests and production origins.
Winston + Morgan structured logging with X-Request-ID correlation.
Strict policy: HTTP request/response headers and body payloads are excluded from logs to prevent token or PII leaks.
 Process Safety: Graceful shutdown on SIGTERM/SIGINT closing pool.end(), with global unhandledRejection and uncaughtException listeners in backend/src/server.ts.
 61/61 Backend Tests Passing: Supertest test suites verify auth, validation, concurrent double-booking collisions (one 201, one 409), idempotent retries, ownership isolation, and cancellation.
Frontend / Mobile (Section 3 & 4)
 Token Management: Refresh token in expo-secure-store, access token in memory only; session restored on startup without splash screen flicker.
 Robust API Client:
30-second timeout to handle free-tier cold starts.
Shared refresh promise preventing multiple parallel 401 calls from spamming refresh tokens.
Automatic GET /health warm-up ping on app launch.
Automatic retries restricted to safe GET requests only (never on booking, cancel, or reschedule).
 Offline Resilience:
React Query cache persisted via @tanstack/query-async-storage-persister (cleared on logout).
Offline banner displaying "Last updated" timestamp.
All write buttons (Book, Confirm, Reschedule, Cancel) are disabled with a clear reason when offline.
Strict compliance with Rule A5: No optimistic "Confirmed" screen; navigation to confirmation only occurs upon HTTP 201/200 server response.
 Navigation & UX Polish:
Route-aware floating tab dock hiding: The dark floating dock automatically hides during active process flows (DoctorsList, DoctorDetail, Confirmation, AppointmentDetail, Preferences, and BookTab) so CTA buttons are never covered.
Form accessibility: 48dp minimum touch targets, accessibilityLabel, accessibilityRole, and accessibilityState across all interactive controls.
35/35 Mobile Tests Passing: Tests verify offline mutation blocking, error code mapping, double-tap prevention, and mocked network failure handling.
 Editorial Redesign (Phase 11): Complete high-contrast design language matching all 7 screenshots: deep ink-green (#11382E), chartreuse lime (#D4F754), pastel lilac (#D8CEF6), coral (#FA7C62), sky blue (#9AD5FD), tactile offset shadows, and asymmetric cards.
 Professional Healthcare Redesign (Phase 13): Replaced cartoonish colors with high-trust clinical palette: Deep Midnight Navy (#0A2540), Medical Sapphire (#2563EB), soft ice-blue wash (#EFF6FF), hospital off-white (#F8FAFC), pure white cards (#FFFFFF), and refined elevation shadows. Integrated realistic stethoscope header asset (`mobile/assets/stethoscope.png`) in Login and Home hero screens.
