# REST API Contract

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management  
> Version: 2.0.0 (Backend Feature-Complete)

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
| `400` | `VALIDATION_ERROR` | Request payload fails schema validation, slot in past, or invalid state transition. | Inspect `details` array; highlight input fields in UI. |
| `401` | `UNAUTHORIZED` | Missing, malformed, or invalid access token; or invalid login credentials. | Prompt user to log in or initiate refresh flow. |
| `401` | `TOKEN_EXPIRED` | Access token has expired. | Attempt transparent refresh via `/auth/refresh`. |
| `403` | `FORBIDDEN` | Authenticated user lacks permission for the target resource. | Block navigation; display forbidden message. |
| `404` | `NOT_FOUND` | Resource not found or owned by another user (ownership isolation). | Show 404 empty state; navigate back. |
| `409` | `SLOT_TAKEN` | Slot was booked by another user before confirmation. | Invalidate slots query, refresh view, prompt user to select another slot. |
| `429` | `RATE_LIMITED` | Too many requests sent in a short window. | Show retry-after countdown; disable submit button. |
| `500` | `INTERNAL` | Unexpected internal server error. | Display friendly fallback error; offer manual retry. |

---

## 3. Appointment Lifecycle & Status States

| State | Description | Permitted Next States |
|---|---|---|
| `CONFIRMED` | Initial status upon successful booking. Slot is marked `BOOKED`. | `CANCELLED`, `COMPLETED` |
| `CANCELLED` | Patient cancelled appointment. Slot is released back to `AVAILABLE`. Safe idempotent no-op on re-cancellation. | *Terminal state* (Cannot reschedule or complete). |
| `COMPLETED` | Patient attended visit. Visit report metadata is attached. | *Terminal state* (Cannot reschedule or cancel). |

---

## 4. Endpoints

### 4.1 Health Check (Public)

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

### 4.2 Authentication Endpoints

#### `POST /auth/login`
Authenticates a user via email and password. Protected by in-memory rate limiting (10 attempts per 15 minutes per IP).

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

#### `POST /auth/logout`
Revokes the provided refresh token in the database.

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

### 4.3 Catalog Endpoints (Authenticated)

#### `GET /departments`
Returns all hospital departments sorted alphabetically.

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200 OK`:**
```json
[
  { "id": "d1111111-1111-1111-1111-111111111111", "name": "Cardiology" },
  { "id": "d4444444-4444-4444-4444-444444444444", "name": "Dermatology" }
]
```

#### `GET /doctors?departmentId=`
Returns doctors, optionally filtered by `departmentId`.

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200 OK`:**
```json
[
  {
    "id": "c1111111-1111-1111-1111-111111111111",
    "departmentId": "d1111111-1111-1111-1111-111111111111",
    "departmentName": "Cardiology",
    "name": "Dr. Sarah Mitchell",
    "specialty": "Interventional Cardiology",
    "bio": "Board-certified cardiologist specializing in preventive cardiac health."
  }
]
```

#### `GET /doctors/:id/slots?date=YYYY-MM-DD`
Returns available, unbooked slots for a doctor on a target date.

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200 OK`:**
```json
[
  {
    "id": "e2222222-2222-2222-2222-222222222222",
    "doctorId": "c1111111-1111-1111-1111-111111111111",
    "startsAt": "2026-11-08T09:00:00.000Z",
    "endsAt": "2026-11-08T09:45:00.000Z",
    "status": "AVAILABLE"
  }
]
```

---

### 4.4 Booking & Appointment Endpoints (Authenticated)

#### `POST /appointments`
Atomically books an appointment for the authenticated patient.

**Headers:**
- `Authorization: Bearer <accessToken>`
- `Idempotency-Key: <unique-client-uuid>` *(Recommended)*: Prevents duplicate bookings from network retries or repeated user taps.

**Request Body:**
```json
{
  "slotId": "e2222222-2222-2222-2222-222222222222"
}
```

**Response `201 Created` (New Booking):**
```json
{
  "id": "b2222222-2222-2222-2222-222222222222",
  "reference": "HA-20261108-A93F",
  "patientId": "a1111111-1111-1111-1111-111111111111",
  "slotId": "e2222222-2222-2222-2222-222222222222",
  "status": "CONFIRMED",
  "startsAt": "2026-11-08T09:00:00.000Z",
  "endsAt": "2026-11-08T09:45:00.000Z",
  "doctorId": "c1111111-1111-1111-1111-111111111111",
  "doctorName": "Dr. Sarah Mitchell",
  "specialty": "Interventional Cardiology",
  "departmentId": "d1111111-1111-1111-1111-111111111111",
  "departmentName": "Cardiology",
  "createdAt": "2026-11-07T08:00:00.000Z",
  "updatedAt": "2026-11-07T08:00:00.000Z"
}
```

**Response `200 OK` (Idempotent Match):**
Returned when an appointment with the identical `Idempotency-Key` was already created for this patient. Body is the existing appointment record.

**Error Responses:**
- `400 VALIDATION_ERROR`: If slot ID is not a UUID or slot starts in the past.
- `409 SLOT_TAKEN` (Concurrency conflict):
  ```json
  {
    "error": {
      "code": "SLOT_TAKEN",
      "message": "Selected appointment slot is no longer available"
    }
  }
  ```

---

#### `GET /appointments?scope=upcoming|past`
Lists appointments for the authenticated patient.

**Headers:** `Authorization: Bearer <accessToken>`

**Query Parameters:**
- `scope` (optional, `upcoming` or `past`, default `upcoming`):
  - `upcoming`: `status = 'CONFIRMED' AND starts_at >= NOW()` (sorted ascending).
  - `past`: `status IN ('CANCELLED', 'COMPLETED') OR (status = 'CONFIRMED' AND starts_at < NOW())` (sorted descending).

**Response `200 OK`:**
```json
[
  {
    "id": "b2222222-2222-2222-2222-222222222222",
    "reference": "HA-20261108-A93F",
    "patientId": "a1111111-1111-1111-1111-111111111111",
    "slotId": "e2222222-2222-2222-2222-222222222222",
    "status": "CONFIRMED",
    "startsAt": "2026-11-08T09:00:00.000Z",
    "endsAt": "2026-11-08T09:45:00.000Z",
    "doctorId": "c1111111-1111-1111-1111-111111111111",
    "doctorName": "Dr. Sarah Mitchell",
    "specialty": "Interventional Cardiology",
    "departmentId": "d1111111-1111-1111-1111-111111111111",
    "departmentName": "Cardiology",
    "createdAt": "2026-11-07T08:00:00.000Z",
    "updatedAt": "2026-11-07T08:00:00.000Z"
  }
]
```

---

#### `GET /appointments/:id`
Retrieves single appointment details. Scoped strictly to the authenticated patient.

**Headers:** `Authorization: Bearer <accessToken>`

**Error Responses:**
- `404 NOT_FOUND`: If appointment ID does not exist or belongs to another patient.

---

#### `PATCH /appointments/:id/reschedule`
Atomically moves an appointment to a new slot within a database transaction. Releases previous slot. If the new slot is taken, returns 409 and leaves the existing appointment untouched.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "newSlotId": "e3333333-3333-3333-3333-333333333333"
}
```

**Response `200 OK`:** Updated appointment record.

**Error Responses:**
- `400 VALIDATION_ERROR`: If appointment is already cancelled/completed, new slot is in past, or same slot ID.
- `404 NOT_FOUND`: If appointment does not belong to user or target slot doesn't exist.
- `409 SLOT_TAKEN`: If target slot is already booked. Original appointment remains untouched.

---

#### `POST /appointments/:id/cancel`
Cancels an appointment, transitions status to `CANCELLED`, and frees the slot back to `AVAILABLE`. Idempotent.

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200 OK`:**
```json
{
  "appointment": {
    "id": "b2222222-2222-2222-2222-222222222222",
    "reference": "HA-20261108-A93F",
    "status": "CANCELLED",
    "slotId": "e2222222-2222-2222-2222-222222222222",
    ...
  },
  "message": "Appointment successfully cancelled"
}
```

---

#### `GET /appointments/:id/reports`
Retrieves visit report metadata for an appointment. **Strictly non-diagnostic metadata only.**

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200 OK`:**
```json
[
  {
    "id": "f1111111-1111-1111-1111-111111111111",
    "appointmentId": "b1111111-1111-1111-1111-111111111111",
    "title": "Routine Cardiac ECG Tracing Summary",
    "reportType": "ECG_METADATA",
    "reportDate": "2026-11-04",
    "fileSizeKb": 342
  }
]
```

---

### 4.5 User Reminder Preferences

#### `GET /me/preferences`
Retrieves authenticated user's reminder notification preferences.

**Headers:** `Authorization: Bearer <accessToken>`

**Response `200 OK`:**
```json
{
  "enabled": true,
  "hoursBefore": 24
}
```

#### `PUT /me/preferences`
Updates user's reminder notification preferences.

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "enabled": true,
  "hoursBefore": 12
}
```

**Response `200 OK`:**
```json
{
  "enabled": true,
  "hoursBefore": 12
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: If `hoursBefore` is not between 1 and 72.
