import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAppointmentsApi,
  getAppointmentByIdApi,
  rescheduleAppointmentApi,
  cancelAppointmentApi,
  getAppointmentReportsApi
} from '../api/endpoints.js';
import { Appointment, VisitReportMetadata } from '../api/types.js';

export function useAppointments(scope: 'upcoming' | 'past') {
  return useQuery({
    queryKey: ['appointments', scope],
    queryFn: () => getAppointmentsApi(scope),
    staleTime: 60 * 1000 // 1 minute
  });
}

export function useAppointmentDetail(id: string) {
  return useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointmentByIdApi(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    Appointment,
    any,
    { appointmentId: string; newSlotId: string; doctorId?: string; date?: string }
  >({
    mutationFn: ({ appointmentId, newSlotId }) =>
      rescheduleAppointmentApi(appointmentId, newSlotId),
    onSuccess: (updatedAppointment, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.setQueryData(['appointment', variables.appointmentId], updatedAppointment);
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
    onError: (_err, variables) => {
      // Refresh slots on collision
      if (variables.doctorId && variables.date) {
        queryClient.invalidateQueries({
          queryKey: ['slots', variables.doctorId, variables.date]
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['slots'] });
      }
    }
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    { appointment: Appointment; message: string },
    any,
    { appointmentId: string }
  >({
    mutationFn: ({ appointmentId }) => cancelAppointmentApi(appointmentId),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.setQueryData(['appointment', variables.appointmentId], result.appointment);
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    }
  });
}

export function useAppointmentReports(appointmentId: string) {
  return useQuery<VisitReportMetadata[]>({
    queryKey: ['appointment-reports', appointmentId],
    queryFn: () => getAppointmentReportsApi(appointmentId),
    enabled: Boolean(appointmentId),
    staleTime: 5 * 60 * 1000
  });
}

