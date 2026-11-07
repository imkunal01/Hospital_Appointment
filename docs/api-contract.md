# REST API Contract

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management  
> Version: 1.1.0 (Phase 1 Complete)

---

## 1. Overview & Conventions

- **Production Base URL:** `https://hospital-appointment-api.onrender.com`
- **Local Base URL:** `http://localhost:4000` (or `http://10.0.2.2:4000` inside Android Emulator)
- **Content-Type:** `application/json`
- **Authentication Scheme:** `Bearer <JWT_ACCESS_TOKEN>` in the `Authorization` HTTP header.
- **Access Token Lifetime:** 15 minutes.
- **Refresh Token Lifetime:** 7 days (Cryptographically random, hashed server-side with SHA-256; stored in `expo-secure-store` client-side).

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
| `401` | `UNAUTHORIZED` | Missing, malformed, or invalid access token; or invalid login credentials. | Prompt user to log in or initiate refresh flow. |
| `401` | `TOKEN_EXPIRED` | Access token has expired. | Attempt transparent refresh via `/auth/refresh`. |
| `403` | `FORBIDDEN` | Authenticated user lacks permission for the target resource. | Block navigation; display forbidden message. |
| `404` | `NOT_FOUND` | Resource not found or owned by another user. | Show 404 empty state; navigate back. |
| `409` | `SLOT_TAKEN` | Slot was booked by another user before confirmation. | Invalidate slots query, refresh view, prompt user to select another slot. |
| `429` | `RATE_LIMITED` | Too many requests sent in a short window. | Show retry-after countdown; disable submit button. |
| `500` | `INTERNAL` | Unexpected internal server error. | Display friendly fallback error; offer manual retry. |

---

## 3. Implemented Endpoints (Phase 0 & 1)

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

---

### 3.2 Authentication Endpoints

#### `POST /auth/login`
Authenticates a user via email and password. Protected by in-memory rate limiting (10 attempts per 15 minutes per IP).

**Request Headers:**
`Content-Type: application/json`

**Request Body:**
```json
{
  "email": "patient1@example.test",
  "password": "Password123!"
}
```

**Response `200 OK`:**
```json
{
  "user": {
    "id": "a1111111-1111-1111-1111-111111111111",
    "email": "patient1@example.test",
    "name": "John Doe (Synthetic)",
    "role": "PATIENT"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "4a7b9c2d1e0f8a3b7c6d5e4f3a2b1c0d...",
  "expiresIn": 900
}
```

**Error Responses:**
- `400 VALIDATION_ERROR` (malformed email, password < 6 chars):
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid request input",
      "details": [{ "field": "email", "message": "Invalid email address" }]
    }
  }
  ```
- `401 UNAUTHORIZED` (invalid credentials):
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Invalid email or password"
    }
  }
  ```
- `429 RATE_LIMITED` (too many failed attempts):
  ```json
  {
    "error": {
      "code": "RATE_LIMITED",
      "message": "Too many login attempts. Please try again in 840 seconds."
    }
  }
  ```

---

#### `POST /auth/refresh`
Exchanges a valid, unrevoked refresh token for a fresh 15-minute access token.

**Request Body:**
```json
{
  "refreshToken": "4a7b9c2d1e0f8a3b7c6d5e4f3a2b1c0d..."
}
```

**Response `200 OK`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

**Error Responses:**
- `401 UNAUTHORIZED` (revoked, expired, or non-existent refresh token):
  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Invalid refresh token"
    }
  }
  ```

---

#### `POST /auth/logout`
Revokes the provided refresh token so it cannot be used again.

**Request Body:**
```json
{
  "refreshToken": "4a7b9c2d1e0f8a3b7c6d5e4f3a2b1c0d..."
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

---

### 3.3 Catalog Endpoints (Authenticated)

#### `GET /departments`
Returns all hospital departments sorted alphabetically.

**Headers:**
`Authorization: Bearer <accessToken>`

**Response `200 OK`:**
```json
[
  {
    "id": "d1111111-1111-1111-1111-111111111111",
    "name": "Cardiology"
  },
  {
    "id": "d4444444-4444-4444-4444-444444444444",
    "name": "Dermatology"
  },
  {
    "id": "d5555555-5555-5555-5555-555555555555",
    "name": "General Medicine"
  },
  {
    "id": "d2222222-2222-2222-2222-222222222222",
    "name": "Orthopedics"
  },
  {
    "id": "d3333333-3333-3333-3333-333333333333",
    "name": "Pediatrics"
  }
]
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing, invalid, or malformed Bearer token.
- `401 TOKEN_EXPIRED`: Access token expired. Client should call `/auth/refresh`.

---

#### `GET /doctors`
Returns doctors, optionally filtered by `departmentId`.

**Headers:**
`Authorization: Bearer <accessToken>`

**Query Parameters:**
- `departmentId` (optional, UUID format): Filter by department.

**Response `200 OK`:**
```json
[
  {
    "id": "c1111111-1111-1111-1111-111111111111",
    "departmentId": "d1111111-1111-1111-1111-111111111111",
    "departmentName": "Cardiology",
    "name": "Dr. Sarah Mitchell",
    "specialty": "Interventional Cardiology",
    "bio": "Board-certified cardiologist specializing in preventive cardiac health and vascular assessments."
  },
  {
    "id": "c2222222-2222-2222-2222-222222222222",
    "departmentId": "d1111111-1111-1111-1111-111111111111",
    "departmentName": "Cardiology",
    "name": "Dr. Robert Chen",
    "specialty": "Electrophysiology",
    "bio": "Experienced in heart rhythm monitoring and non-invasive cardiovascular evaluations."
  }
]
```

**Error Responses:**
- `400 VALIDATION_ERROR`: If `departmentId` is not a valid UUID format.

---

#### `GET /doctors/:id/slots?date=YYYY-MM-DD`
Returns available, unbooked appointment slots for a specific doctor on a target date.

**Headers:**
`Authorization: Bearer <accessToken>`

**URL Parameters:**
- `id` (required, UUID): Doctor's unique identifier.

**Query Parameters:**
- `date` (required, string in `YYYY-MM-DD` format): Target calendar date.

**Response `200 OK`:**
```json
[
  {
    "id": "s2222222-2222-2222-2222-222222222222",
    "doctorId": "c1111111-1111-1111-1111-111111111111",
    "startsAt": "2026-11-08T09:00:00.000Z",
    "endsAt": "2026-11-08T09:45:00.000Z",
    "status": "AVAILABLE"
  },
  {
    "id": "s3333333-3333-3333-3333-333333333333",
    "doctorId": "c1111111-1111-1111-1111-111111111111",
    "startsAt": "2026-11-08T10:00:00.000Z",
    "endsAt": "2026-11-08T10:45:00.000Z",
    "status": "AVAILABLE"
  }
]
```

**Error Responses:**
- `400 VALIDATION_ERROR`: If `:id` is not a valid UUID or `date` is not formatted as `YYYY-MM-DD`.
- `404 NOT_FOUND`: If doctor ID does not exist in database.

---

## 4. Upcoming Phase 2 Endpoints (Booking Engine)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/appointments` | Authenticated | Book a slot with `Idempotency-Key` header. |
| `GET` | `/appointments` | Authenticated | List patient's appointments (`?scope=upcoming\|past`). |
| `GET` | `/appointments/:id` | Authenticated | Get appointment details (scoped to patient). |
| `PATCH` | `/appointments/:id/reschedule`| Authenticated | Atomically switch slot to `newSlotId`. |
| `POST` | `/appointments/:id/cancel` | Authenticated | Cancel appointment and free the slot. |
| `GET` | `/appointments/:id/reports` | Authenticated | Retrieve visit report metadata (strictly non-diagnostic). |
| `GET` | `/me/preferences` | Authenticated | Retrieve reminder preferences. |
| `PUT` | `/me/preferences` | Authenticated | Update reminder notification preferences. |
