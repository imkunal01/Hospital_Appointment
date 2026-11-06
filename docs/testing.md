# Testing Guide & Manual Failure Scenarios

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management

---

## 1. Automated Test Execution

### 1.1 Backend Test Suite
The backend uses **Jest** with **Supertest** for integration and domain validation tests.

```bash
cd backend
npm test
```

### 1.2 Mobile Test Suite
The mobile app uses **Jest** with **React Native Testing Library (RNTL)** for component and hook testing.

```bash
cd mobile
npm test
```

---

## 2. Acceptance Test Verifications (Required by Brief)

| ID | Test Scenario | Acceptance Criteria | How Proven |
|---|---|---|---|
| **A1** | Slot taken before confirmation | Actionable error displayed; slots automatically refetched. | Backend concurrency test + mobile `SLOT_TAKEN` handler + video demo. |
| **A2** | Clean install | App installs and runs from standalone APK on clean emulator/device. | EAS APK clean-install run on fresh Android device. |
| **A3** | Complete main journey | Browse departments -> select doctor -> pick slot -> confirmed reference. | End-to-end flow with server-confirmed status. |
| **A4** | Offline / API failure recovery | App handles network loss without crash; recovers on reconnection. | Airplane-mode toggled during session; cache readable, writes safely disabled. |
| **A5** | No false success | No confirmation screen or success state displayed before backend 200/201. | State assertion; mutation navigation strictly inside `onSuccess`. |

---

## 3. Manual Failure Scenarios

1. **Simulate Concurrency Conflict (A1):**
   - Open app on two devices / browser tabs with two accounts.
   - Select the same doctor and identical time slot.
   - Tap "Confirm Booking" on Device 1 (succeeds).
   - Tap "Confirm Booking" on Device 2 (fails with `SLOT_TAKEN`; slot refreshes to disabled/booked).

2. **Simulate Offline Behavior (A4):**
   - Navigate to doctor slot picker.
   - Turn on Airplane Mode.
   - Verify offline banner appears: "You are currently offline. Bookings are disabled."
   - Confirm booking button is disabled.
   - Turn off Airplane Mode: banner clears and actions re-enable without restarting app.
