-- ============================================================================
-- 002_seed.sql: Synthetic Test Data
-- ============================================================================
-- NOTE:
-- All data is completely synthetic.
-- Patients:
--   1. patient1@example.test (Password: Password123!)
--   2. patient2@example.test (Password: Password123!)
-- Visit reports contain strictly METADATA (title, type, date, size).
-- NO diagnostic or treatment text is included.
-- Slots are generated dynamically for the next 14 days (9 AM, 10 AM, 11 AM, 2 PM, 3 PM, 4 PM UTC).
-- ============================================================================

-- 1. Synthetic Patients
-- Pre-computed bcrypt hash (cost 10) for 'Password123!':
-- $2b$10$igkQKasz2eImnyB8EZYzhuc5FFwAx2/wMK/JVBdLwigP2FQyA0/VO
INSERT INTO users (id, email, password_hash, name, role)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'patient1@example.test', '$2b$10$igkQKasz2eImnyB8EZYzhuc5FFwAx2/wMK/JVBdLwigP2FQyA0/VO', 'John Doe (Synthetic)', 'PATIENT'),
  ('a2222222-2222-2222-2222-222222222222', 'patient2@example.test', '$2b$10$igkQKasz2eImnyB8EZYzhuc5FFwAx2/wMK/JVBdLwigP2FQyA0/VO', 'Jane Smith (Synthetic)', 'PATIENT')
ON CONFLICT (email) DO NOTHING;

-- 2. Patient Default Reminder Preferences
INSERT INTO reminder_preferences (user_id, enabled, hours_before)
VALUES
  ('a1111111-1111-1111-1111-111111111111', TRUE, 24),
  ('a2222222-2222-2222-2222-222222222222', TRUE, 12)
ON CONFLICT (user_id) DO NOTHING;

-- 3. Departments
INSERT INTO departments (id, name)
VALUES
  ('d1111111-1111-1111-1111-111111111111', 'Cardiology'),
  ('d2222222-2222-2222-2222-222222222222', 'Orthopedics'),
  ('d3333333-3333-3333-3333-333333333333', 'Pediatrics'),
  ('d4444444-4444-4444-4444-444444444444', 'Dermatology'),
  ('d5555555-5555-5555-5555-555555555555', 'General Medicine')
ON CONFLICT (name) DO NOTHING;

-- 4. Doctors (12 synthetic doctors)
INSERT INTO doctors (id, department_id, name, specialty, bio)
VALUES
  -- Cardiology
  ('c1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'Dr. Sarah Mitchell', 'Interventional Cardiology', 'Board-certified cardiologist specializing in preventive cardiac health and vascular assessments.'),
  ('c2222222-2222-2222-2222-222222222222', 'd1111111-1111-1111-1111-111111111111', 'Dr. Robert Chen', 'Electrophysiology', 'Experienced in heart rhythm monitoring and non-invasive cardiovascular evaluations.'),
  
  -- Orthopedics
  ('c3333333-3333-3333-3333-333333333333', 'd2222222-2222-2222-2222-222222222222', 'Dr. Elena Rostova', 'Joint Reconstruction', 'Specialist in biomechanics, sports mobility, and orthopedic rehabilitation consultations.'),
  ('c4444444-4444-4444-4444-444444444444', 'd2222222-2222-2222-2222-222222222222', 'Dr. Marcus Vance', 'Spine & Musculoskeletal', 'Focuses on spine health, posture ergonomics, and musculoskeletal injury reviews.'),

  -- Pediatrics
  ('c5555555-5555-5555-5555-555555555555', 'd3333333-3333-3333-3333-333333333333', 'Dr. Maya Patel', 'General Pediatrics', 'Dedicated pediatric specialist focused on child wellness, growth tracking, and developmental milestones.'),
  ('c6666666-6666-6666-6666-666666666666', 'd3333333-3333-3333-3333-333333333333', 'Dr. James Wilson', 'Pediatric Pulmonology', 'Clinical consultant for adolescent respiratory wellness and childhood asthma management.'),

  -- Dermatology
  ('c7777777-7777-7777-7777-777777777777', 'd4444444-4444-4444-4444-444444444444', 'Dr. Sophia Morales', 'Clinical Dermatology', 'Expert in cutaneous evaluations, allergic skin reactions, and aesthetic skin wellness.'),
  ('c8888888-8888-8888-8888-888888888888', 'd4444444-4444-4444-4444-444444444444', 'Dr. David Kim', 'Photodermatology', 'Specializing in sun-induced skin conditions, barrier repair, and preventative skin exams.'),

  -- General Medicine
  ('c9999999-9999-9999-9999-999999999999', 'd5555555-5555-5555-5555-555555555555', 'Dr. Rachel Adams', 'Family Medicine', 'Comprehensive primary care, routine wellness exams, and chronic care coordination.'),
  ('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'd5555555-5555-5555-5555-555555555555', 'Dr. Anthony Hughes', 'Internal Medicine', 'Physician focused on preventive medicine, metabolic health, and general health screenings.'),
  ('cbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'd5555555-5555-5555-5555-555555555555', 'Dr. Laura Bennett', 'Geriatric & Preventive', 'Providing specialized consultation for active aging, preventive screenings, and routine care.'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'd5555555-5555-5555-5555-555555555555', 'Dr. Tariq Al-Mansoor', 'Preventive Health', 'Consultant physician specializing in annual physicals, lifestyle health, and preventive counseling.')
ON CONFLICT (id) DO NOTHING;

-- 5. Dynamic Appointment Slots: Next 14 days for all doctors
-- 6 slots per day per doctor (09:00, 10:00, 11:00, 14:00, 15:00, 16:00 UTC)
INSERT INTO slots (doctor_id, starts_at, ends_at, status)
SELECT 
  d.id AS doctor_id,
  (day_date + slot_time)::timestamptz AS starts_at,
  (day_date + slot_time + INTERVAL '45 minutes')::timestamptz AS ends_at,
  'AVAILABLE' AS status
FROM doctors d
CROSS JOIN generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '13 days', INTERVAL '1 day') AS day_date
CROSS JOIN (
  VALUES 
    (TIME '09:00:00'),
    (TIME '10:00:00'),
    (TIME '11:00:00'),
    (TIME '14:00:00'),
    (TIME '15:00:00'),
    (TIME '16:00:00')
) AS times(slot_time)
ON CONFLICT (doctor_id, starts_at) DO NOTHING;

-- 6. Initial Synthetic Completed Appointment with Report Metadata (for patient1)
-- Create a past slot for completed visit demonstration
INSERT INTO slots (id, doctor_id, starts_at, ends_at, status)
VALUES (
  's1111111-1111-1111-1111-111111111111',
  'c1111111-1111-1111-1111-111111111111',
  CURRENT_DATE - INTERVAL '3 days' + TIME '10:00:00',
  CURRENT_DATE - INTERVAL '3 days' + TIME '10:45:00',
  'BOOKED'
)
ON CONFLICT (doctor_id, starts_at) DO NOTHING;

INSERT INTO appointments (id, reference, patient_id, slot_id, status, idempotency_key, created_at, updated_at)
VALUES (
  'b1111111-1111-1111-1111-111111111111',
  'HA-20261104-0042',
  'a1111111-1111-1111-1111-111111111111',
  's1111111-1111-1111-1111-111111111111',
  'COMPLETED',
  'init-seed-appointment-001',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE - INTERVAL '3 days'
)
ON CONFLICT (reference) DO NOTHING;

-- 7. Visit Report Metadata (Strictly Metadata Only - NO diagnosis, NO treatment)
INSERT INTO visit_reports (id, appointment_id, title, report_type, report_date, file_size_kb)
VALUES
  ('r1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Routine Cardiac ECG Tracing Summary', 'ECG_METADATA', CURRENT_DATE - INTERVAL '3 days', 342),
  ('r2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Vitals and Biometric Data Log', 'VITALS_METADATA', CURRENT_DATE - INTERVAL '3 days', 115)
ON CONFLICT (id) DO NOTHING;
