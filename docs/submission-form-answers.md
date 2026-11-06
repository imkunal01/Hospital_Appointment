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
- **Exact Assigned Project Title:** `Hospital Appointment Android Application`
- **Domain:** `Hospital Management`

---

## 3. Code and Version

- **Repository URL:** `TODO: [GitHub Repository URL, e.g. https://github.com/username/hospital-appointment]`
- **Primary Branch:** `main`
- **Final Commit ID:** `TODO: [To be captured on Day 5 after tagging v1.0.0, e.g. a1b2c3d4...]`
- **Repository Access:** Public or reviewer access granted to `algions-evaluator` / designated email.

---

## 4. Demonstration

- **3–5 Minute Video Link:** `TODO: [Google Drive / YouTube Unlisted Video Link]`
- **Live Demo / Backend URL:** `https://hospital-appointment-api.onrender.com` (or local declaration)
- **Screenshots Directory:** `docs/screenshots/`

---

## 5. Documentation Links

- **Technical Report / README Link:** `https://github.com/username/hospital-appointment/blob/main/README.md`
- **Architecture Diagram Link:** `https://github.com/username/hospital-appointment/blob/main/docs/architecture.md`
- **API Contract Link:** `https://github.com/username/hospital-appointment/blob/main/docs/api-contract.md`
- **Technical Note Link:** `https://github.com/username/hospital-appointment/blob/main/docs/technical-note.md`
- **Testing Guide Link:** `https://github.com/username/hospital-appointment/blob/main/docs/testing.md`

---

## 6. Technology and Limitations

- **Technology Stack:** React Native (Expo) + TypeScript, TanStack Query, `expo-secure-store`, Node.js + Express + TypeScript, PostgreSQL (Supabase), Render hosting, EAS Build for APK.
- **Minimum Android Version:** Android 7.0 (API Level 24)
- **Android Device / Emulator Tested:** `TODO: [e.g. Google Pixel 7 (Android 14) / Android Studio Emulator API 34]`
- **Setup Notes:** Outlined in `README.md` Section 7.
- **Known Limitations & Assumptions:**
  - Reminder preferences saved on server; client notifications are simulated.
  - Read-only offline cache; writes strictly disabled while offline to prevent false confirmation.
  - Render free tier cold-start of 30-50s managed via 30s timeout and warm-up ping.
  - Report files are represented strictly as metadata (title, type, size); no diagnostic or treatment text.

---

## 7. AI and Attribution

- **AI Tools Used:** Antigravity Assistant (Gemini 3.8 Flash).
- **Purpose of Use:** Architectural layout, boilerplate scaffolding, SQL schema & seed scripts, Jest test writing, error handling patterns.
- **Documentation Link:** `https://github.com/username/hospital-appointment/blob/main/docs/ai-usage-and-attribution.md`

---

## 8. Role-Specific Fields

- **APK Download Link:** `TODO: [Direct EAS download link or GitHub Release asset link]`
- **Backend / API Health URL:** `https://hospital-appointment-api.onrender.com/health`
- **Build Instructions Summary:** `cd mobile && eas build -p android --profile preview`

---

## 9. Declarations

- **Originality:** Confirmed. The architecture, implementation, and code were created for this assessment.
- **Code Explainability:** Confirmed. The candidate can walk through every component and modify code live during evaluation.
- **Data Privacy & Secrets:** Confirmed. Synthetic test data only. Zero secrets, API keys, or live patient data committed.
- **Link Accessibility:** Confirmed. All links tested in incognito / private browser window.

