import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPreferencesApi, updatePreferencesApi } from '../api/endpoints';
import { ReminderPreferences } from '../api/types';

export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: getPreferencesApi,
    staleTime: 5 * 60 * 1000
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation<ReminderPreferences, any, ReminderPreferences>({
    mutationFn: (newPrefs) => updatePreferencesApi(newPrefs),
    onSuccess: (savedPrefs) => {
      queryClient.setQueryData(['preferences'], savedPrefs);
    }
  });
}

