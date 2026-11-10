# Testing Guide & Manual Failure Scenarios

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management

---

## 1. Automated Test Execution

The codebase contains **65 automated tests** across 11 test suites covering backend services, database transactions, concurrency, security policies, mobile components, and state management.
The codebase contains **77 automated tests** across 12 test suites covering backend services, database transactions, concurrency, security policies, mobile components, and state management.

### 1.1 Backend Test Suite (35 Tests)
### 1.1 Backend Test Suite (47 Tests)
The backend uses **Jest** with **Supertest** for integration, security, and transaction verification:

```bash
cd backend
npm test
```

**Coverage Breakdown:**
- `tests/logger.test.ts` (12 tests): PII and secret redaction (passwords, JWTs, Bearer tokens, patient email/phone/name/dob, circular objects), `X-Request-ID` correlation ID generation and propagation, log level filtering (`debug`, `info`, `warn`, `error`), HTTP access logging on completion, and operational error logging.
- `tests/health.test.ts` (2 tests): Health check endpoint and graceful DB ping failure handling.
- `tests/auth.test.ts` (9 tests): User login, bcrypt validation, JWT access issuance, SHA-256 hashed refresh token generation, token refresh cycle, logout invalidation, and rate limiting (10 req/15 min).
- `tests/catalog.test.ts` (8 tests): Department listing, doctor filtering by department, and slot queries with date validation and status filtering.
- `tests/appointments.test.ts` (12 tests):
  - Atomic slot locking and appointment creation (`POST /appointments`).
  - Strict concurrency testing: racing requests for the identical slot (`Promise.all`), guaranteeing exactly one 201 and one 409 `SLOT_TAKEN`.
  - Idempotency deduplication using `Idempotency-Key` headers.
  - Appointment list scoping (`patient_id = $userId`) and 404 isolation when querying other patients' appointments.
  - Rescheduling swap atomicity and rollback on conflict.
  - Idempotent cancellation and slot freeing.
  - Report metadata retrieval verifying strictly non-diagnostic data (no diagnosis or treatment fields).
- `tests/preferences.test.ts` (4 tests): Fetching default reminder preferences and updating reminder settings with 1-72 hour validation.

*Evidence log: `docs/test-evidence/backend-final.txt`*

### 1.2 Mobile Test Suite (30 Tests)
The mobile application uses **Jest** with **React Native Testing Library (RNTL)** for component, navigation, and failure state verification:

```bash
cd mobile
npm test
```

**Coverage Breakdown:**
- `__tests__/errors.test.ts` (5 tests): Mapping API error shapes to user-friendly messages for `SLOT_TAKEN`, `UNAUTHORIZED`, `TOKEN_EXPIRED`, `RATE_LIMITED`, and network errors.
- `__tests__/authStore.test.ts` (5 tests): Session token storage strictly in-memory; refresh token storage in Android Keystore (`expo-secure-store`); secure clearing on logout.
- `__tests__/booking.test.tsx` (9 tests):
  - Renders department and doctor catalog.
  - Real-time slot selection and confirm modal display.
  - **Rule A5 (No False Success):** Asserts button shows loading indicator and navigation to ConfirmationScreen occurs strictly after HTTP 201 confirmation.
  - **Rule A1 (Slot Conflict):** Asserts 409 `SLOT_TAKEN` triggers actionable alert dialog and invalidates slots cache.
  - Disables action buttons while booking mutation is pending.
- `__tests__/appointmentManagement.test.tsx` (2 tests):
  - Double-tap debouncing: verifies rapid double-clicking on "Cancel Appointment" invokes the API mutation exactly once.
  - Non-diagnostic report metadata: verifies visit report title, file size, and upload date render without clinical diagnoses.
- `__tests__/offlineAndFailure.test.tsx` (5 tests):
  - **Rule A4 (Offline Behavior):** Verifies "You are currently offline" banner renders when network is lost.
  - Verifies "Confirm Booking" button is disabled in offline mode.
  - Verifies "Cancel Appointment" button is disabled in offline mode.
  - Verifies cached appointment history remains viewable in offline mode.
  - Verifies banner disappears and actions re-enable when network reconnects.
- `__tests__/loginValidation.test.tsx` (4 tests):
  - Validates email and password format before submission.
  - Displays user-friendly error on invalid credentials (401 `UNAUTHORIZED`).
  - Pre-fills synthetic demo credentials via quick-fill chip.

*Evidence log: `docs/test-evidence/mobile-final.txt`*

---

## 2. Acceptance Test Verifications (Required by Brief)

| ID | Test Scenario | Acceptance Criteria | How Proven |
|---|---|---|---|
| **A1** | Slot taken before confirmation | Actionable error displayed; slots automatically refetched. | Backend concurrency test (`tests/appointments.test.ts`) + mobile `SLOT_TAKEN` handler (`DoctorDetailScreen.tsx`) + video demo. |
| **A2** | Clean install | App installs and runs from standalone APK on clean emulator/device. | EAS APK clean-install run on fresh Android device (API Level 24+). |
| **A3** | Complete main journey | Browse departments -> select doctor -> pick slot -> confirmed reference. | End-to-end flow with server-confirmed status (`HA-YYYYMMDD-XXXX`). |
| **A4** | Offline / API failure recovery | App handles network loss without crash; recovers on reconnection. | Airplane-mode toggled during session; cache readable, writes safely disabled. |
| **A5** | No false success | No confirmation screen or success state displayed before backend 200/201. | State assertion; mutation navigation strictly inside `onSuccess`. |

---

## 3. Step-by-Step Manual Failure Simulation Scenarios

### Scenario 1: Concurrency Slot Collision (Test A1)
**Goal:** Verify that two patients attempting to book the same slot simultaneously receive a clean conflict resolution without corruption or double booking.
1. Sign in to Device 1 (or Emulator A) as `patient1@example.test`.
2. Sign in to Device 2 (or Emulator B) as `patient2@example.test`.
3. On both devices, navigate to: **Cardiology** -> **Dr. Sarah Mitchell** -> select tomorrow's date.
4. On both devices, tap the exact same time slot (e.g., `09:00 AM`). The confirmation bottom sheet / modal opens on both devices.
5. Tap **"Confirm Booking"** on Device 1 first. Observe:
   - Device 1 receives HTTP 201 and navigates to the **Confirmation Screen** with appointment reference `HA-...`.
6. Tap **"Confirm Booking"** on Device 2 immediately after. Observe:
   - Device 2 receives HTTP 409 `SLOT_TAKEN`.
   - An alert dialog appears: *"Slot Unavailable: This slot has just been reserved by another patient. Please choose another time."*
   - Tapping "OK" dismisses the alert and automatically refetches available slots.
   - The `09:00 AM` slot is now marked disabled or removed from the grid.

### Scenario 2: Airplane Mode / Offline Cache & Action Lockdown (Test A4)
**Goal:** Verify that network disconnect does not crash the app, displays cached data safely, and prevents offline writes that could cause false positive confirmations.
1. Sign in as `patient1@example.test`.
2. Navigate to **"My Appointments"** and **"Find Doctors"** to populate the local TanStack Query cache.
3. Turn on **Airplane Mode** (or disable Wi-Fi and Mobile Data) on the Android device.
4. Observe the top of the screen:
   - An amber **"Offline Mode — You are currently offline. Showing cached data. Booking and changes are disabled."** banner appears.
5. Tap on an upcoming appointment in the list:
   - The details screen opens smoothly using cached data.
   - The **"Reschedule Appointment"** and **"Cancel Appointment"** buttons are disabled (greyed out with `opacity: 0.5` and non-clickable).
6. Navigate to a doctor slot picker:
   - Cached doctors and previously viewed slots appear.
   - The **"Confirm Booking"** button is disabled.
7. Turn off **Airplane Mode**:
   - Within 1–2 seconds, NetInfo triggers a reconnect event.
   - The offline banner smoothly animates away.
   - The action buttons re-enable immediately without requiring an app reload or login.

### Scenario 3: No False Positive Booking State (Test A5)
**Goal:** Prove that the mobile client never displays a confirmed booking screen or optimistic success before the server responds.
1. Select a slot and tap "Confirm Booking".
2. Observe the button state:
   - The button text is replaced by an `ActivityIndicator`.
   - The button touch target is disabled to prevent duplicate submissions.
   - The screen remains on the Doctor Detail view until the server responds.
   - Only upon receiving HTTP 201 `CONFIRMED` does React Navigation push the `ConfirmationScreen`.
   - If the network drops during the flight, an error alert is shown and the user remains on the booking screen with their selection intact.

### Scenario 4: Silent Token Expiration & Seamless Refresh
**Goal:** Verify that a 15-minute access token expiration does not disrupt the user's workflow.
1. When the access token expires, any API request returns HTTP 401 with code `TOKEN_EXPIRED`.
2. The Axios response interceptor in `mobile/src/api/client.ts` catches this code.
3. It pauses the failed request and checks for an active refresh promise.
4. It calls `POST /auth/refresh` with the refresh token from `expo-secure-store`.
5. Upon receiving a fresh access token, it updates the in-memory session store and automatically replays the original failed request.
6. The user experiences zero interruption or unexpected redirect to the login screen.

### Scenario 5: Render Free-Tier Cold-Start Handling
**Goal:** Provide transparent UX when the backend server is waking up from idle sleep.
1. If no requests have been made for 15+ minutes, Render spins down the free-tier web service.
2. When the user launches the app or submits a form, if the server takes longer than 5 seconds to reply:
   - A friendly blue banner appears: *"Connecting to server... Server is waking up (Render free-tier may take 30s). Please wait."*
3. The HTTP client timeout is configured to 30 seconds (preventing premature connection abortion).
4. Once the server answers, the banner clears automatically.

