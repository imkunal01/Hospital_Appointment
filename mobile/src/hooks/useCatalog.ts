import { useQuery } from '@tanstack/react-query';
import { getDepartmentsApi, getDoctorsApi, getDoctorSlotsApi } from '../api/endpoints.js';

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: getDepartmentsApi,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
}

export function useDoctors(departmentId?: string) {
  return useQuery({
    queryKey: ['doctors', departmentId],
    queryFn: () => getDoctorsApi(departmentId),
    staleTime: 5 * 60 * 1000
  });
}

export function useDoctorSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: ['slots', doctorId, date],
    queryFn: () => getDoctorSlotsApi(doctorId, date),
    enabled: Boolean(doctorId && date),
    staleTime: 30 * 1000 // 30 seconds
  });
}

