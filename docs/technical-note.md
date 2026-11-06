# Technical Note: Architecture, Security, Persistence & Accessibility

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management

---

## 1. Security & Token Storage

### 1.1 Credential Hashing & Secrets Management
- All user passwords are encrypted using `bcrypt` with a cost factor of 10 prior to storage.
- Plaintext passwords and JWT secrets are never logged in console outputs or committed to version control.
- Configuration is loaded via strongly-typed, schema-validated environment variables (`Zod`) on backend initialization.

### 1.2 Access & Refresh Token Lifecycle
- **Access Tokens:** Short-lived (15 minutes), signed with HMAC SHA-256 (`HS256`). Held **strictly in-memory** in the mobile application. Never written to unencrypted local storage.
- **Refresh Tokens:** Long-lived (7 days). On the client, stored exclusively in **`expo-secure-store`**, which leverages the hardware-backed Android Keystore system. On the backend, only a cryptographic hash of the refresh token is stored in the database.
- **Token Rotation & Invalidation:** On logout, refresh tokens are revoked immediately in the database.

### 1.3 Database Access Protection (RLS)
- Supabase PostgreSQL database tables have **Row Level Security (RLS) enabled with 0 public policies**.
- Even if the Supabase project URL or anonymous key were exposed, all PostgREST client queries return zero records and cannot alter data.
- The Node.js backend connects using privileged credentials over a secure connection pooler.

---

## 2. Concurrency, Atomicity & Idempotency

*(To be fully expanded in Phase 2)*
- **Atomic Slot Reservation:** Booking transactions execute atomic conditional SQL updates (`UPDATE slots SET status='BOOKED' WHERE id=$1 AND status='AVAILABLE'`).
- If `rowCount === 0`, the transaction rolls back immediately and returns HTTP `409 SLOT_TAKEN`.
- **Idempotency Keys:** Mutating requests require an `Idempotency-Key` header to prevent duplicate appointments from network retries or repeated user taps.

---

## 3. State Persistence & Offline Policy

*(To be expanded in Phase 3 & 4)*
- **TanStack Query + AsyncStorage Persister:** Cache read-only catalog data (departments, doctors, upcoming slots) for instant access.
- **Strict No-False-Success Offline Guarantee:** When offline (`@react-native-community/netinfo`), write actions (Book, Reschedule, Cancel) are disabled with clear UI indicators. No booking is ever reported as confirmed until the backend returns HTTP 201/200.

---

## 4. Accessibility & UI/UX Standards

*(To be expanded in Phase 4)*
- Minimum touch targets of 48×48dp across all buttons, inputs, and slot chips.
- Semantic accessibility labels (`accessibilityLabel` and `accessibilityRole`) on all interactive controls.
- Dynamic text scaling resilience without layout clipping or text overlap.
- High-contrast visual hierarchy; status indicators combine color with text labels and iconography (never color alone).

---

## 5. Release-Readiness & Production Roadmap

*(To be expanded in Phase 4)*
- Certificate pinning for API calls to prevent Man-In-The-Middle attacks.
- Crash reporting and performance monitoring integration (e.g. Sentry).
- Push notifications via Firebase Cloud Messaging (FCM) replacing in-app simulation.
- Multi-region database read replicas for global low-latency catalog queries.
