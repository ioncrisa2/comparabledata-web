import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import {
  fetchNotifications,
  type FetchNotificationsParams,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from '../api/notifications.api'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: FetchNotificationsParams) => [...notificationKeys.all, 'list', params] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
}

export function useNotificationsQuery(
  params: MaybeRefOrGetter<FetchNotificationsParams> = {},
  options: { refetchInterval?: number | false; enabled?: MaybeRefOrGetter<boolean> } = {},
) {
  return useQuery({
    queryKey: computed(() => notificationKeys.list(toValue(params))),
    queryFn: ({ signal }) => fetchNotifications(toValue(params), signal),
    refetchInterval: options.refetchInterval ?? 30_000,
    enabled: options.enabled,
  })
}

export function useMarkNotificationAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllNotificationsAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function parseNotificationContent(item: NotificationItem): {
  title: string
  message: string
  url?: string
} {
  const rawData = item.data

  let title = 'Pemberitahuan Sistem'
  let message = 'Anda memiliki pembaruan sistem.'
  let url: string | undefined

  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
    const d = rawData
    if (typeof d.title === 'string') title = d.title
    else if (typeof d.judul === 'string') title = d.judul

    if (typeof d.message === 'string') message = d.message
    else if (typeof d.pesan === 'string') message = d.pesan
    else if (typeof d.body === 'string') message = d.body

    if (typeof d.url === 'string') url = d.url
    else if (typeof d.action_url === 'string') url = d.action_url
  }

  return { title, message, url }
}
