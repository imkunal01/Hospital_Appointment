# Hospital Appointment Android Application

> Assessment: Algions AI Labs Private Limited  
> Role: Android & Mobile App Development  
> Assigned Domain: Hospital Management  
> Project Title: Hospital Appointment Android Application

---

## 1. Overview and Assigned Project Title

The **Hospital Appointment Android Application** is a patient-facing mobile application designed for seamless discovery of medical departments and doctors, viewing live available appointment slots, and performing atomic bookings, reschedules, and cancellations. The system provides real-time appointment status tracking and displays strictly non-diagnostic visit/report metadata.

The application is built to handle real-world mobile challenges: server cold starts, network dropouts, offline states, race conditions during slot bookings, and session lifecycle transitions without crashes or false positive states.

---

## 2. Tech Stack and Why

| Layer | Technology | Rationale |
|---|---|---|
| **Mobile Client** | React Native (Expo) + TypeScript | Cross-platform rapid development, strict typing, and reproducible cloud/local builds via EAS without requiring local Android SDK. |
| **Server State & Caching** | TanStack Query + AsyncStorage Persister | Robust caching, automatic background refetching, and graceful offline cache viewing with write mutations strictly disabled offline. |
| **Secure Token Storage** | `expo-secure-store` | Hardware-backed Android Keystore storage for refresh tokens; short-lived access tokens kept strictly in-memory. |
| **Backend API** | Node.js + Express + TypeScript | Lightweight, high-throughput, predictable lifecycle, type-safe API routing with edge validation using Zod. |
| **Database** | PostgreSQL on Supabase (Pooler) | Transactional ACID compliance, atomic slot reservation, RLS enabled on all tables, and raw parameterized SQL queries via `pg`. |
| **Hosting & Deployment**| Render (Free Tier Web Service) | Turnkey HTTPS deployment ensuring the reviewer's APK connects immediately without local proxy setup. |
| **Build & Distribution**| EAS Build (APK preview profile) | Automated, clean-room compilation of installable Android APKs. |

---

## 3. Architecture

For full architectural diagrams, component relationships, ER models, and booking lifecycle sequence diagrams, see:
- [docs/architecture.md](docs/architecture.md)

### System Component Overview
```
[ Android Device (Expo Mobile App) ]
         │  HTTPS / REST (Axios)
         ▼
[ Render Web Service (Express + TypeScript API) ]
         │  PostgreSQL TCP (pg Pooler, Port 6543)
         ▼
[ Supabase Hosted PostgreSQL Database ]
```

---

## 4. Minimum Android Version

- **Minimum SDK:** `24` (Android 7.0 Nougat)
- **Target SDK:** `34` (Android 14)
- **Rationale:** Supports modern crypto primitives for `expo-secure-store` (Android Keystore), widespread device compatibility (>95% active Android devices), and stable networking stack.

---

## 5. Permissions

The application follows the principle of least privilege. Only essential networking permissions are requested:

| Permission | Protection Level | Purpose |
|---|---|---|
| `android.permission.INTERNET` | Normal | Required to communicate with the REST API backend hosted on Render. |
| `android.permission.ACCESS_NETWORK_STATE` | Normal | Used by `@react-native-community/netinfo` to detect airplane mode / network loss and prevent false-success write operations. |

*No sensitive permissions (camera, location, contacts, external storage) are requested or required.*

---

## 6. API Configuration

- **Production Base URL:** `https://hospital-appointment-api.onrender.com` (configured in `mobile/.env.example`)
- **Local Dev URL (Android Emulator):** `http://10.0.2.2:4000`
- **Environment Variable:** `EXPO_PUBLIC_API_URL`
- **Cold-Start Handling Note:** The Render free-tier spins down after inactivity (30-60 second spin-up). The mobile app includes a 30-second client timeout, performs an initial `GET /health` warm-up probe on launch, and displays a user-friendly *"Server is waking up..."* message if responses take longer than 5 seconds.

---

## 7. Local Setup

### 7.1 Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your DATABASE_URL in .env
npm run dev
# Server starts on http://localhost:4000
```

### 7.2 Mobile Setup
```bash
cd mobile
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your backend or http://10.0.2.2:4000 for emulator
npx expo start
```

---

## 8. Build Instructions

### 8.1 Reproducible APK Build via EAS
```bash
cd mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
The EAS build will generate an installable standalone `.apk` artifact directly downloadable from Expo's build portal.

### 8.2 Clean-Install Verification
1. Download the generated `.apk` file to a physical Android device or drag-and-drop into an Android Studio emulator (API 24+).
2. Allow installation from unknown sources if prompted.
3. Launch the app and sign in using the demo credentials below.

---

## 9. Demo Credentials (Synthetic Patients)

All seed accounts are synthetic. Passwords use standard bcrypt hashing.

| Role | Email | Password | Purpose |
|---|---|---|---|
| **Patient 1** | `patient1@example.test` | `Password123!` | Primary demo account; includes seeded past appointment with report metadata. |
| **Patient 2** | `patient2@example.test` | `Password123!` | Secondary account used for simulating concurrency and slot-taken conflict tests. |

---

## 10. Running Tests

Comprehensive test suites (65 tests across 11 suites) verify backend domain logic, atomic transactions, concurrency, mobile UI flows, offline states, and failure recovery.

```bash
# Backend unit & integration tests (35 tests)
cd backend
npm test

# Mobile component, state & failure tests (30 tests)
cd mobile
npm test
```

See [docs/testing.md](docs/testing.md) for step-by-step test breakdowns and manual failure simulation procedures.

---

## 11. Documentation Index

- [docs/architecture.md](docs/architecture.md) — System architecture, Mermaid ER diagram, booking sequence diagram, and mobile layering.
- [docs/api-contract.md](docs/api-contract.md) — Complete REST API specification with request/response schemas and standardized error codes.
- [docs/technical-note.md](docs/technical-note.md) — Technical notes on secure storage, state persistence, accessibility, and release-readiness.
- [docs/testing.md](docs/testing.md) — Test execution guide and manual failure test scenarios.
- [docs/demo-script.md](docs/demo-script.md) — Structured 3–5 minute evaluation video walk-through script.
- [docs/ai-usage-and-attribution.md](docs/ai-usage-and-attribution.md) — Log of AI tool usage, purpose, and open-source library attributions.
- [docs/submission-form-answers.md](docs/submission-form-answers.md) — Pre-filled fields for the assessment submission form.
- [docs/submission-checklist.md](docs/submission-checklist.md) — Verification gate checklist prior to final submission.

---

## 12. Known Limitations and Assumptions

1. **Simulated Push Notifications:** Reminder preferences are persisted on the server, but actual device push notifications are simulated in-app (avoiding third-party FCM credential setup for evaluation).
2. **Read-Only Offline Caching:** When offline, cached catalog and appointment data can be viewed with a clear "Offline" banner, but all booking/modifying mutations are blocked to guarantee no false positive bookings.
3. **Time Zone Representation:** Appointment slots are stored in UTC in PostgreSQL and formatted to the local device time zone on the mobile client.
4. **Render Free-Tier Cold Starts:** API may take 30-50 seconds to respond on initial wake-up after inactivity.

---

## 13. AI Usage and Attribution

Transparent AI usage log and third-party library attributions are documented in:
- [docs/ai-usage-and-attribution.md](docs/ai-usage-and-attribution.md)
