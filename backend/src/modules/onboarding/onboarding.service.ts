import { query } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { SendOtpInput, VerifyOtpInput, UpdateProfileInput } from './onboarding.schema.js';
import { UserProfileDTO } from '../auth/auth.service.js';

export function calculateAge(dobString: string): number {
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export async function sendPhoneOtp(
  userId: string,
  input: SendOtpInput
): Promise<{ success: boolean; message: string; mockOtp: string; phone: string }> {
  const normalizedPhone = input.phone.trim();

  // 1. Check if phone is already registered & verified by another user
  const duplicateCheck = await query(
    'SELECT id FROM users WHERE phone = $1 AND phone_verified = TRUE AND id != $2',
    [normalizedPhone, userId]
  );

  if (duplicateCheck.rows.length > 0) {
    throw AppError.validation('This phone number is already registered to another account');
  }

  // 2. Mock OTP service (Mock 6-digit code for assessment demonstration)
  const mockOtp = '123456';
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Persist verification request
  await query(
    'INSERT INTO phone_verifications (user_id, phone, otp_code, expires_at) VALUES ($1, $2, $3, $4)',
    [userId, normalizedPhone, mockOtp, expiresAt]
  );

  // Link phone (unverified until OTP is entered)
  await query(
    'UPDATE users SET phone = $1, phone_verified = FALSE WHERE id = $2',
    [normalizedPhone, userId]
  );

  return {
    success: true,
    message: 'Verification code sent (Mock OTP: 123456)',
    mockOtp,
    phone: normalizedPhone
  };
}

export async function verifyPhoneOtp(
  userId: string,
  input: VerifyOtpInput
): Promise<{ success: boolean; message: string; phoneVerified: boolean }> {
  const normalizedPhone = input.phone.trim();

  // 1. Lookup latest unexpired verification code
  const verificationResult = await query(
    `SELECT id, otp_code, expires_at 
     FROM phone_verifications 
     WHERE user_id = $1 AND phone = $2 AND verified_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId, normalizedPhone]
  );

  const record = verificationResult.rows[0];
  if (!record) {
    throw AppError.validation('No active OTP request found for this phone number. Please request a new code.');
  }

  if (new Date() > new Date(record.expires_at)) {
    throw AppError.validation('Verification code has expired. Please request a new code.');
  }

  // Allow standard mock OTP '123456' or recorded OTP
  if (record.otp_code !== input.otp && input.otp !== '123456') {
    throw AppError.validation('Invalid verification code. Please check and try again.');
  }

  // 2. Concurrency re-check: Ensure another user didn't verify this phone in the interim
  const duplicateCheck = await query(
    'SELECT id FROM users WHERE phone = $1 AND phone_verified = TRUE AND id != $2',
    [normalizedPhone, userId]
  );

  if (duplicateCheck.rows.length > 0) {
    throw AppError.validation('This phone number is already registered to another account');
  }

  // 3. Mark verification record as verified
  await query(
    'UPDATE phone_verifications SET verified_at = NOW() WHERE id = $1',
    [record.id]
  );

  // 4. Mark user's phone as verified
  await query(
    'UPDATE users SET phone = $1, phone_verified = TRUE WHERE id = $2',
    [normalizedPhone, userId]
  );

  return {
    success: true,
    message: 'Phone number verified successfully',
    phoneVerified: true
  };
}

export async function updateOnboardingProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<{ user: UserProfileDTO; age: number }> {
  // 1. Verify user exists and has verified phone
  const userCheck = await query(
    'SELECT id, phone, phone_verified FROM users WHERE id = $1',
    [userId]
  );

  const existingUser = userCheck.rows[0];
  if (!existingUser) {
    throw AppError.notFound('User not found');
  }

  if (!existingUser.phone_verified) {
    throw AppError.validation('Phone number must be verified before completing profile setup');
  }

  const age = calculateAge(input.dob);

  // 2. Update user profile and mark onboarding completed
  const updateResult = await query(
    `UPDATE users 
     SET name = $1, dob = $2, location = $3, onboarding_completed = TRUE
     WHERE id = $4
     RETURNING id, email, name, role, phone, phone_verified, dob, location, onboarding_completed, auth_provider`,
    [input.name.trim(), input.dob, input.location.trim(), userId]
  );

  const updatedUser = updateResult.rows[0];

  return {
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      phone: updatedUser.phone,
      phoneVerified: Boolean(updatedUser.phone_verified),
      dob: updatedUser.dob ? (updatedUser.dob.toISOString ? updatedUser.dob.toISOString().split('T')[0] : String(updatedUser.dob)) : null,
      location: updatedUser.location,
      onboardingCompleted: Boolean(updatedUser.onboarding_completed),
      authProvider: updatedUser.auth_provider
    },
    age
  };
}

