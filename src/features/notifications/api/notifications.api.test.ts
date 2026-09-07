import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notifications.api'

describe('notifications.api', () => {
  it('fetches notifications with unread count and pagination', async () => {
    let capturedUrl: URL | null = null
    mockServer.use(
      http.get('*/api/v1/notifications', ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({
          status: 'success',
          message: 'Daftar notifikasi berhasil diambil.',
          unread_count: 3,
          data: [
            {
              id: 'notif-1',
              type: 'App\\Notifications\\DeleteRequestApproved',
              data: {
                title: 'Permohonan Hapus Disetujui',
                message: 'Data pembanding #42 telah disetujui untuk dihapus.',
              },
              read_at: null,
              created_at: '2026-09-07T08:00:00Z',
            },
          ],
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: 1,
            total: 1,
            last_page: 1,
          },
          links: {
            first: '',
            last: '',
            prev: null,
            next: null,
          },
        })
      }),
    )

    const result = await fetchNotifications({ unread: true, page: 1 })
    const url = capturedUrl as URL | null
    expect(url?.searchParams.get('unread')).toBe('1')
    expect(result.unread_count).toBe(3)
    expect(result.data).toHaveLength(1)
    expect(result.data[0]?.id).toBe('notif-1')
  })

  it('marks single notification as read via PATCH', async () => {
    let capturedId = ''
    mockServer.use(
      http.patch('*/api/v1/notifications/:id/read', ({ params }) => {
        capturedId = String(params.id)
        return HttpResponse.json({
          status: 'success',
          message: 'Notifikasi telah ditandai sebagai dibaca.',
          data: null,
        })
      }),
    )

    await markNotificationAsRead('notif-123')
    expect(capturedId).toBe('notif-123')
  })

  it('marks all notifications as read via POST', async () => {
    let called = false
    mockServer.use(
      http.post('*/api/v1/notifications/read-all', () => {
        called = true
        return HttpResponse.json({
          status: 'success',
          message: 'Semua notifikasi telah ditandai sebagai dibaca.',
          data: null,
        })
      }),
    )

    await markAllNotificationsAsRead()
    expect(called).toBe(true)
  })
})
