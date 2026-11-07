# Final Submission Checklist

> Assessment: Algions AI Labs Private Limited  
> Project: Hospital Appointment Android Application  
> Domain: Hospital Management

---

## 1. Product & Functional Requirements

- [x] **APK Installation:** EAS build configured (`mobile/eas.json` preview profile targeting standalone APK); minimal SDK 24 / target SDK 34 verified.
- [x] **Authentication:** Login works using demo credentials (`patient1@example.test` / `Password123!`); invalid credentials handled cleanly.
- [x] **Main Journey:** Browse departments -> select doctor -> pick slot -> book -> receive unique reference (`HA-YYYYMMDD-XXXX`) and `CONFIRMED` status.
- [x] **Appointment Management:** Rescheduling to a new slot executes an atomic swap; cancellation frees slot and updates status to `CANCELLED`.
- [x] **Report Metadata:** Report metadata displays title, date, size; strictly **no diagnosis or treatment recommendations** anywhere.
- [x] **Preferences & History:** Upcoming/past appointment filter tabs and reminder preferences (1–72h) toggle and persist correctly.
- [x] **Acceptance Test A1 (Slot Conflict):** Booking a taken slot displays an actionable error and automatically refreshes availability.
- [x] **Acceptance Test A4 (Offline / Failure Recovery):** Airplane mode shows offline banner, prevents write actions, and recovers without crashing when connectivity returns.
- [x] **Acceptance Test A5 (No False Success):** No success state or confirmation screen is shown before the server confirms with HTTP 200/201.

---

## 2. Engineering & Security Standards

- [x] **Token Security:** Refresh token stored in `expo-secure-store` only; access token kept strictly in memory; zero secrets logged.
- [x] **SQL Injection Prevention:** All SQL queries use parameterized arguments via `pg` (`$1, $2, ...`).
- [x] **Access Isolation:** Every appointment query is scoped to the authenticated patient (`patient_id = $userId`); others' IDs return 404.
- [x] **Database RLS:** Row Level Security enabled on all 8 PostgreSQL tables with no public policies, blocking unauthorized Supabase REST access.
- [x] **Minimal Permissions:** Only `android.permission.INTERNET` declared in `mobile/app.json`.
- [x] **Automated Tests:** 65 passing automated tests (35 backend integration tests + 30 mobile component and failure recovery tests).

---

## 3. Documentation

- [x] `README.md` complete with all 13 required sections, demo credentials, local setup, and known limitations.
- [x] `docs/api-contract.md` accurately reflects all deployed routes, schemas, and standardized error response shapes.
- [x] `docs/architecture.md` contains rendered Mermaid diagrams (ER diagram, System Component diagram, Mobile Layering, Booking Sequence).
- [x] `docs/technical-note.md` covers security architecture, transaction atomicity, cache persistence, accessibility, and release-readiness.
- [x] `docs/testing.md` and `docs/test-evidence/` contain reproducible commands and saved test execution logs.
- [x] `docs/demo-script.md` contains a timed 3–5 minute video shot list, spoken points, and acceptance test references.
- [x] `docs/ai-usage-and-attribution.md` fully completed with honest per-phase log and open-source library licenses.
- [x] `docs/submission-form-answers.md` pre-filled with technical answers for easy submission.

---

## 4. Final Submission Steps (Candidate Action Items)

- [x] **Git Cleanliness:** Git history clean of `.env`, passwords, tokens, keystores, or personal data.
- [x] **Environment Templates:** `.env.example` placeholders present in both `backend/` and `mobile/`.
- [ ] **Candidate Form Details:** Enter Candidate Full Name, Registration Number, and University Email in `docs/submission-form-answers.md`.
- [ ] **EAS Cloud APK Build:** Run `eas build -p android --profile preview` from `mobile/` to compile the standalone APK and copy the APK URL into the form.
- [ ] **Record Demo Video:** Record 3–5 minute evaluation video following `docs/demo-script.md`, upload to YouTube (Unlisted) or Google Drive, and paste link into form.
- [ ] **Tag Final Release:** Tag commit with `git tag v1.0.0 && git push origin main --tags`.
- [ ] **Verification in Incognito:** Verify repository, documentation links, and video link in an incognito window.

