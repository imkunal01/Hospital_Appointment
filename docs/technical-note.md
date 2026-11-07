# Technical Note: Architecture, Security, Persistence & Accessibility

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management  
> Version: 4.0.0

---

## 1. Security Architecture & Threat Defense

### 1.1 Credential Hashing with Bcrypt
- User passwords are encrypted using `bcrypt` (10 salt rounds) before database insertion.
- The authentication service (`auth.service.ts`) executes timing-safe password verification via `bcrypt.compare`.
- Generic, ambiguous error messages (`"Invalid email or password"`) are returned for both nonexistent users and bad passwords to prevent username enumeration attacks.

### 1.2 Access & Refresh Token Dual-Token Strategy & Platform Secure Storage
- **Access Tokens:**
  - Token format: Signed JSON Web Token (HMAC SHA-256).
  - Lifetime: **15 minutes**.
  - Payload: Contains minimal claims (`userId`, `email`, `role`).
  - Storage: Held **strictly in-memory** within the mobile application runtime state (`sessionStore.ts`).
  - Rationale: Never written to unencrypted persistent storage (such as plain `AsyncStorage`), completely preventing token exfiltration via unencrypted device backups or root filesystem inspection.
- **Refresh Tokens:**
  - Token format: 40-byte cryptographically secure random hexadecimal string (`crypto.randomBytes(40)`).
  - Storage Client-Side: Persisted exclusively in **`expo-secure-store`**.
  - Hardware Keystore Integration: On Android, `expo-secure-store` encrypts data using **AES-256-GCM**, storing encryption keys in the hardware-backed **Android Keystore System**. The data cannot be decrypted outside the application container or without hardware cryptographic verification.
  - Accessibility Level: Configured with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, ensuring secrets are inaccessible when the device is locked.
  - Storage Server-Side: Only the **SHA-256 hash** of the refresh token is stored in the `refresh_tokens` database table. Even in the event of an unauthorized database dump, raw refresh tokens cannot be reversed or replayed.
  - Expiry: Fixed 7-day expiration.
  - Transparent Refresh & Concurrency: The mobile HTTP interceptor uses a single in-flight shared promise (`refreshPromise`). If multiple parallel requests encounter an expired access token simultaneously, they all wait on the single `/auth/refresh` round-trip rather than blasting duplicate refresh requests.
  - Revocation: Explicit revocation timestamp (`revoked_at`) on logout or session reset.
  - Logging Policy: Sensitive tokens, passwords, and user PII are never printed to console logs or error diagnostics.

### 1.3 Row Level Security (RLS) Without Public Policies
- A key architectural decision is that PostgreSQL is hosted on Supabase, but client access flows exclusively through our custom Node.js Express backend.
- All 8 database tables have **Row Level Security (RLS) enabled with zero public policies**.
- **Rationale:** By default, Supabase exposes an open PostgREST HTTPS endpoint (`/rest/v1/*`). Enabling RLS with no policies guarantees that anonymous or authenticated PostgREST calls from the internet receive 0 rows and cannot read or mutate data. Only our backend service connects via the PostgreSQL connection string using privileged credentials.

### 1.4 Parameterized SQL Queries (SQL Injection Prevention)
- All database operations are written in raw SQL using node-postgres (`pg`) parameterized query placeholders (`$1, $2, ...`).
- Dynamic string concatenation of user-provided data into SQL queries is strictly prohibited across the codebase.

### 1.5 Rate Limiting & Denial-of-Service Protection
- The `/auth/login` endpoint is protected by an IP-based rate limiter (`loginRateLimiter`), throttling requests to a maximum of 10 attempts per 15-minute window per IP.
- Payloads are restricted to 10KB using `express.json({ limit: '10kb' })`.
- HTTP response headers are hardened via `helmet` (Disabling `X-Powered-By`, enabling CSP, HSTS, and X-Content-Type-Options).
- CORS headers restrict allowed origins to designated environments.

### 1.6 Patient Ownership Isolation
- Every database query touching patient appointments or medical visit report metadata strictly applies `WHERE patient_id = $userId`.
- Attempting to access or alter another patient's appointment returns HTTP `404 NOT_FOUND` rather than `403 FORBIDDEN` to prevent ID enumeration and metadata probing.

---

## 2. Concurrency, Atomicity & Idempotency

### 2.1 Atomic Slot Reservation (Eliminating Race Conditions)
Traditional read-then-write logic is vulnerable to Time-Of-Check to Time-Of-Use (TOCTOU) race conditions:
```sql
-- VULNERABLE APPROACH:
SELECT status FROM slots WHERE id = $1; -- Both users read 'AVAILABLE'
-- ... context switch ...
UPDATE slots SET status = 'BOOKED' WHERE id = $1; -- Both users execute update!
```
Our implementation eliminates race conditions by performing conditional atomic status claims within explicit PostgreSQL database transactions:
```sql
-- PRODUCTION IMPLEMENTATION (withTransaction):
BEGIN;
UPDATE slots 
SET status = 'BOOKED' 
WHERE id = $1 AND status = 'AVAILABLE';
-- If rowCount === 0 -> ROLLBACK and throw 409 SLOT_TAKEN
INSERT INTO appointments (reference, patient_id, slot_id, status) VALUES (...);
COMMIT;
```
Because PostgreSQL acquires an exclusive row-level write lock on the target slot row during the `UPDATE`, concurrent transactions queue. The first transaction flips the status to `BOOKED` and succeeds (`rowCount = 1`). The subsequent transaction executes against `status = 'BOOKED'`, matches 0 rows (`rowCount = 0`), rolls back immediately, and returns HTTP 409 `SLOT_TAKEN`.

### 2.2 Idempotency Key Handling
Network unreliability on mobile devices frequently causes duplicate POST requests when users experience spotty connections or double-tap buttons.
- Mutating endpoints accept an optional or generated `Idempotency-Key` HTTP header.
- Prior to entering transactions, the service queries:
  ```sql
  SELECT ... FROM appointments WHERE idempotency_key = $1 AND patient_id = $2;
  ```
- If a matching record exists, the server returns the existing confirmed appointment with HTTP 200 without executing a new transaction or consuming additional slots.

### 2.3 Atomic Rescheduling Integrity
Rescheduling an appointment requires moving from an old slot to a new slot:
1. The transaction attempts to claim the `newSlotId` (`UPDATE slots SET status='BOOKED' WHERE id=$1 AND status='AVAILABLE'`).
2. If `rowCount === 0`, it throws 409 `SLOT_TAKEN` and rolls back. **The original appointment and old slot remain completely untouched.**
3. Only upon successful claim of the new slot is the previous slot freed (`UPDATE slots SET status='AVAILABLE' WHERE id=$2`) and the appointment updated.

### 2.4 Server-Side "No False Success" Guarantee
- The application guarantees that no success response or state is returned unless the database transaction has committed.
- If the network drops or the database fails mid-operation, the transaction rolls back, returning an error.
- The mobile client is architected to transition to the Confirmation screen **strictly inside the mutation's `onSuccess` callback** after receiving HTTP 201/200.

---

## 3. State Persistence & Offline Policy

### 3.1 What is Cached vs What is Not
- **What is Cached in AsyncStorage:**
  - Read-only catalog metadata: departments, doctors list, and previously loaded slot schedules.
  - Previously confirmed appointments list (`upcoming` and `past`) and patient reminder preferences.
  - Cached via `PersistQueryClientProvider` using `@tanstack/query-async-storage-persister` with a 24-hour maximum garbage collection lifetime (`gcTime: 24h`).
- **What is NEVER Cached or Persisted Unencrypted:**
  - JWT access tokens (stored in volatile RAM memory only).
  - Partial or optimistic unconfirmed bookings.
  - Passwords and user credentials.

### 3.2 Offline vs Server-Confirmed Distinction (Rule A4 & A5)
- Mobile devices inevitably experience airplane mode, elevator connectivity dropouts, and Wi-Fi handoffs.
- **Architectural Policy:** Offline mode is strictly **Read-Only Cache**.
- When `@react-native-community/netinfo` signals network loss:
  1. A persistent top [`OfflineBanner`](file:///c:/Users/Kunal/Desktop/Projects/Hospital_Appointment/mobile/src/components/OfflineBanner.tsx) renders on all screens.
  2. Mutating action controls (**Book Appointment**, **Reschedule**, **Cancel**, and **Save Preferences**) are immediately **disabled** in the UI.
  3. The app **never** records an unconfirmed offline write into a local queue that pretends to be confirmed. A booking only transitions to confirmed status after the server returns HTTP 201/200.

### 3.3 Repeated-Tap Safety (Client-Side Debouncing)
- Mutating actions (Booking, Rescheduling, Cancelling) maintain synchronous `useRef` locks (`isCancellingRef`, `isReschedulingRef`) alongside TanStack Mutation `isPending` state.
- Even if a user rapidly double-taps or triple-taps a touch target before React performs a state re-render, only exactly one HTTP request is dispatched.

---

## 4. Accessibility & UI/UX Standards

### 4.1 Touch Targets (48dp Minimum)
- Every interactive button, text input, date selector chip, slot pill, and segmented control enforces a `minHeight: 48` and `minWidth: 48` density-independent pixels constraint (`spacing.minTouchTarget`), exceeding Android Material and WCAG 2.1 AAA touch target standards.

### 4.2 Semantic Screen Reader Roles & Labels
- Interactive controls specify explicit `accessibilityRole` (`button`, `tab`, `switch`, `alert`, `text`) and descriptive `accessibilityLabel` attributes.
- Error alerts and offline warnings declare `accessibilityRole="alert"` so Android TalkBack announces them immediately upon appearance.

### 4.3 Visual Hierarchy & Non-Color Dependent Status
- Contrast ratios exceed WCAG AA 4.5:1 standards for all body copy and interactive headers.
- Appointment status badges combine **3 distinct sensory indicators**:
  1. Text label (`CONFIRMED`, `CANCELLED`, `COMPLETED`).
  2. Distinct icon symbol (`✓`, `✕`, `●`).
  3. High-contrast border and background color.
  *Color is never used as the sole conveyor of information.*

---

## 5. Release-Readiness & Production Roadmap

1. **Certificate Pinning:** Implement SSL/TLS certificate pinning via `react-native-ssl-pinning` to protect against corporate proxy interception and Man-In-The-Middle attacks on public Wi-Fi.
2. **Refresh Token Single-Use Rotation:** Implement server-side automatic refresh token rotation (issuing a new refresh token on every `/auth/refresh` call and revoking the previous one).
3. **Push Notifications via FCM:** Replace in-app reminder preference simulation with real Google Firebase Cloud Messaging (FCM) integration for background alerts.
4. **Offline Write Queue with "Pending" Indicator:** If offline bookings are required in future phases, implement a persistent write queue that displays status `PENDING_SYNC` with visual amber badges until the server responds with 201.
5. **Crash Reporting & APM:** Integrate Sentry / Datadog for automated mobile crash reporting and distributed tracing.
6. **Paid-Tier API Hosting:** Upgrade Render and Supabase from free sleep tiers to dedicated instances with persistent connections to eliminate 30-50s cold-start delays.
