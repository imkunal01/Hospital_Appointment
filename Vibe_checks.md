# Vibe-Coding Guide + Production Readiness Checklist
### Hospital Appointment App (React Native/Expo + Node/Express + Supabase Postgres + Render)

> Purpose: build fast with an AI editor **without** shipping fragile, insecure or unexplainable code.
> Use this file as a living checklist. Tick items as you finish each phase of `EXECUTION_PLAN.md`.

---

## 1. How to vibe code safely (read this first)

AI editors write plausible code quickly, but they also invent things, skip edge cases and leave debris. Follow these rules for every task.

### 1.1 The loop (per task, 15-45 minutes)
1. **Small task:** one screen, one endpoint, or one fix. Never "build the whole app".
2. **Ask for a plan first**, read it, and delete anything extra.
3. **Let it implement, then run it.** Backend: `npm test` + one curl. Mobile: open the screen on your phone.
4. **Read the diff.** If you can't explain a block, ask the AI to explain it or simplify it.
5. **Commit** with a clear message. Small commits make rollbacks painless.
6. **Update the docs** that the change touched.

### 1.2 Typical AI mistakes to catch
| Mistake | How it shows up | Your defence |
|---|---|---|
| Invented or wrong packages/APIs | Install errors, "X is not a function" | Check the package on npmjs.com and its official docs before accepting |
| Wrong versions for Expo | Native module crashes, red screens | Always install mobile libs with `npx expo install <pkg>`, never plain `npm i` |
| Outdated patterns | Deprecated navigation/query APIs | Check the library's current docs for the major version you installed |
| Swallowed errors | Empty `catch {}`, `console.log(err)` only | Ask: "what does the user see when this fails?" |
| Fake/mock data left in | Hard-coded doctors in screens | Grep for arrays of sample data in `mobile/` |
| Success shown too early | Navigate before the server responds | Navigation only in mutation `onSuccess` |
| Missing ownership checks | Any logged-in user can read any appointment | Every query filters by `patient_id` |
| String-built SQL | Template strings with `${}` inside queries | Only `$1, $2` placeholders |
| Secrets in code | Keys in source or logs | `.env`, `.env.example`, grep before commit |
| TypeScript escape hatches | `any`, `// @ts-ignore` everywhere | Turn on `"strict": true`, ban `any` in review |
| Over-building | Extra features, new libraries | Prompt says "no features beyond this list" |
| Leftover debug code | `console.log(token)`, TODOs | Audit commands in section 8 |

### 1.3 Prompt habits that give better code
- State the **user-visible behaviour** and the **failure behaviour** in the same prompt.
- Paste the exact error message and the file path when debugging. Don't say "it doesn't work".
- Ask for **one change at a time** when debugging. Re-run after each.
- When it "fixes" something by adding more code, ask: "what was the root cause?"
- Ask it to **write the test first** for backend business rules (booking, cancel, reschedule).

---

## 2. Backend: necessary steps (in build order)

### 2.1 Project setup
- [x] TypeScript with `"strict": true`; scripts: `dev`, `build`, `start`, `test`, `lint`
- [x] Use **Express** with structured async error handling and error middleware
- [x] Config loaded once from env and **validated with Zod at startup**; the server refuses to start if something is missing
- [x] `.env` in `.gitignore`, `.env.example` committed with placeholders
- [x] Folder layering: `routes -> service -> db`. Routes never contain SQL

```ts
// config/env.ts
import { z } from "zod";
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default("*"),
});
export const env = schema.parse(process.env); // throws on bad config -> fail fast
```

### 2.2 Database (Supabase Postgres)
- [x] Use the **pooler** connection string (not the direct host)
- [x] Single shared `pg.Pool`, small size for free tier, with timeouts
- [x] Schema in `backend/sql/001_schema.sql`, seed in `002_seed.sql`, runnable twice safely (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`)
- [x] Constraints enforce the rules, not just code: `UNIQUE (doctor_id, starts_at)`, `CHECK` on status values, foreign keys with sensible `ON DELETE`
- [x] **Idempotency key unique per patient:** `UNIQUE (patient_id, idempotency_key)`
- [x] Indexes on the columns you filter by: `slots(doctor_id, starts_at)`, `appointments(patient_id, status, created_at)`
- [x] All timestamps are `timestamptz` (UTC)
- [x] RLS **enabled on every table**, with no policies
- [x] A cheap DB check in `/health` (`SELECT 1`)

```ts
// config/db.ts
import { Pool } from "pg";
import { env } from "./env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 5,                          // free tier: keep small
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000, // fail instead of hanging forever
  statement_timeout: 10_000,       // no query may run longer than 10 s
  ssl: { rejectUnauthorized: false }, // Supabase pooler; keep if connection errors mention SSL
});

pool.on("error", (err) => console.error("Unexpected idle client error", err.message));
```

```ts
// A reusable transaction helper: begin/commit/rollback always handled
export async function withTx<T>(fn: (c: import("pg").PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release(); // ALWAYS release, or the pool leaks and the API hangs
  }
}
```

### 2.3 Authentication and sessions
- [x] Passwords hashed with bcrypt (use `bcryptjs` if native builds cause trouble on Render), cost 10-12
- [x] Login does not reveal whether the email exists (same message for both failures); compare against a dummy hash when the user is missing to avoid timing differences
- [x] Access JWT: 15 minutes, algorithm pinned (HS256), include `sub`, `role`, `exp`; verify algorithm explicitly
- [x] Refresh token: random 32+ bytes, **only its hash stored**, expiry, revoked flag; logout revokes
- [x] Separate secrets for access and refresh, 32+ characters
- [x] Rate limit login (e.g. 10 per 15 min per IP); `app.set("trust proxy", 1)` on Render so IPs are correct
- [x] `requireAuth` on every route except login, refresh, health
- [x] Expired access token returns a distinct `TOKEN_EXPIRED` code so the app knows to refresh

### 2.4 Request validation and error handling
- [x] Every body, query and param validated with Zod; unknown fields stripped
- [x] UUID params validated (malformed id returns 400, never a DB error)
- [x] One `AppError(status, code, message)` class and one central error handler
- [x] Unknown errors return a generic `INTERNAL` message; **never** send stack traces or SQL errors to the client
- [x] Consistent body: `{ "error": { "code", "message", "details?" } }`
- [x] 404 handler for unknown routes with the same error shape
- [x] Request size limit (e.g. `express.json({ limit: "10kb" })`)

### 2.5 Business rules (the heart of correctness)
- [x] **Book:** `UPDATE slots SET status='BOOKED' WHERE id=$1 AND status='AVAILABLE'`, check `rowCount`, insert appointment, all in one transaction
- [x] Reject slots in the past (server-side, not just UI)
- [x] **Idempotency:** same key returns the original result and never books twice
- [x] **Reschedule:** claim new slot, release old slot, update appointment, all in one transaction; failure leaves the original untouched
- [x] **Cancel:** safe to call twice; releases the slot only once
- [x] Only allowed status transitions (`CONFIRMED -> CANCELLED|COMPLETED`); everything else is rejected with a clear error
- [x] **Ownership:** every appointment/report query includes `patient_id = $currentUser`; others' records return 404
- [x] Reports return **metadata only**; no text fields that could carry diagnosis/treatment
- [x] List endpoints have a sane `LIMIT` (and optional pagination)

### 2.6 Security hardening
- [x] `helmet()` enabled
- [x] CORS restricted (a native app doesn't need browser CORS, so keep it tight or limited to your own origins)
- [x] HTTPS only (Render provides it); mobile base URL starts with `https://`
- [x] No secrets or tokens in logs; never log request bodies on auth routes
- [x] SQL injection: parameterized queries only (grep for template strings in SQL)
- [x] Dependencies: run `npm audit`; fix high/critical issues
- [x] Demo data is synthetic; demo passwords are only for synthetic accounts

### 2.7 Reliability and operations
- [x] `PORT` read from env; listen on `0.0.0.0`
- [x] `/health` responds fast and includes a DB check
- [x] **Graceful shutdown** on `SIGTERM` (Render sends it on deploy): stop accepting requests, finish in-flight ones, close the pool
- [x] Global handlers for `unhandledRejection` / `uncaughtException` that log and exit (so Render restarts cleanly)
- [x] Structured logging (e.g. `pino` or `winston`) with a request id per request; log method, path, status, duration, **not** PII
- [x] Timeouts everywhere: DB statement timeout, server request timeout
- [x] Idempotent seed and SQL files so a fresh database is reproducible in minutes

```ts
// server.ts (shape)
const server = app.listen(env.PORT, "0.0.0.0", () => console.log(`API on ${env.PORT}`));
const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => { await pool.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref(); // force exit if stuck
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (r) => { console.error("unhandledRejection", r); });
```

### 2.8 Backend tests (must exist)
- [x] Auth: login success, wrong password, missing token, expired token
- [x] Validation: bad body returns 400 with `VALIDATION_ERROR`
- [x] **Concurrent double-book:** two simultaneous requests, exactly one 201 and one 409
- [x] Idempotent retry returns the same reference
- [x] Ownership: patient A cannot access patient B's appointment (404)
- [x] Reschedule conflict leaves the original appointment and slots unchanged
- [x] Cancel twice is safe; cancelled slot is bookable again
- [x] Past-slot booking rejected
- [x] Use a **separate test database or schema** (never the demo data), reset between tests

### 2.9 Deployment on Render
- [x] Build: `npm ci && npm run build`; Start: `npm start`; Node version pinned (`engines` in package.json)
- [ ] Environment variables set in Render dashboard (not in repo)
- [x] Health check path set to `/health` (also pre-configured in `render.yaml`)
- [ ] After each deploy: curl `/health`, login, list doctors, book, cancel
- [x] Cold start planned for (see mobile warm-up)
- [ ] Supabase project confirmed active before submission

---

## 3. Frontend (mobile): necessary steps (in build order)

### 3.1 Project setup
- [x] Expo + TypeScript (`strict`), consistent folder layout: `api/`, `auth/`, `hooks/`, `components/`, `screens/`, `theme/`, `utils/`
- [x] Install libraries with `npx expo install` so versions match your Expo SDK
- [x] A single **theme file** with the palette, spacing, radius, font sizes (from `UI_DESIGN_BRIEF.md`); no hard-coded colours in screens
- [x] `EXPO_PUBLIC_API_URL` from env. Remember: **anything `EXPO_PUBLIC_` is visible in the app bundle**, so never put secrets in it
- [x] Icon library chosen once (e.g. Lucide via `lucide-react-native` + `react-native-svg`, or `@expo/vector-icons`); one family only
- [x] Fonts loaded before the first screen renders (splash stays until ready)

### 3.2 API layer
- [x] One Axios client: base URL, **30 s timeout**, JSON headers
- [x] Response interceptor maps backend `{error:{code}}` into a typed `ApiError`
- [x] **Single shared refresh promise** so five parallel 401s trigger one refresh
- [x] Refresh once, retry once; if refresh fails, clear session and go to Login
- [x] Responses parsed with Zod so a malformed payload becomes a handled error
- [x] **Retry policy:** automatic retries only for safe GET requests; **never** auto-retry booking, cancel or reschedule
- [x] Idempotency key generated once per booking attempt and reused for a manual retry of that same attempt
- [x] Warm-up `GET /health` on app launch (Render cold start)

```ts
// One shared refresh promise (shape)
let refreshing: Promise<string> | null = null;
export function refreshAccessToken() {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => { refreshing = null; });
  }
  return refreshing;
}
```

### 3.3 Auth and session
- [x] Refresh token in `expo-secure-store`; access token in memory only
- [x] Session restored on launch while the splash screen is still visible (no flash of the Login screen)
- [x] Logout clears secure storage, in-memory token and the query cache
- [x] No tokens, passwords or full responses in `console.log`

### 3.4 State, caching and offline
- [x] TanStack Query for server data; sensible `staleTime` per query (slots short, departments long)
- [x] Query cache persisted (AsyncStorage) for read-only offline use; cache **cleared on logout** so the next user never sees someone else's data
- [x] "Last updated" time shown whenever cached data is displayed
- [x] NetInfo-driven offline banner; **all write buttons disabled offline** with a short reason
- [x] Refetch on reconnect and when the app returns to the foreground
- [x] No optimistic "confirmed" UI for booking; confirmation only after the server says so
- [x] Mutations disable their trigger while pending; use `isPending`, not local booleans you might forget to reset

### 3.5 Navigation and lifecycle
- [x] Auth gate: signed-out users can only see Login
- [x] Android hardware **back button** behaves sensibly (confirmation screen: back goes to the list, not into the booking flow)
- [x] After booking, reset the navigation stack so Back doesn't return to the confirm button
- [x] State survives backgrounding (selected date/slot kept)
- [x] Deep-link/unknown route falls back to a safe screen, not a crash

### 3.6 Forms
- [x] Inline validation under each field, never only popups
- [x] Keyboard never hides the primary button (`KeyboardAvoidingView` / scrollable form)
- [x] Correct keyboard types, `autoComplete`, `textContentType`, `secureTextEntry` with show/hide
- [x] "Return" key moves from email to password to submit

### 3.7 Frontend tests (must exist)
- [x] Error-code to message mapper
- [x] Auth store restore/clear
- [x] Book button disabled while pending; only one request sent on double tap
- [x] `SLOT_TAKEN` shows the message and refetches slots
- [x] No success screen before success
- [x] Offline banner shows and disables writes
- [x] Malformed response handled without crash
- [x] **Network-failure test with a mocked failing API** (required by the brief)

---

## 4. Seamless UI and UX checklist

### 4.1 Perceived speed
- [x] Splash stays until fonts, session and first config are ready; no white flash
- [x] **Skeleton / tactile loaders** matching the final layout instead of blank screens or lone spinners
- [x] Cached data shown instantly, refreshed quietly in the background
- [x] Buttons respond instantly (press feedback), then show a spinner while working
- [x] Slow request (over about 5 s) switches to "This is taking a little longer than usual…" rather than looking frozen
- [x] Lists use `FlatList` with stable keys, not `ScrollView` + `.map` for long lists
- [x] Images and avatars are small; avatars can be initials (no network image needed)

### 4.2 Clarity and trust
- [x] One primary action per screen, in the thumb zone
- [x] Review step before booking, showing doctor, date, time
- [x] Reference number prominent and copyable on confirmation
- [x] Status shown with **word + icon + colour** everywhere
- [x] Error messages say what happened, what it means, what to do, and have a button
- [x] Failure messages state the real outcome ("Your appointment was not booked", "Your original appointment is unchanged")
- [x] Destructive actions (cancel, sign out) have a confirmation; the safe option is visually dominant

### 4.3 Touch and layout
- [x] Touch targets about 48 dp or larger; spacing between adjacent buttons
- [x] Safe areas respected (notch, gesture bar); status bar style matches each screen's header
- [x] Layout holds at 360 dp width and at larger system font sizes (test font scale 1.3x)
- [x] Nothing important hidden behind the keyboard or the bottom bar
- [x] Pull-to-refresh on list screens
- [ ] Light haptic feedback on key actions (book success, slot select) using `expo-haptics`, used sparingly

### 4.4 Accessibility
- [x] Every control has `accessibilityLabel` and `accessibilityRole`
- [x] Selected/disabled states exposed via `accessibilityState`
- [x] Contrast about 4.5:1 for text; never colour alone
- [x] Screen reader (TalkBack) pass through the main journey
- [x] Errors announced (accessibility live region or focus moves to the message)

### 4.5 Visual polish
- [x] Consistent spacing grid (8 px), radius and shadow tokens from the theme
- [x] One icon family, consistent stroke, tinted-square treatment for key icons
- [x] Consistent loading, empty and error components reused everywhere
- [x] Department colours consistent between list, doctor card and tag
- [x] App icon (adaptive), splash screen, and app name set properly in `app.json`
- [x] Small animations (under about 300 ms), no heavy effects

### 4.6 Copy
- [x] Plain, warm, short sentences; no jargon or error codes shown to users
- [x] Dates and times formatted for the user's locale; time zone assumption stated

---

## 5. Integration checks (frontend + backend together)

Run these on a **real phone against the deployed Render URL**.

| # | Scenario | Expected result |
|---|---|---|
| 1 | Fresh install, cold server | Splash, "waking up" message if slow, then Login. No crash |
| 2 | Login with wrong password | Friendly inline message, no token stored |
| 3 | Login, close app, reopen | Still signed in; no Login flash |
| 4 | Browse, pick slot, book | Review, confirm, success with reference and status only after server reply |
| 5 | Double-tap Confirm | One appointment only |
| 6 | Two phones book the same slot | One succeeds; other sees "just booked", fresh slots, original state intact |
| 7 | Reschedule to a taken slot | Message says current appointment unchanged |
| 8 | Cancel then check Past tab | Appears as Cancelled; slot bookable again |
| 9 | Airplane mode on a list | Cached data + offline banner + disabled actions |
| 10 | Airplane mode during booking | "Not booked yet" message; nothing created on the server |
| 11 | Turn network back on | Banner clears, data refreshes quietly |
| 12 | Wait for access token to expire (temporarily set 1 min) | Silent refresh; user notices nothing |
| 13 | Revoke refresh token (logout elsewhere) | Clean return to Login with a security message |
| 14 | Kill the server mid-request | Timeout/connection error shown, retry works |
| 15 | Background the app 5 min, return | State intact, data refreshes |
| 16 | Log out, log in as patient 2 | No trace of patient 1's cached data |
| 17 | Patient A calls patient B's appointment id (curl) | 404 |
| 18 | Large font size + TalkBack | Layout intact; labels read correctly |

---

## 6. Build and release checks (APK)

- [x] `app.json`: `name`, `slug`, `android.package` (final, hard to change), `version`, `android.versionCode`, icon, adaptive icon, splash
- [x] `eas.json` has a `preview` profile with `"android": { "buildType": "apk" }`
- [ ] Environment values for the build set via EAS env/secrets or `eas.json` (only non-secret values for the app)
- [x] `minSdkVersion` decided and written in README
- [x] Permissions reviewed in the merged manifest: INTERNET only (plus anything justified)
- [ ] Production API URL (https) in the build, not localhost or a LAN IP
- [x] Debug logging removed or disabled in production builds
- [ ] Install the **built APK** (not Expo Go) on a clean device/emulator and run integration checks 1-18
- [ ] APK size reasonable; release asset downloads and installs from the public link
- [x] Keystore not committed; EAS managed credentials are fine for this assignment

---

## 7. Documentation and evidence checks

- [x] README complete: stack, architecture, min Android, permissions, API config, demo credentials, limitations
- [x] `api-contract.md` matches the deployed behaviour (spot-check three endpoints with curl)
- [x] Mermaid diagrams render on GitHub (open the repo page and look)
- [x] `technical-note.md`: secure storage, persistence, accessibility, release-readiness
- [x] `testing.md` + saved test output + screenshots
- [ ] 3-5 minute video: install, journey, slot conflict, offline recovery
- [x] `ai-usage-and-attribution.md` honest and specific
- [ ] Form answers complete (repo URL, branch, final commit ID, APK link, backend URL, device/Android version)
- [ ] Every link opened in an incognito window
- [ ] 3-5 minute video: install, journey, slot conflict, offline recovery
- [ ] `ai-usage-and-attribution.md` honest and specific
- [ ] Form answers complete (repo URL, branch, final commit ID, APK link, backend URL, device/Android version)
- [ ] Every link opened in an incognito window

---

## 8. Final audit commands (run from the repo root before submitting)

```bash
# Secrets or tokens accidentally committed
git log -p | grep -iE "(password|secret|api[_-]?key|token)\s*[:=]" | head -50
git ls-files | grep -E "\.env$|\.keystore$|\.jks$"        # should print nothing

# Debug leftovers
grep -rn "console.log" backend/src mobile/src mobile/app 2>/dev/null
grep -rnE "TODO|FIXME|XXX" backend/src mobile/src mobile/app 2>/dev/null

# SQL built from strings (should be empty or fully reviewed)
grep -rnE "query\(\s*[\`\"'].*\\$\{" backend/src

# TypeScript escape hatches
grep -rnE ":\s*any\b|@ts-ignore|as any" backend/src mobile/src 2>/dev/null

# Hard-coded URLs and mock data
grep -rnE "localhost|127\.0\.0\.1|192\.168\.|10\.0\.2\.2" mobile/src mobile/app 2>/dev/null

# Dependency problems
(cd backend && npm audit --omit=dev)
(cd mobile && npx expo-doctor)

# Types and tests
(cd backend && npx tsc --noEmit && npm test)
(cd mobile && npx tsc --noEmit && npm test)
```

Quick concurrency check against the live API (two requests, same slot, expect one 201 and one 409):
```bash
# replace values; run both in parallel
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/appointments \
  -H "Authorization: Bearer $TOKEN_A" -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" -d '{"slotId":"SLOT_ID"}' &
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/appointments \
  -H "Authorization: Bearer $TOKEN_B" -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" -d '{"slotId":"SLOT_ID"}' &
wait
```

---

## 9. What "production-ready" honestly means for this assignment

Free tiers (Render + Supabase) cannot give real production guarantees: cold starts, project pausing, no high availability, limited backups. That is acceptable here. What you must show is that you **know** the gaps and designed around them.

Put these in your technical note under "release-readiness improvements":
- Paid always-on hosting (no cold starts) and a managed database with point-in-time recovery
- Refresh-token rotation with reuse detection
- Certificate pinning and root/jailbreak considerations
- Crash and performance monitoring (e.g. Sentry), uptime alerts
- Push reminders through FCM with a scheduled worker
- CI pipeline: lint, typecheck, tests, build on every push
- Release signing with Play App Signing, staged rollouts
- Audit logging of appointment changes, per-user rate limiting
- Offline write queue clearly labelled "pending, not confirmed"
- Accessibility review with real users, localisation, time-zone per hospital

---

## 10. Go / no-go gate before you submit

**Go only if all of these are true:**
1. A stranger can install the APK on a clean device and complete the journey with only your README
2. The slot-taken case and one offline case work and are in your video
3. No success screen can appear without server confirmation
4. Backend and mobile tests pass and evidence is saved
5. Audit commands in section 8 show nothing alarming
6. No secrets in the repo or its history
7. You can explain the booking transaction, refresh flow, secure storage choice and cache behaviour without looking at the code
8. All submission links open in an incognito window