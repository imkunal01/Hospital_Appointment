# REST API Contract

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management  
> Version: 1.0.0

---

## 1. Overview & Conventions

- **Production Base URL:** `https://hospital-appointment-api.onrender.com`
- **Local Base URL:** `http://localhost:4000` (or `http://10.0.2.2:4000` inside Android Emulator)
- **Content-Type:** `application/json`
- **Authentication Scheme:** `Bearer <JWT_ACCESS_TOKEN>` in the `Authorization` HTTP header.
- **Access Token Lifetime:** 15 minutes.
- **Refresh Token Lifetime:** 7 days (Hashed server-side; stored in `expo-secure-store` client-side).

---

## 2. Standard Error Response Shape

All non-2xx responses strictly conform to the following schema:

```json
{
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Human-readable actionable error message",
    "details": [ /* optional field-level validation errors or metadata */ ]
  }
}
```

### 2.1 Standard Error Code Reference

| HTTP Status | Error Code | Description | Typical Action |
|---|---|---|---|
| `400` | `VALIDATION_ERROR` | Request payload fails schema validation or is malformed. | Inspect `details` array; highlight input fields in UI. |
| `401` | `UNAUTHORIZED` | Missing, malformed, or invalid access token. | Prompt user to log in or initiate refresh flow. |
| `401` | `TOKEN_EXPIRED` | Access token has expired. | Attempt transparent refresh via `/auth/refresh`. |
| `403` | `FORBIDDEN` | Authenticated user lacks permission for the target resource. | Block navigation; display forbidden message. |
| `404` | `NOT_FOUND` | Resource not found or owned by another user. | Show 404 empty state; navigate back. |
| `409` | `SLOT_TAKEN` | Slot was booked by another user before confirmation. | Invalidate slots query, refresh view, prompt user to select another slot. |
| `429` | `RATE_LIMITED` | Too many requests sent in a short window. | Show retry-after countdown; disable submit button. |
| `500` | `INTERNAL` | Unexpected internal server error. | Display friendly fallback error; offer manual retry. |

---

## 3. Endpoints

### 3.1 Health Check (Public)

#### `GET /health`
Returns the status of the server and database connectivity. Used for initial wake-up ping and health monitoring.

**Response `200 OK` (Healthy):**
```json
{
  "status": "healthy",
  "service": "hospital-appointment-backend",
  "uptimeSeconds": 124,
  "timestamp": "2026-11-07T02:40:00.000Z",
  "database": {
    "connected": true,
    "latencyMs": 14
  }
}
```

**Response `503 Service Unavailable` (Degraded):**
```json
{
  "status": "degraded",
  "service": "hospital-appointment-backend",
  "uptimeSeconds": 5,
  "timestamp": "2026-11-07T02:40:00.000Z",
  "database": {
    "connected": false,
    "error": "Database connection failed"
  }
}
```

---

### 3.2 Roadmap: Upcoming Phase 1 & 2 Endpoints

| Method | Endpoint | Auth | Purpose | Phase |
|---|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticate patient; returns access JWT + refresh token. | Phase 1 |
| `POST` | `/auth/refresh` | Public | Issues new access token from valid refresh token. | Phase 1 |
| `POST` | `/auth/logout` | Authenticated | Revokes refresh token in database. | Phase 1 |
| `GET` | `/departments` | Authenticated | List all medical departments. | Phase 1 |
| `GET` | `/doctors` | Authenticated | List doctors with optional `?departmentId=` filter. | Phase 1 |
| `GET` | `/doctors/:id/slots` | Authenticated | List available slots with `?date=YYYY-MM-DD`. | Phase 1 |
| `POST` | `/appointments` | Authenticated | Book a slot with `Idempotency-Key` header. | Phase 2 |
| `GET` | `/appointments` | Authenticated | List patient's appointments (`?scope=upcoming\|past`). | Phase 2 |
| `GET` | `/appointments/:id` | Authenticated | Get appointment details (scoped to patient). | Phase 2 |
| `PATCH` | `/appointments/:id/reschedule`| Authenticated | Atomically switch slot to `newSlotId`. | Phase 2 |
| `POST` | `/appointments/:id/cancel` | Authenticated | Cancel appointment and free the slot. | Phase 2 |
| `GET` | `/appointments/:id/reports` | Authenticated | Retrieve visit report metadata (strictly non-diagnostic). | Phase 2 |
| `GET` | `/me/preferences` | Authenticated | Retrieve reminder preferences. | Phase 2 |
| `PUT` | `/me/preferences` | Authenticated | Update reminder notification preferences. | Phase 2 |
