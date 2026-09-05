import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { fetchDashboard } from './dashboard.api'

describe('dashboard API', () => {
  it('returns the role-aware dashboard payload', async () => {
    mockServer.use(
      http.get('*/api/v1/dashboard', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data dashboard berhasil diambil.',
          data: {
            dashboard_variant: 'data_contributor',
            map_points: [],
            stats: {
              total: 12,
              this_month: 3,
              last_month: 2,
              with_coords: 10,
              province_count: 4,
            },
            jenis_listing_options: [],
            can: {},
            can_widgets: {},
            delete_request_alert: null,
          },
        }),
      ),
    )

    await expect(fetchDashboard()).resolves.toMatchObject({
      dashboard_variant: 'data_contributor',
      stats: { total: 12, this_month: 3 },
    })
  })
})
