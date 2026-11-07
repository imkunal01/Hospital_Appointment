# 3–5 Minute Evaluation Video Script & Shot List

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management  
> Total Target Runtime: 3:30 to 4:15 minutes

---

## 1. Video Objectives & Assessment Alignment

The demonstration video must clearly establish the 5 mandatory acceptance criteria specified by Algions AI Labs:
- **A1:** Slot taken before confirmation (graceful 409 `SLOT_TAKEN` handling and automatic refetch).
- **A2:** Clean installation from standalone APK.
- **A3:** Complete patient booking journey (discovery to server-confirmed reference).
- **A4:** Offline resilience and network recovery (read-only cached state, write mutations disabled).
- **A5:** No false positive success (no confirmation screen shown before HTTP 201 response).

---

## 2. Shot List & Step-by-Step Demonstration Script

| Timestamp | Shot / Screen | Action & On-Screen Demonstration | Spoken Voiceover Script | Acceptance Criteria |
|---|---|---|---|---|
| **0:00 - 0:35** | **Clean Installation & Setup** | - Show Android home screen on fresh emulator/device.<br>- Drag and drop / install standalone APK (`hospital-appointment.apk`).<br>- Tap to open app.<br>- Show login screen with quick-fill demo chips. | *"Hello evaluators, my name is [Your Name]. This is my submission for the Algions AI Labs Android & Mobile App Development assessment — the Hospital Appointment Android Application. We begin with a clean install of the standalone release APK built via EAS on Android 14. As the app launches, our client performs a warm-up ping to our Render-hosted REST API and PostgreSQL database."* | **A2** (Clean install from standalone APK) |
| **0:35 - 1:20** | **Authentication & Main Booking Journey** | - Tap "Patient 1" quick-fill chip (`patient1@example.test`).<br>- Tap "Sign In".<br>- Browse "Cardiology" department.<br>- Select "Dr. Sarah Mitchell".<br>- Pick tomorrow's date; choose slot `10:00 AM`.<br>- Tap "Confirm Booking".<br>- Show loading state on button.<br>- Arrive on Confirmation Screen with reference `HA-...`. | *"I sign in using our synthetic demo patient credentials. Tokens are handled with bank-grade security: the refresh token is stored in the encrypted Android Keystore via expo-secure-store, while short-lived access tokens exist strictly in-memory. Let's browse departments, choose Cardiology, and select Dr. Sarah Mitchell. We select tomorrow at 10:00 AM. When I tap 'Confirm Booking', notice the disabled loading spinner. Crucially, as required by Rule A5, the confirmation screen is NEVER shown optimistically — it appears only after our backend confirms with HTTP 201, returning our unique booking reference HA-2026-XXXX and CONFIRMED status."* | **A3** (Main journey),<br>**A5** (No false success) |
| **1:20 - 2:05** | **Slot Collision & Concurrency (A1)** | - Open parallel session (Device 2 / split screen) with `patient2@example.test`.<br>- Attempt to book the exact same slot that Patient 1 just confirmed, or trigger concurrent slot booking.<br>- Device 2 displays actionable conflict alert: *"Slot Unavailable"*. | *"Now let's demonstrate concurrency safety. If another patient attempts to book the same slot simultaneously, our PostgreSQL atomic update with row locking rejects the collision. On mobile, rather than crashing or showing a generic error, the user receives an immediate actionable alert: 'This slot has just been reserved by another patient.' Dismissing this alert automatically invalidates the query cache, immediately refreshing the slot grid to show it as booked."* | **A1** (Slot taken conflict) |
| **2:05 - 2:50** | **Offline Mode & Network Recovery (A4)** | - Pull down notification shade; enable Airplane Mode.<br>- Observe amber Offline Banner: *"You are currently offline. Showing cached data."*<br>- Browse cached doctor catalog and appointments.<br>- Attempt to tap "Book" or "Reschedule" (buttons disabled).<br>- Turn off Airplane Mode.<br>- Banner dismisses and controls re-enable. | *"Next, let's test real-world network resilience. I toggle Airplane Mode. Instantly, our NetInfo listener and TanStack Query persister kick in. An amber banner informs the patient that the app is in offline mode with cached data. Notice that all write mutations — booking, rescheduling, and cancellation — are strictly disabled to prevent false confirmations or uncommitted states. When I restore connectivity, the offline banner smoothly dismisses and write controls re-enable without needing an app restart."* | **A4** (Offline recovery & read-only cache) |
| **2:50 - 3:35** | **Appointment Management & Non-Diagnostic Reports** | - Go to "My Appointments" tab.<br>- Switch between "Upcoming" and "Past" tabs.<br>- Tap the upcoming appointment -> tap "Reschedule" -> pick new slot -> confirm atomic swap.<br>- Tap "Cancel Appointment" with confirmation alert.<br>- Tap past appointment to show Visit Reports.<br>- Point out metadata fields (title, date, size) with zero diagnostic text. | *"Moving to the Appointments tab, we have filter tabs for Upcoming and Past visits. Let's reschedule our appointment — the server performs an atomic swap, freeing our previous slot and locking the new one. Now let's view a past visit. Notice our report documents: as mandated by the brief and privacy rules, reports contain strictly non-diagnostic metadata — file title, upload timestamp, and byte size. No clinical diagnosis or medical prescriptions are stored or exposed."* | Assessment Domain & Non-Diagnostic Rule |
| **3:35 - 4:10** | **Preferences, Test Suite & Summary** | - Open "Profile" -> "Notification Preferences".<br>- Toggle reminders and change lead time from 24h to 48h.<br>- Briefly show terminal showing 65/65 tests passing across backend and mobile.<br>- Conclude video. | *"Finally, in Notification Preferences, users can customize reminder lead times between 1 and 72 hours. Our entire codebase is backed by 65 passing automated tests across 11 suites, with parameterized SQL, RLS isolation, and accessible 48dp touch targets. All source code, API documentation, and architecture diagrams are pushed to GitHub. Thank you for your review."* | Quality & Release-Readiness |

---

## 3. Recording Tips for the Candidate

1. **Screen Resolution:** Record Android device or emulator at 1080p (1920x1080) at 30 or 60 fps.
2. **Audio:** Use a clean microphone or headset; avoid background noise.
3. **Pacing:** Keep mouse clicks / finger taps deliberate and clear. Don't rush past the loading states or the offline banner.
4. **Hosting:** Upload the video to **Google Drive** (set sharing to *"Anyone with the link can view"*) or **YouTube** as an *"Unlisted"* video. Test the link in an incognito window before submitting!

