# Technical Note: Architecture, Security, Persistence & Accessibility

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management  
> Version: 2.0.0

---

## 1. Security Architecture & Threat Defense

### 1.1 Credential Hashing with Bcrypt
- User passwords are encrypted using `bcrypt` (10 salt rounds) before database insertion.
- The authentication service (`auth.service.ts`) executes timing-safe password verification via `bcrypt.compare`.
- Generic, ambiguous error messages (`"Invalid email or password"`) are returned for both nonexistent users and bad passwords to prevent username enumeration attacks.

### 1.2 Access & Refresh Token Dual-Token Strategy
- **Access Tokens:**
  - Token format: Signed JSON Web Token (HMAC SHA-256).
  - Lifetime: **15 minutes**.
  - Payload: Contains minimal claims (`userId`, `email`, `role`).
  - Storage: Held **strictly in-memory** within the mobile application runtime state. Never written to unencrypted persistent storage (e.g. AsyncStorage), preventing token exfiltration via backup extraction.
- **Refresh Tokens:**
  - Token format: 40-byte cryptographically secure random hexadecimal string (`crypto.randomBytes(40)`).
  - Storage Client-Side: Persisted exclusively in **`expo-secure-store`** (backed by hardware Android Keystore with AES-GCM encryption).
  - Storage Server-Side: Only the **SHA-256 hash** of the refresh token is stored in the `refresh_tokens` database table. Even in the event of an unauthorized database read, raw refresh tokens cannot be reversed or stolen.
  - Expiry: Fixed 7-day expiration.
  - Revocation: Explicit revocation timestamp (`revoked_at`) on logout or session reset.

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

*(To be implemented in Phase 3 & 4)*
- **TanStack Query + AsyncStorage Persister:** Cache read-only catalog data (departments, doctors, upcoming slots) for instant access.
- **Strict No-False-Success Offline Guarantee:** When offline (`@react-native-community/netinfo`), write actions (Book, Reschedule, Cancel) are disabled with clear UI indicators. No booking is ever reported as confirmed until the backend returns HTTP 201/200.

---

## 4. Accessibility & UI/UX Standards

*(To be implemented in Phase 4)*
- Minimum touch targets of 48×48dp across all buttons, inputs, and slot chips.
- Semantic accessibility labels (`accessibilityLabel` and `accessibilityRole`) on all interactive controls.
- Dynamic text scaling resilience without layout clipping or text overlap.
- High-contrast visual hierarchy; status indicators combine color with text labels and iconography (never color alone).

---

## 5. Release-Readiness & Production Roadmap

- Certificate pinning for API calls to prevent Man-In-The-Middle attacks.
- Crash reporting and performance monitoring integration (e.g. Sentry).
- Push notifications via Firebase Cloud Messaging (FCM) replacing in-app simulation.
- Multi-region database read replicas for global low-latency catalog queries.
- Automated token refresh rotation with single-use refresh token invalidation.
