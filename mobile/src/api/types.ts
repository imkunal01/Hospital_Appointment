export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'PATIENT' | 'ADMIN';
}

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Department {
  id: string;
  name: string;
}

export interface Doctor {
  id: string;
  departmentId: string;
  departmentName: string;
  name: string;
  specialty: string;
  bio: string | null;
}

export interface Slot {
  id: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  status: 'AVAILABLE' | 'BOOKED';
}

export interface Appointment {
  id: string;
  reference: string;
  patientId: string;
  slotId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  startsAt: string;
  endsAt: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  departmentId: string;
  departmentName: string;
  createdAt: string;
  updatedAt: string;
}

export interface VisitReportMetadata {
  id: string;
  appointmentId: string;
  title: string;
  reportType: string;
  reportDate: string;
  fileSizeKb: number;
}

export interface ReminderPreferences {
  enabled: boolean;
  hoursBefore: number;
}
