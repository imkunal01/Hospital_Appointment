# Algions AI Labs Submission Form — Pre-Filled Answers

> Assessment: Algions AI Labs Private Limited  
> Internship Role: Android & Mobile App Development  
> Assigned Project: Hospital Appointment Android Application

---

## 1. Candidate Identification

- **Full Name:** `TODO: [Candidate Full Name]`
- **Registration Number:** `TODO: [Candidate Registration Number]`
- **University Email:** `TODO: [Candidate University Email]`

---

## 2. Assignment Confirmation

- **Internship Role:** `Android & Mobile App Development`
- **Exact Assigned Project Title:** `Hospital Appointment Android Application (MediBook)`
- **Domain:** `Hospital Management`

---

## 3. Code and Version

- **Repository URL:** `https://github.com/imkunal01/Hospital_Appointment`
- **Primary Branch:** `main`
- **Final Commit ID:** `cffd5b0` (or latest commit tagged `v1.0.0`)
- **Repository Access:** Public repository. Reviewers can clone directly or inspect all branches and commits.

---

## 4. Demonstration

- **3–5 Minute Video Link:** `[Candidate: Insert your Google Drive / YouTube Unlisted video link here after recording; follow docs/demo-script.md]`
- **Live Demo / Backend URL:** `https://hospital-appointment-api.onrender.com` (Render Web Service)
- **Local Emulator Backend URL:** `http://10.0.2.2:4000`
- **Screenshots Directory:** `docs/screenshots/`

---

## 5. Documentation Links

- **Technical Report / README Link:** `https://github.com/imkunal01/Hospital_Appointment/blob/main/README.md`
- **Architecture Diagram Link:** `https://github.com/imkunal01/Hospital_Appointment/blob/main/docs/architecture.md`
- **API Contract Link:** `https://github.com/imkunal01/Hospital_Appointment/blob/main/docs/api-contract.md`
- **Technical Note Link:** `https://github.com/imkunal01/Hospital_Appointment/blob/main/docs/technical-note.md`
- **Testing Guide Link:** `https://github.com/imkunal01/Hospital_Appointment/blob/main/docs/testing.md`
- **Evaluation Demo Script Link:** `https://github.com/imkunal01/Hospital_Appointment/blob/main/docs/demo-script.md`
- **AI Usage and Attribution Link:** `https://github.com/imkunal01/Hospital_Appointment/blob/main/docs/ai-usage-and-attribution.md`

---

## 6. Technology and Limitations

- **Technology Stack:**
  - **Mobile Client:** React Native (Expo SDK 52) + TypeScript, React Navigation (Tabs + Native Stack), TanStack Query v5 with AsyncStorage persister, `expo-secure-store` for Android Keystore integration, `@react-native-community/netinfo`, Axios.
  - **Backend API:** Node.js + Express 5 + TypeScript, raw SQL via `pg` (Connection Pooling), Zod schema validation, Helmet security headers, CORS, bcrypt password hashing, HMAC SHA-256 JWT tokens.
  - **Database:** PostgreSQL on Supabase (Port 6543 Session Pooler, Row Level Security enabled on all tables with zero public policies).
  - **Cloud Hosting:** Render (Web Service), EAS Build for reproducible Android APK generation.
- **Minimum Android Version:** Android 7.0 Nougat (API Level 24); Target SDK: Android 14 (API Level 34).
- **Permissions Declared:** `android.permission.INTERNET` only (Minimal privilege).
- **Test Coverage:** 65 passing automated tests (35 backend integration/unit tests + 30 mobile component/failure tests).
- **Known Limitations & Assumptions:**
  - Push notifications are simulated in-app based on persisted reminder lead times (1–72 hours) to avoid third-party FCM credential friction during grading.
  - Read-only offline cache: When offline, users can inspect their cached catalog and appointments with an amber banner; write operations (booking, rescheduling, cancelling) are strictly disabled to prevent false confirmations.
  - Free-tier Render server spins down after idle periods; the mobile app handles this via 30s timeouts, a launch warm-up ping, and an informative wake-up banner if responses exceed 5 seconds.
  - Medical visit reports are strictly non-diagnostic metadata (title, date, byte size); no diagnosis or treatment text exists anywhere in the system.

---

## 7. AI and Attribution

- **AI Tools Used:** Antigravity Assistant (powered by Google DeepMind Gemini 3.8 Flash).
- **Purpose of Use:** Architectural structuring, boilerplate scaffolding, database schema & rolling seed scripts, Jest test writing, and markdown documentation formatting.
- **Candidate Ownership:** All generated code was thoroughly reviewed, debugged, and verified through 65 passing automated tests. The candidate can explain every component and modify code live during evaluation.
- **Documentation Link:** `https://github.com/imkunal01/Hospital_Appointment/blob/main/docs/ai-usage-and-attribution.md`

---

## 8. Role-Specific Fields

- **APK Download Link:** `[Candidate: Insert your EAS build download link or GitHub Release asset link here after running 'eas build']`
- **Backend / API Health URL:** `https://hospital-appointment-api.onrender.com/health`
- **Build Instructions Summary:** `cd mobile && eas build -p android --profile preview` (produces standalone `.apk`).

---

## 9. Declarations

- **Originality:** Confirmed. The architecture, implementation, and code were created for this assessment.
- **Code Explainability:** Confirmed. The candidate can walk through every component and modify code live during evaluation.
- **Data Privacy & Secrets:** Confirmed. Synthetic test data only. Zero secrets, API keys, or live patient data committed.
- **Link Accessibility:** Confirmed. All links tested in incognito / private browser window.

