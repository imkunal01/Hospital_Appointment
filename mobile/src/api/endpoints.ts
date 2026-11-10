import { apiClient } from './client';
import {
  AuthSession,
  Department,
  Doctor,
  Slot,
  Appointment,
  VisitReportMetadata,
  ReminderPreferences
} from './types';

// Auth Endpoints
export async function loginApi(email: string, password: string): Promise<AuthSession> {
  const res = await apiClient.post<AuthSession>('/auth/login', { email, password });
  return res.data;
}

export async function registerApi(email: string, password: string, name?: string): Promise<AuthSession> {
  const res = await apiClient.post<AuthSession>('/auth/register', { email, password, name });
  return res.data;
}

export async function googleAuthApi(email: string, name: string, googleId?: string): Promise<AuthSession> {
  const res = await apiClient.post<AuthSession>('/auth/google', { email, name, googleId });
  return res.data;
}

export async function getMeApi() {
  const res = await apiClient.get('/auth/me');
  return res.data;
}

// Onboarding Endpoints
export async function sendPhoneOtpApi(phone: string): Promise<{ success: boolean; message: string; mockOtp: string }> {
  const res = await apiClient.post('/onboarding/phone/send-otp', { phone });
  return res.data;
}

export async function verifyPhoneOtpApi(phone: string, otp: string): Promise<{ success: boolean; message: string; phoneVerified: boolean }> {
  const res = await apiClient.post('/onboarding/phone/verify-otp', { phone, otp });
  return res.data;
}

export async function updateProfileApi(
  name: string,
  dob: string,
  location: string
): Promise<{ user: any; age: number }> {
  const res = await apiClient.put('/onboarding/profile', { name, dob, location });
  return res.data;
}

export async function logoutApi(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

// Catalog Endpoints
export async function getDepartmentsApi(): Promise<Department[]> {
  const res = await apiClient.get<Department[]>('/departments');
  return res.data;
}

export async function getDoctorsApi(departmentId?: string): Promise<Doctor[]> {
  const res = await apiClient.get<Doctor[]>('/doctors', {
    params: departmentId ? { departmentId } : undefined
  });
  return res.data;
}

export async function getDoctorSlotsApi(doctorId: string, date: string): Promise<Slot[]> {
  const res = await apiClient.get<Slot[]>(`/doctors/${doctorId}/slots`, {
    params: { date }
  });
  return res.data;
}

// Appointment Endpoints
export async function bookAppointmentApi(
  slotId: string,
  idempotencyKey?: string
): Promise<Appointment> {
  const res = await apiClient.post<Appointment>(
    '/appointments',
    { slotId },
    {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined
    }
  );
  return res.data;
}

export async function getAppointmentsApi(scope: 'upcoming' | 'past'): Promise<Appointment[]> {
  const res = await apiClient.get<Appointment[]>('/appointments', {
    params: { scope }
  });
  return res.data;
}

export async function getAppointmentByIdApi(id: string): Promise<Appointment> {
  const res = await apiClient.get<Appointment>(`/appointments/${id}`);
  return res.data;
}

export async function rescheduleAppointmentApi(
  appointmentId: string,
  newSlotId: string
): Promise<Appointment> {
  const res = await apiClient.patch<Appointment>(
    `/appointments/${appointmentId}/reschedule`,
    { newSlotId }
  );
  return res.data;
}

export async function cancelAppointmentApi(
  appointmentId: string
): Promise<{ appointment: Appointment; message: string }> {
  const res = await apiClient.post<{ appointment: Appointment; message: string }>(
    `/appointments/${appointmentId}/cancel`
  );
  return res.data;
}

export async function getAppointmentReportsApi(
  appointmentId: string
): Promise<VisitReportMetadata[]> {
  const res = await apiClient.get<VisitReportMetadata[]>(
    `/appointments/${appointmentId}/reports`
  );
  return res.data;
}

// Preferences Endpoints
export async function getPreferencesApi(): Promise<ReminderPreferences> {
  const res = await apiClient.get<ReminderPreferences>('/me/preferences');
  return res.data;
}

export async function updatePreferencesApi(
  prefs: ReminderPreferences
): Promise<ReminderPreferences> {
  const res = await apiClient.put<ReminderPreferences>('/me/preferences', prefs);
  return res.data;
}

