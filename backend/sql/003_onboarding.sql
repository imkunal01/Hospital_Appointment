-- ============================================================================
-- 003_onboarding.sql: Add User Onboarding, Verification, and Demographics
-- ============================================================================

-- 1. Extend users table for onboarding attributes
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'LOCAL' CHECK (auth_provider IN ('LOCAL', 'GOOGLE'));

-- 2. Mock OTP Phone Verifications
CREATE TABLE IF NOT EXISTS phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for phone verification lookups
CREATE INDEX IF NOT EXISTS idx_phone_verifications_lookup 
ON phone_verifications(user_id, phone, expires_at);

-- Security: Enable RLS on phone_verifications with no public policies
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- 3. Mark existing seed accounts as already onboarded
UPDATE users 
SET 
  phone_verified = TRUE,
  onboarding_completed = TRUE
WHERE email IN ('patient1@example.test', 'patient2@example.test', 'admin@example.test');

