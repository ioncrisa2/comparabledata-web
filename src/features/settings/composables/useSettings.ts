import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { clearAppCache, fetchSettings, updateSettings } from '../api/settings.api'

export const SETTINGS_QUERY_KEY = ['settings'] as const

export function useSettingsQuery() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: ({ signal }) => fetchSettings(signal),
    staleTime: 60_000,
  })
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: FormData | Record<string, unknown>) => updateSettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
    },
  })
}

export function useClearCacheMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => clearAppCache(),
    onSuccess: () => {
      void queryClient.invalidateQueries()
    },
  })
}
