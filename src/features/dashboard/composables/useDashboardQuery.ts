import { useQuery } from '@tanstack/vue-query'

import { fetchDashboard } from '../api/dashboard.api'

export const dashboardKey = ['dashboard'] as const

export function useDashboardQuery() {
  return useQuery({
    queryKey: dashboardKey,
    queryFn: ({ signal }) => fetchDashboard(signal),
    staleTime: 60_000,
  })
}
