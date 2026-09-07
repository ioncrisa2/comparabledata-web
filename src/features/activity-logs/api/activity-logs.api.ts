import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

export interface ActivityLogCauser {
  id: number
  name: string
  email: string
}

export interface ActivityLogItem {
  id: number
  log_name: string | null
  description: string
  event: string | null
  subject_type: string | null
  subject_id: number | null
  causer: ActivityLogCauser | null
  properties: Record<string, unknown> | null
  created_at: string | null
}

export interface ActivityLogDetail {
  id: number | string
  log_name: string
  description: string
  event: string
  subject_type: string
  subject_id: string
  causer: ActivityLogCauser | null
  properties: Record<string, unknown> | string
  created_at: string | null
}

export interface ActivityLogFilterParams {
  page?: number
  per_page?: number
  search?: string
  log_name?: string
  event?: string
  from_date?: string
  to_date?: string
}

export interface ActivityLogListResponse {
  data: ActivityLogItem[]
  meta: {
    current_page: number
    per_page: number
    from: number | null
    to: number | null
    total: number
    last_page: number
  }
}

function invalidResponse(action: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_RESPONSE',
    message: `Format data ${action} dari server tidak sesuai.`,
  })
}

export async function fetchActivityLogs(
  params: ActivityLogFilterParams = {},
  signal?: AbortSignal,
): Promise<ActivityLogListResponse> {
  const queryParams: Record<string, string | number> = {}
  if (params.page) queryParams.page = params.page
  if (params.per_page) queryParams.per_page = params.per_page
  if (params.search) queryParams.search = params.search
  if (params.log_name) queryParams.log_name = params.log_name
  if (params.event) queryParams.event = params.event
  if (params.from_date) queryParams.from_date = params.from_date
  if (params.to_date) queryParams.to_date = params.to_date

  const { data } = await apiClient.GET('/v1/activity-logs', {
    params: {
      query: queryParams as never,
    },
    signal,
  })

  if (data && data.data && data.meta) {
    return {
      data: data.data || [],
      meta: data.meta,
    }
  }

  throw invalidResponse('log aktivitas')
}

export async function fetchActivityLogDetail(
  id: number | string,
  signal?: AbortSignal,
): Promise<ActivityLogDetail> {
  const { data } = await apiClient.GET('/v1/activity-logs/{id}', {
    params: {
      path: { id: String(id) },
    },
    signal,
  })

  if (data && data.data) {
    return data.data as unknown as ActivityLogDetail
  }

  throw invalidResponse('detail log aktivitas')
}
