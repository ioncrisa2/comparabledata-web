import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'
import type { operations } from '@/shared/api/generated/schema'

type DashboardResponse = operations['dashboard']['responses'][200]['content']['application/json']

export type DashboardData = DashboardResponse['data']

export async function fetchDashboard(signal?: AbortSignal): Promise<DashboardData> {
  const { data } = await apiClient.GET('/v1/dashboard', { signal })

  if (data?.data) return data.data

  throw new ApiError({
    status: null,
    code: 'INVALID_API_RESPONSE',
    message: 'Server tidak mengembalikan data dashboard yang valid.',
  })
}
