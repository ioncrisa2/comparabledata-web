import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

export interface NotificationItem {
  id: string
  type: string
  data: Record<string, unknown> | unknown[]
  read_at: string | null
  created_at: string | null
}

export interface NotificationMeta {
  current_page: number
  per_page: number
  from: number | null
  to: number | null
  total: number
  last_page: number
}

export interface NotificationListResponse {
  unread_count: number
  data: NotificationItem[]
  meta: NotificationMeta
}

export interface FetchNotificationsParams {
  unread?: boolean
  page?: number
  per_page?: number
}

function invalidResponse(action: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_RESPONSE',
    message: `Format data ${action} dari server tidak sesuai.`,
  })
}

export async function fetchNotifications(
  params: FetchNotificationsParams = {},
  signal?: AbortSignal,
): Promise<NotificationListResponse> {
  const queryParams: Record<string, string | number | boolean> = {}

  if (params.page !== undefined) queryParams.page = params.page
  if (params.per_page !== undefined) queryParams.per_page = params.per_page
  if (params.unread !== undefined) queryParams.unread = params.unread ? 1 : 0

  const { data } = await apiClient.GET('/v1/notifications', {
    params: {
      query: queryParams as never,
    },
    signal,
  })

  if (data && Array.isArray(data.data)) {
    return {
      unread_count: Number(data.unread_count ?? 0),
      data: data.data,
      meta: data.meta || {
        current_page: 1,
        per_page: 15,
        from: null,
        to: null,
        total: data.data.length,
        last_page: 1,
      },
    }
  }

  throw invalidResponse('notifikasi')
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await apiClient.PATCH('/v1/notifications/{id}/read', {
    params: {
      path: { id },
    },
  })

  if (error) {
    throw new ApiError({
      status: null,
      code: 'MARK_READ_FAILED',
      message: 'Gagal menandai notifikasi sebagai dibaca.',
    })
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { error } = await apiClient.POST('/v1/notifications/read-all')

  if (error) {
    throw new ApiError({
      status: null,
      code: 'MARK_ALL_READ_FAILED',
      message: 'Gagal menandai semua notifikasi sebagai dibaca.',
    })
  }
}
