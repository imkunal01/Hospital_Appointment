-- ============================================================================
-- 001_schema.sql: Hospital Appointment System Schema
-- ============================================================================
-- Notes:
-- 1. All primary keys use UUIDs (gen_random_uuid()).
-- 2. Row Level Security (RLS) is ENABLED on all tables with NO policies.
--    This ensures Supabase PostgREST public endpoints cannot expose or alter data.
--    Our Node.js backend connects using the PostgreSQL connection string with
--    privileged database credentials.
-- 3. Synthetic data only. Visit reports contain METADATA ONLY.
--    NO diagnosis or treatment text exists in schema or database.
-- ============================================================================

-- Enable pgcrypto if not already enabled (for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('PATIENT', 'ADMIN')),
    phone TEXT UNIQUE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    dob DATE,
    location TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    auth_provider TEXT NOT NULL DEFAULT 'LOCAL' CHECK (auth_provider IN ('LOCAL', 'GOOGLE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1b. Phone Verifications (Mock OTP service)
CREATE TABLE IF NOT EXISTS phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Refresh Tokens (Stores SHA-256 / bcrypt hash of token, never plain token)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);

-- 4. Doctors
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    bio TEXT
);

-- 5. Appointment Slots
CREATE TABLE IF NOT EXISTS slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED')),
    CONSTRAINT uq_doctor_slot_start UNIQUE (doctor_id, starts_at)
);

-- 6. Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED')),
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Visit Reports (Strictly Metadata Only - NO diagnosis or treatment fields)
CREATE TABLE IF NOT EXISTS visit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    report_type TEXT NOT NULL,
    report_date DATE NOT NULL,
    file_size_kb INTEGER NOT NULL
);

-- 8. Reminder Preferences
CREATE TABLE IF NOT EXISTS reminder_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    hours_before INTEGER NOT NULL DEFAULT 24 CHECK (hours_before >= 1 AND hours_before <= 72),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & query scoping
CREATE INDEX IF NOT EXISTS idx_slots_doctor_starts_at ON slots(doctor_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_slots_starts_at ON slots(starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_created_at ON appointments(patient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_appointments_slot_id ON appointments(slot_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department_id);

-- Security: Enable RLS on all tables with NO policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_preferences ENABLE ROW LEVEL SECURITY;

