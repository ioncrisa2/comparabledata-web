import { QueryClient } from '@tanstack/vue-query'

import { isApiError } from '@/shared/api/error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 15 * 60_000,
      refetchOnWindowFocus: true,
      retry(failureCount, error) {
        if (isApiError(error) && error.status !== null) {
          if ([401, 403, 404, 419, 422].includes(error.status)) return false
        }

        return failureCount < 2
      },
    },
    mutations: {
      retry: false,
    },
  },
})
