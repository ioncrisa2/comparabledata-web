import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { fetchActivityLogDetail, fetchActivityLogs } from './activity-logs.api'

describe('activity-logs.api', () => {
  it('fetches activity logs list with pagination and filters', async () => {
    let capturedUrl: URL | null = null
    mockServer.use(
      http.get('*/api/v1/activity-logs', ({ request }) => {
        capturedUrl = new URL(request.url)
        return HttpResponse.json({
          status: 'success',
          message: 'Daftar activity log berhasil diambil.',
          data: [
            {
              id: 1,
              log_name: 'pembanding',
              description: 'Membuat data pembanding baru',
              event: 'created',
              subject_type: 'App\\Models\\Pembanding',
              subject_id: 42,
              causer: {
                id: 1,
                name: 'Super Admin',
                email: 'admin@hjar.id',
              },
              properties: {
                attributes: {
                  alamat_data: 'Jl. Riau No. 12',
                },
              },
              created_at: '2026-09-01 10:00:00',
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

    const response = await fetchActivityLogs({
      search: 'pembanding',
      event: 'created',
      page: 1,
    })

    const url = capturedUrl as URL | null
    expect(url?.searchParams.get('search')).toBe('pembanding')
    expect(url?.searchParams.get('event')).toBe('created')
    expect(response.data).toHaveLength(1)
    expect(response.data[0]!.log_name).toBe('pembanding')
    expect(response.data[0]!.causer?.name).toBe('Super Admin')
  })

  it('fetches activity log detail', async () => {
    mockServer.use(
      http.get('*/api/v1/activity-logs/:id', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Detail activity log berhasil diambil.',
          data: {
            id: '1',
            log_name: 'pembanding',
            description: 'Memperbarui data pembanding',
            event: 'updated',
            subject_type: 'App\\Models\\Pembanding',
            subject_id: '42',
            causer: {
              id: '1',
              name: 'Super Admin',
              email: 'admin@hjar.id',
            },
            properties: JSON.stringify({
              old: { harga: 2000000000 },
              attributes: { harga: 2500000000 },
            }),
            created_at: '2026-09-01 11:00:00',
          },
        }),
      ),
    )

    const detail = await fetchActivityLogDetail(1)
    expect(detail.id).toBe('1')
    expect(detail.event).toBe('updated')
    expect(detail.causer?.name).toBe('Super Admin')
  })
})
