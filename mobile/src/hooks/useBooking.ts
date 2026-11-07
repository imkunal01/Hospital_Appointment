import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookAppointmentApi } from '../api/endpoints.js';
import { Appointment } from '../api/types.js';

interface BookSlotParams {
  slotId: string;
  idempotencyKey?: string;
  doctorId?: string;
  date?: string;
}

export function useBookSlot() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, any, BookSlotParams>({
    mutationFn: async ({ slotId, idempotencyKey }) => {
      return bookAppointmentApi(slotId, idempotencyKey);
    },
    onSuccess: (_data, variables) => {
      // Invalidate both appointment lists and slots
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      if (variables.doctorId && variables.date) {
        queryClient.invalidateQueries({
          queryKey: ['slots', variables.doctorId, variables.date]
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['slots'] });
      }
    },
    onError: (_error, variables) => {
      // When a slot conflict happens, immediately refresh availability
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

