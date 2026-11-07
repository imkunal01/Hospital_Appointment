# System Architecture & Diagrams

> Assessment: Algions AI Labs — Hospital Appointment Android Application  
> Domain: Hospital Management  
> Version: 2.0.0

---

## 1. High-Level Component Diagram

```mermaid
graph TD
    subgraph MobileApp ["Mobile Client (Android Device)"]
        UI["UI Screens / Views (React Native)"]
        Hooks["Custom Query/Mutation Hooks"]
        State["TanStack Query Cache + AsyncStorage"]
        SecStore["expo-secure-store (Refresh Token)"]
        Client["Axios HTTP Client + Interceptors"]
        
        UI --> Hooks
        Hooks --> State
        Hooks --> Client
        Client --> SecStore
    end

    subgraph CloudHosting ["Cloud Infrastructure"]
        API["Render Web Service (Node.js + Express + TS)"]
        Middleware["Auth, Rate Limit & Zod Validation Middleware"]
        Controllers["Service Layer (Atomic SQL Transactions)"]
        
        API --> Middleware
        Middleware --> Controllers
    end

    subgraph DatabaseLayer ["Supabase Cloud Database"]
        PG["PostgreSQL Instance (Port 6543 Session Pooler)"]
        RLS["Row Level Security (Enabled - No Public Policies)"]
        Tables["Tables: users, refresh_tokens, departments, doctors, slots, appointments, visit_reports, reminder_preferences"]
        
        PG --> RLS
        RLS --> Tables
    end

    Client -->|HTTPS / REST API| API
    Controllers -->|Raw Parameterized SQL via pg| PG
```

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o{ refresh_tokens : "owns"
    users ||--o{ appointments : "books"
    users ||--o| reminder_preferences : "configures"
    departments ||--o{ doctors : "categorizes"
    doctors ||--o{ slots : "offers"
    slots ||--o| appointments : "assigned_to"
    appointments ||--o{ visit_reports : "contains_metadata"

    users {
        uuid id PK
        string email UK
        string password_hash
        string name
        string role "PATIENT | ADMIN"
        timestamp created_at
    }

    refresh_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash
        timestamp expires_at
        timestamp revoked_at
        timestamp created_at
    }

    departments {
        uuid id PK
        string name UK
    }

    doctors {
        uuid id PK
        uuid department_id FK
        string name
        string specialty
        string bio
    }

    slots {
        uuid id PK
        uuid doctor_id FK
        timestamp starts_at
        timestamp ends_at
        string status "AVAILABLE | BOOKED"
    }

    appointments {
        uuid id PK
        string reference UK
        uuid patient_id FK
        uuid slot_id FK
        string status "CONFIRMED | CANCELLED | COMPLETED"
        string idempotency_key UK
        timestamp created_at
        timestamp updated_at
    }

    visit_reports {
        uuid id PK
        uuid appointment_id FK
        string title
        string report_type
        date report_date
        integer file_size_kb
    }

    reminder_preferences {
        uuid user_id PK, FK
        boolean enabled
        integer hours_before
        timestamp updated_at
    }
```

---

## 3. Booking Sequence Diagram (Concurrency & Conflict Paths)

```mermaid
sequenceDiagram
    autonumber
    actor Patient1 as Patient 1 (Mobile)
    actor Patient2 as Patient 2 (Mobile)
    participant API as Express API Server
    participant DB as PostgreSQL (Supabase)

    Note over Patient1,Patient2: Both patients attempt to book the exact same slot concurrently

    Patient1->>API: POST /appointments { slotId: "e111..." }<br/>(Idempotency-Key: "idemp-001")
    Patient2->>API: POST /appointments { slotId: "e111..." }<br/>(Idempotency-Key: "idemp-002")

    rect rgb(235, 248, 235)
        Note over API,DB: Transaction 1 (Patient 1 acquires lock first)
        API->>DB: BEGIN
        API->>DB: UPDATE slots SET status='BOOKED' WHERE id=$1 AND status='AVAILABLE'
        DB-->>API: rowCount = 1 (Success)
        API->>DB: INSERT INTO appointments (reference, patient_id, slot_id, status)
        API->>DB: COMMIT
        API-->>Patient1: 201 Created { reference: "HA-20261108-A93F", status: "CONFIRMED" }
    end

    rect rgb(255, 235, 235)
        Note over API,DB: Transaction 2 (Patient 2 finds slot already locked/booked)
        API->>DB: BEGIN
        API->>DB: UPDATE slots SET status='BOOKED' WHERE id=$1 AND status='AVAILABLE'
        DB-->>API: rowCount = 0 (Conflict: status is already BOOKED)
        API->>DB: ROLLBACK
        API-->>Patient2: 409 Conflict { error: { code: "SLOT_TAKEN", message: "..." } }
        Note over Patient2: Mobile app catches 409, invalidates slots cache, and re-renders available slots
    end
```

---

## 4. Appointment Status State Machine

```mermaid
stateDiagram-v2
    [*] --> CONFIRMED : POST /appointments (Server Confirmed)
    
    CONFIRMED --> CANCELLED : POST /appointments/:id/cancel<br/>(Slot released to AVAILABLE)
    CONFIRMED --> COMPLETED : Clinical visit concluded<br/>(Visit report metadata attached)
    
    CANCELLED --> CANCELLED : POST /appointments/:id/cancel<br/>(Safe idempotent no-op)
    
    CANCELLED --> [*]
    COMPLETED --> [*]

    note right of CANCELLED
        Terminal state:
        Cannot be rescheduled
        or completed
    end note

    note right of COMPLETED
        Terminal state:
        Cannot be rescheduled
        or cancelled
    end note
```

---

## 5. Mobile Architectural Layering

```
┌────────────────────────────────────────────────────────┐
│                   Screens & UI Layer                   │
│   (Login, DoctorsList, DoctorDetail, SlotPicker,      │
│    BookingConfirm, AppointmentsList, AppointmentDetail)│
└───────────────────────────┬────────────────────────────┘
                            │ Calls custom hooks
┌───────────────────────────▼────────────────────────────┐
│                    Hooks & Store                       │
│   (useDoctors, useSlots, useBookSlot, useAppointments, │
│    useSessionStore, useNetworkStatus)                  │
└───────────────────────────┬────────────────────────────┘
                            │ Reads/Writes
┌───────────────────────────▼────────────────────────────┐
│             Cache & Offline Storage Layer              │
│   (TanStack Query Cache + AsyncStorage Persister)      │
│   * Note: Writes disabled when offline                 │
└───────────────────────────┬────────────────────────────┘
                            │ Dispatches network requests
┌───────────────────────────▼────────────────────────────┐
│            API Client & Auth Interceptors              │
│   (Axios Client, 30s Timeout, Token Refresh Promise,   │
│    expo-secure-store for Refresh Token)                │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS
                            ▼
                    Backend REST API
```

---

## 6. Key Security & Integrity Guarantees

1. **No Sensitive PII:** Synthetic patients and doctors only.
2. **Metadata-Only Reports:** Schema strictly enforces that visit reports have only `title`, `report_type`, `report_date`, and `file_size_kb`. No medical diagnoses or treatment recommendations exist.
3. **Database Security (RLS Enabled):** All 8 PostgreSQL tables have Row Level Security enabled with 0 policies. Public anonymous access to Supabase PostgREST endpoints is completely blocked.
4. **Atomic Concurrency Protection:** Slots are reserved via `UPDATE slots SET status='BOOKED' WHERE id=$1 AND status='AVAILABLE'` inside an explicit database transaction. Concurrency conflicts trigger HTTP 409 `SLOT_TAKEN` with automatic UI refetching.
5. **Ownership Isolation:** All appointment queries enforce `patient_id = $userId`. Records belonging to other users return HTTP 404 `NOT_FOUND` to prevent resource enumeration.
