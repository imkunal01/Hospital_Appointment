# Final Submission Checklist

> Assessment: Algions AI Labs Private Limited  
> Project: Hospital Appointment Android Application

---

## 1. Product & Functional Requirements

- [ ] **APK Installation:** APK installs cleanly on a fresh device or clean emulator without pre-existing dependencies.
- [ ] **Authentication:** Login works using demo credentials (`patient1@example.test` / `Password123!`).
- [ ] **Main Journey:** Browse departments -> select doctor -> pick slot -> book -> receive unique reference and `CONFIRMED` status.
- [ ] **Appointment Management:** Reschedule to new slot works; cancellation frees slot and updates status to `CANCELLED`.
- [ ] **Report Metadata:** Report metadata displays title, date, size; strictly **no diagnosis or treatment recommendations** anywhere.
- [ ] **Preferences & History:** Upcoming/past appointment filter tabs and reminder preferences toggle correctly.
- [ ] **Acceptance Test A1 (Slot Conflict):** Booking a taken slot displays an actionable error and automatically refreshes availability.
- [ ] **Acceptance Test A4 (Offline / Failure Recovery):** Airplane mode shows offline banner, prevents write actions, and recovers without crashing when connectivity returns.
- [ ] **Acceptance Test A5 (No False Success):** No success state or confirmation screen is shown before the server confirms with HTTP 200/201.

---

## 2. Engineering & Security Standards

- [ ] **Token Security:** Refresh token stored in `expo-secure-store` only; access token kept strictly in memory; no secrets logged.
- [ ] **SQL Injection Prevention:** All SQL queries use parameterized arguments via `pg`.
- [ ] **Access Isolation:** Every appointment query is scoped to the authenticated patient (`patient_id = $userId`); others' IDs return 404.
- [ ] **Database RLS:** Row Level Security enabled on all 8 PostgreSQL tables with no public policies.
- [ ] **Minimal Permissions:** Only `android.permission.INTERNET` and `ACCESS_NETWORK_STATE` requested in manifest.
- [ ] **Automated Tests:** Backend tests (`npm test`) and mobile tests pass with zero failures.

---

## 3. Documentation

- [ ] `README.md` complete with all required headings, demo credentials, setup, and limitations.
- [ ] `docs/api-contract.md` accurately reflects all deployed routes and error shapes.
- [ ] `docs/architecture.md` contains rendered Mermaid diagrams (ER, Component, Mobile Layering, Booking Sequence).
- [ ] `docs/technical-note.md` covers secure storage, persistence, accessibility, and release-readiness.
- [ ] `docs/testing.md` and `docs/test-evidence/` contain reproducible commands and saved logs.
- [ ] 3–5 minute walkthrough video recorded and hosted with public/reviewer access.
- [ ] `docs/ai-usage-and-attribution.md` fully completed and honest.
- [ ] `docs/submission-form-answers.md` completed.

---

## 4. Hygiene & Verification

- [ ] Git history clean of `.env`, passwords, tokens, keystores, or personal data (`git log -p | grep -i password`).
- [ ] `.env.example` placeholders present in both `backend/` and `mobile/`.
- [ ] Final commit tagged (`v1.0.0`) and commit hash recorded.
- [ ] Render service and Supabase database are awake and verified responsive.
- [ ] Every submission link verified in an incognito window.
