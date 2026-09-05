import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import { fetchProvinces, fetchRegencies } from './location.api'

describe('location API', () => {
  it('sends parent and limit filters to a cascading lookup', async () => {
    mockServer.use(
      http.get('*/api/v1/locations/regencies', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('province_id')).toBe('32')
        expect(url.searchParams.get('limit')).toBe('200')

        return HttpResponse.json({
          status: 'success',
          message: 'Data Kabupaten/Kota',
          data: [
            {
              id: '3273',
              province_id: '32',
              name: 'Kota Bandung',
              created_at: null,
              updated_at: null,
            },
          ],
        })
      }),
    )

    await expect(fetchRegencies({ province_id: '32', limit: 200 })).resolves.toEqual([
      expect.objectContaining({ id: '3273', name: 'Kota Bandung' }),
    ])
  })

  it('normalizes an aborted lookup through the shared API error model', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(fetchProvinces({}, controller.signal)).rejects.toMatchObject({
      code: 'REQUEST_ABORTED',
      status: null,
    })
  })
})
